# AI Review Auto-Reply - Build Summary & Handoff

This file is a handoff for Claude Code (or any developer) picking up the project.
It records what exists, how it runs, and what still needs to be done. Written 18 Sep 2026.

> Tip: to have Claude Code auto-load this context, you can copy or rename this file to `CLAUDE.md` in the repo root.

---

## 1. What this project is

An AI-assisted Google review auto-reply dashboard for two client brands, **ACE Training** and **MultiSkills Training** (RTOs, multiple campuses each). It is being built to replace their current Birdeye auto-reply setup. Reviews are pulled from Google, a reply is drafted from the client's approved templates, and staff approve or edit before anything is published.

Priced per centre. Owner: iBusinessFormula (iBF). Client advocate: Larissa. Internal contacts: Rishad (principal), Humaira.

**Current mode: DRAFT ONLY.** Nothing is posted to Google. Birdeye is still the live system of record. The app reads reviews and drafts replies on the dashboard for review.

---

## 2. Stack

- **Backend:** NestJS 10 (TypeScript), Prisma 5 + PostgreSQL, JWT auth (argon2), plain `fetch` for external calls (no heavy SDKs).
- **Frontend:** Next.js 14 App Router, Tailwind CSS, TypeScript. Runs on port 3100.
- **Backend API:** port 4000.
- **Monorepo:** npm workspaces (`backend`, `frontend`). Root scripts orchestrate both with `concurrently`.
- **One `.env` at the repo root** configures backend, frontend and Prisma.

---

## 3. How to run locally

```bash
# 1. Postgres running locally, then:
cp .env.example .env          # fill in the values (see section 4)
npm install

# 2. Database
npm run db:generate           # prisma generate
npm run db:migrate            # prisma migrate (creates all tables)
npm run db:seed               # brands + placeholder campuses + admin user
npm run db:seed-reviews       # 8 sample reviews for local testing

# 3. Run both apps
npm run dev                   # backend :4000 + frontend :3100

# 4. Log in at http://localhost:3100/login with ADMIN_SEED_EMAIL / ADMIN_SEED_PASSWORD
```

Draft replies for the seeded reviews: log in, then `POST /reviews/process` (or use the sync endpoint once Google is connected).

Build / test:

```bash
npm run build                 # builds backend then frontend
npm test                      # backend unit tests (jest)
```

---

## 4. Environment variables (`.env`)

| Var | Purpose |
|---|---|
| `DATABASE_URL` | Postgres connection string |
| `PORT` | Backend port (4000) |
| `WEB_APP_URL` | Dashboard origin, used for CORS + OAuth redirect back-link (http://localhost:3100) |
| `NEXT_PUBLIC_API_URL` | Backend URL the browser calls (http://localhost:4000) |
| `JWT_SECRET` | Staff login signing key (>=32 chars) |
| `TOKEN_ENCRYPTION_KEY` | AES key material for encrypting Google tokens + signing OAuth state (>=32 chars) |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | OAuth client from Google Cloud Console (project `ibf-review-autoreply`) |
| `GOOGLE_OAUTH_REDIRECT_URI` | Must be `http://localhost:4000/platform-accounts/google/callback` and match the Cloud Console client exactly |
| `AI_PROVIDER` | `openai` \| `anthropic` \| `gemini` \| `mock`. NOTE: the drafting pipeline is currently templates-only and does NOT call the AI provider (see section 6). Kept for future use. |
| `OPENAI_API_KEY` etc. | Only needed if AI generation is re-enabled |
| `REVIEW_SYNC_ENABLED` | `true` to poll Google on a timer. Default `false`. Manual sync works regardless. |
| `REVIEW_SYNC_INTERVAL_MIN` | Poll interval in minutes (default 15) |
| `SLACK_WEBHOOK_URL`, `SMTP_*`, `ALERT_EMAIL_TO` | Optional approval notifications; blank disables that channel |

---

## 5. Data model (Prisma) - key tables

`backend/prisma/schema.prisma`

- **User** - staff login (ADMIN/STAFF).
- **Brand** - ACE Training, MultiSkills. Holds `tone`, `replyRules` (free-form JSON), `forbiddenWords`.
- **Location** - a campus, belongs to a Brand.
- **PlatformAccount** - one connected Google login per brand. `accessToken`/`refreshToken` stored **encrypted**. `status` CONNECTED/DISCONNECTED/ERROR.
- **PlatformLocation** - links a PlatformAccount to a Location via `externalLocationId` (stored as the full `accounts/{id}/locations/{id}` resource).
- **Review** - a fetched review. Unique on `(platform, locationId, externalReviewId)` so re-polling is idempotent and edits are detected.
- **ReviewAnalysis** - risk assessment (sentiment, riskLevel, riskFlags).
- **Reply** - `aiDraft`, `finalReply`, `status`, `aiProvider`/`aiModel`. Status lifecycle: GENERATED, PENDING_APPROVAL, APPROVED, POSTED, FAILED, REJECTED.
- **NotificationLog**, **JobRunLog** - audit of alerts and sync jobs.

---

## 6. What is BUILT

### 6a. Frontend - branded to iBusinessFormula
- Brand tokens in `frontend/tailwind.config.ts`: navy `#1C2A4A`, magenta `#DD1157`, plus `ink/muted/line/surface`, Raleway font.
- `frontend/src/components/layout/brand-mark.tsx` - iBusinessFormula wordmark lockup.
- Restyled: sidebar (icons + product sublabel), topbar, login, dashboard (real overview), reviews inbox, alerts, reports, settings, stat tiles, review card, chart tokens.
- Login flow, JWT stored in localStorage, protected dashboard layout.

### 6b. Backend - reply drafting from approved templates
- **`backend/src/replies/reply-templates.ts`** - the client's Birdeye-approved reply wordings, verbatim, per brand and scenario. Phone numbers baked in: **ACE `1800 456 094`, MST `1800 754 557`**.
  - Scenarios: `positive_comment`, `positive_noComment`, `negative_comment`, `negative_noComment` (positive = rating >= 4, comment = review has text).
  - Two variants per scenario, chosen deterministically per review; `[Name]` replaced with the reviewer's first name.
  - Deliberate gaps (held for a person, no auto text): **ACE positive-no-comment is blank in the client doc**, and **MST negative-with-comment is marked DO NOT USE**.
- **`backend/src/reviews/review-processor.service.ts`** - for each review: assess risk -> select approved template -> set status. **Draft only, nothing posted.**
  - Safe positive with a template -> `GENERATED` (ready draft on dashboard).
  - Negative, flagged (e.g. 5-star that mentions rude staff), or no approved template -> `PENDING_APPROVAL` (held; sends approval notification).
- **`backend/src/safety/sentiment-risk.service.ts`** - deterministic, rule-based risk routing (rating <= 3, plus phrase patterns for refunds, legal, staff conduct, safety, etc.). Unit-tested.
- NOTE: the AI provider modules (`backend/src/ai/**`, including `mock.provider.ts`) still exist but are **not used** by the drafting pipeline now that it is templates-only.

### 6c. Backend - read-only Google ingestion (`backend/src/platform-accounts/`)
- `token-vault.service.ts` - AES-256-GCM encrypt/decrypt of tokens (key derived from `TOKEN_ENCRYPTION_KEY`).
- `google-oauth.service.ts` - consent URL, code exchange, token refresh. Scope `https://www.googleapis.com/auth/business.manage`.
- `google-reviews.client.ts` - **read-only** client (GET only): list accounts, list locations, list reviews (My Business API v4). Has NO write/reply/delete method, so it physically cannot post.
- `platform-accounts.service.ts` - connect flow (store encrypted tokens, auto-discover + link locations), `getValidAccessToken` (refresh + re-store when expired).
- `reviews-sync.service.ts` - pulls reviews from all connected accounts, upserts new/edited ones, runs the drafting pipeline. Timer poller gated by `REVIEW_SYNC_ENABLED`; logs each run to `JobRunLog`. Read-only.
- `platform-accounts.controller.ts` - OAuth connect/callback (HMAC-signed state), list connected accounts, manual sync.

### 6d. Verified
- Backend builds, `npm test` passes (19 tests). App boots, all routes register.
- Frontend builds. Screens verified visually against seeded data earlier in the build.
- Template drafting verified end to end against the 8 seeded reviews (correct brand, phone number, name, scenario, DO-NOT-USE handling).

---

## 7. API reference

Auth (Bearer JWT on everything except the OAuth callback):
- `POST /auth/login` `{email,password}` -> `{accessToken, user}`; `GET /auth/me`
- `GET /brands`, `GET /brands/:id`, `PATCH /brands/:id` (update tone)
- `GET /locations`, `GET /locations/:id`
- `GET /reviews` (filters: `brandId`, `locationId`, `replyStatus`, `needsApproval=true`, `search`), `GET /reviews/:id`
- `POST /reviews/process` - draft replies for all unprocessed reviews
- `PATCH /replies/:id` `{finalReply}`; `POST /replies/:id/approve`; `POST /replies/:id/reject`
- `GET /reports/stats`, `GET /reports/weekly-volume`
- `GET /platform-accounts/google/connect?brandId=...` -> `{authUrl}` (open in browser)
- `GET /platform-accounts/google/callback` - OAuth redirect target (public, state-verified)
- `GET /platform-accounts` - list connected accounts
- `POST /platform-accounts/sync` - manual read-only pull + draft

---

## 8. What NEEDS TO BE DONE (TODO)

### Priority - to test live Google read
1. **Google credentials:** put the real `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` in `.env`. In Cloud Console, add redirect URI `http://localhost:4000/platform-accounts/google/callback` to the OAuth client.
2. **Enable the API:** in Cloud project `ibf-review-autoreply`, API Library -> enable **Google My Business API** (v4). (Access was approved by Google on 18 Sep 2026; case 8-1402000041118. Account Management + Business Information APIs are already enabled.)
3. **Connect (one-time OAuth consent):** call `GET /platform-accounts/google/connect?brandId=<id>` (get ids from `GET /brands`), open the returned `authUrl` signed in as `support@ibusinessformula.com.au`, grant access. The callback stores the connection and auto-discovers locations.
4. **Sync:** `POST /platform-accounts/sync` to pull reviews and draft. Optionally set `REVIEW_SYNC_ENABLED=true`.

### Frontend gaps
5. **No "Connect Google" button yet.** Add one to the Settings page: call the connect endpoint, open `authUrl`, and handle the `?connected=1&locations=N` / `?connected=0&error=...` query on return. Also show connected accounts (`GET /platform-accounts`) and a "Sync now" button (`POST /platform-accounts/sync`).
6. **Reviews page "Auto-replied" tab will be empty** until posting exists (nothing is POSTED in draft-only mode). Fine for now.

### Product decisions / larger pieces
7. **Location-to-brand mapping.** All discovered locations attach to the single brand chosen at connect. `support@` manages both ACE and MST (26 businesses), so some will land under the wrong brand. Build a Settings screen to reassign a Location's brand, or map by Google account/location id at connect.
8. **Posting to Google is NOT implemented** (intentional - Birdeye is live). When ready to switch over: add a write path using My Business v4 `accounts.locations.reviews.updateReply`, gated behind an explicit `AUTO_POST` / per-brand toggle, and wire APPROVED -> POSTED. Keep the read-only client separate from any writer.
9. **Auto-approve/auto-post policy.** Currently everything is a draft (safe positives = GENERATED, rest = PENDING_APPROVAL). Decide the go-live policy (e.g. auto-post safe positives) once posting exists.
10. **ACE positive-no-comment wording is missing** (blank in the client doc). Get the approved text from the client and add it to `reply-templates.ts`, otherwise those reviews are held for manual reply.
11. **Scheduler.** The poller is a simple in-process `setInterval` (fine for one instance). For production/multi-instance, move to a real queue (BullMQ + Redis; Redis vars already stubbed in `.env.example`).
12. **AI provider path is bypassed.** Decide whether to keep AI generation as a fallback/variation on top of templates, or remove the `ai/` module. If kept, feed the approved templates as few-shot style examples.
13. **Hardening:** rate-limit handling / backoff for Google API, token revocation handling, e2e tests for the sync path, CI, production secrets management.

---

## 9. Notable conventions / gotchas
- iBusinessFormula is always one word. Brand: navy `#1C2A4A`, magenta `#DD1157`, Raleway. No em dashes in copy.
- The reviews `needsApproval` query param had a validation bug (transform vs `@IsBooleanString`) - fixed to transform-then-`@IsBoolean`.
- Prisma `Reply.aiProvider`/`aiModel` are set to `"template"` / `"birdeye-approved-v1"` for template drafts.
- The read-only client is intentionally write-free; do not add posting to it - make a separate writer when the time comes.
