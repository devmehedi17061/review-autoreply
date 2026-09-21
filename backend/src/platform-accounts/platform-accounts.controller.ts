import { BadRequestException, Controller, Get, Inject, Post, Query, Res, UseGuards } from "@nestjs/common";
import { createHmac, timingSafeEqual } from "node:crypto";
import type { Response } from "express";
import { Env } from "../config/env.schema";
import { APP_ENV } from "../config/env.token";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { GoogleOAuthService } from "./google-oauth.service";
import { PlatformAccountsService } from "./platform-accounts.service";
import { ReviewsSyncService } from "./reviews-sync.service";

@Controller("platform-accounts")
export class PlatformAccountsController {
  constructor(
    private readonly oauth: GoogleOAuthService,
    private readonly accounts: PlatformAccountsService,
    private readonly sync: ReviewsSyncService,
    @Inject(APP_ENV) private readonly env: Env,
  ) {}

  /** Returns the Google consent URL to open. `brandId` is carried in signed state. */
  @Get("google/connect")
  @UseGuards(JwtAuthGuard)
  connect(@Query("brandId") brandId: string): { authUrl: string } {
    if (!brandId) {
      throw new BadRequestException("brandId is required");
    }
    return { authUrl: this.oauth.buildAuthUrl(this.signState(brandId)) };
  }

  /**
   * OAuth redirect target. Public by necessity (the browser arrives here without
   * a bearer token), so the brand is carried in HMAC-signed state that is
   * verified before anything is stored.
   */
  @Get("google/callback")
  async callback(@Query("code") code: string, @Query("state") state: string, @Res() res: Response): Promise<void> {
    const web = this.env.WEB_APP_URL.replace(/\/$/, "");
    try {
      if (!code || !state) {
        throw new BadRequestException("Missing code or state");
      }
      const brandId = this.verifyState(state);
      const result = await this.accounts.connectFromCode(code, brandId);
      res.redirect(`${web}/settings?connected=1&locations=${result.locationsLinked}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "connection failed";
      res.redirect(`${web}/settings?connected=0&error=${encodeURIComponent(message)}`);
    }
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  list() {
    return this.accounts.listConnectedWithCoverage();
  }

  /** Manual read-only pull, for testing without waiting for the timer. */
  @Post("sync")
  @UseGuards(JwtAuthGuard)
  runSync() {
    return this.sync.syncAll();
  }

  // ── Signed state (brandId + HMAC) ──────────────────────────────────────────
  private signState(brandId: string): string {
    const payload = Buffer.from(JSON.stringify({ b: brandId, t: Date.now() })).toString("base64url");
    return `${payload}.${this.hmac(payload)}`;
  }

  private verifyState(state: string): string {
    const [payload, sig] = state.split(".");
    if (!payload || !sig) {
      throw new BadRequestException("Malformed state");
    }
    const expected = this.hmac(payload);
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      throw new BadRequestException("State signature check failed");
    }
    const { b: brandId } = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { b: string };
    if (!brandId) {
      throw new BadRequestException("State missing brand");
    }
    return brandId;
  }

  private hmac(input: string): string {
    return createHmac("sha256", this.env.TOKEN_ENCRYPTION_KEY).update(input).digest("base64url");
  }
}
