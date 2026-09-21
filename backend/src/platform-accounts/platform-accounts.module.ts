import { Module } from "@nestjs/common";
import { ReviewsModule } from "../reviews/reviews.module";
import { GoogleOAuthService } from "./google-oauth.service";
import { GoogleReviewsClient } from "./google-reviews.client";
import { PlatformAccountsController } from "./platform-accounts.controller";
import { PlatformAccountsService } from "./platform-accounts.service";
import { ReviewsSyncService } from "./reviews-sync.service";
import { TokenVaultService } from "./token-vault.service";

/**
 * Connected Google logins and the read-only review sync built on top of them.
 * Imports ReviewsModule to reuse the ingestion and drafting pipeline.
 */
@Module({
  imports: [ReviewsModule],
  controllers: [PlatformAccountsController],
  providers: [
    TokenVaultService,
    GoogleOAuthService,
    GoogleReviewsClient,
    PlatformAccountsService,
    ReviewsSyncService,
  ],
  exports: [PlatformAccountsService, ReviewsSyncService],
})
export class PlatformAccountsModule {}
