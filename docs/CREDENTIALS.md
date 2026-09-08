# Credentials & Secret Management

Every secret the system needs, what it's for, where to get it, and how it's stored.

## One file

All configuration lives in a single `.env` at the project root, next to `backend/` and `frontend/`.
Both apps and the Prisma CLI read that same file, so a value like `DATABASE_URL` is defined exactly
once and can never drift between the API and your migrations.

```
review-autoreply/
├── .env           ← your real values (gitignored, never committed)
└── .env.example   ← the template with empty values (committed)
```

## Rules

1. **Nothing is ever committed.** `.env` is gitignored. If a secret leaks into git history, rotate
   it — deleting the file is not enough.
2. **Fail fast, not silently.** `backend/src/config/env.schema.ts` (zod) is validated once at boot in
   `backend/src/main.ts`. A missing or malformed value crashes startup with a readable list of what's
   wrong, instead of surfacing later as a confusing null-reference inside a request handler.
3. **OAuth tokens are encrypted at rest.** Google access/refresh tokens live in `platform_accounts`
   encrypted with AES-256-GCM. `backend/src/platform-accounts/token-vault.service.ts` will be the
   *only* file allowed to decrypt them — a raw token anywhere else is a bug.
4. **Passwords are argon2-hashed, never logged, never returned.** `UsersService` selects
   `passwordHash` only for the single internal auth check; every dashboard-facing query uses an
   explicit allowlist `select` that excludes it.
5. **No secrets in logs.** Logging redacts `authorization`, `accessToken`, `refreshToken` and
   `passwordHash`.

## Where each value comes from

| Variable | Used by | Where to get it |
|---|---|---|
| `DATABASE_URL` | backend + Prisma CLI | Your PostgreSQL connection string. See [SETUP.md](SETUP.md). |
| `PORT` | backend | Port the API listens on. Default 4000. |
| `WEB_APP_URL` | backend | Where the dashboard runs. **Must match the frontend's actual port** or the browser blocks API calls with a CORS error. |
| `NEXT_PUBLIC_API_URL` | frontend | The API's base URL. `NEXT_PUBLIC_` means the browser can read it — never put a real secret behind that prefix. |
| `REDIS_HOST` / `REDIS_PORT` / `REDIS_PASSWORD` | backend (phase 6+) | Your local Memurai/Redis server. Password only if you set one. |
| `JWT_SECRET` | backend | Generate: `openssl rand -base64 48`. Never reuse across environments. |
| `JWT_EXPIRES_IN` | backend | How long a login lasts. Default `12h`. |
| `TOKEN_ENCRYPTION_KEY` | backend | Generate: `openssl rand -base64 32`. **Losing or rotating this makes every stored Google token unreadable** — you'd have to reconnect every account. |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | backend (phase 5) | [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials → OAuth 2.0 Client ID. Also enable the **Business Profile API** on that project. |
| `GOOGLE_OAUTH_REDIRECT_URI` | backend (phase 5) | Must exactly match a redirect URI registered on that OAuth client. |
| `AI_PROVIDER` | backend (phase 7) | `openai` \| `anthropic` \| `gemini`. Only that provider's key is needed. |
| `OPENAI_API_KEY` | backend (phase 7) | [platform.openai.com](https://platform.openai.com/) → API keys. The default provider. |
| `ANTHROPIC_API_KEY` | backend (optional) | [console.anthropic.com](https://console.anthropic.com/) → API keys. |
| `GEMINI_API_KEY` | backend (optional) | [Google AI Studio](https://aistudio.google.com/) → API keys. |
| `SLACK_WEBHOOK_URL` | backend (phase 11) | Slack → Apps → Incoming Webhooks → add one for the channel that should get negative-review alerts. Blank disables Slack alerts. |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` / `SMTP_FROM` | backend (phase 11) | Your mail provider's SMTP credentials. Blank disables email alerts. |
| `SENTRY_DSN` | backend (phase 12, optional) | [sentry.io](https://sentry.io/) project settings. |
| `ADMIN_SEED_EMAIL` / `ADMIN_SEED_PASSWORD` | seed script only | Your choice — becomes the first dashboard login. Read only by `npm run db:seed`, never by the running app. |

### Values you can leave as placeholders for now

`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` and `OPENAI_API_KEY` are required by the schema but
nothing calls those APIs until build phases 5 and 7 — any non-empty string works until then.

`SLACK_WEBHOOK_URL` and the `SMTP_*` values are genuinely optional and can be left blank.

### A note on blank values

`.env` parsing turns `KEY=` into an **empty string**, not "undefined". Two places handle this
explicitly, and both had to, because the naive version is silently wrong:

- `env.schema.ts` converts blanks to undefined before format checks, so a deliberately blank
  optional URL doesn't fail a `.url()` check.
- `prisma/seed.ts` uses `||` rather than `??` for the admin password, because `??` accepts `""` —
  which would have created an admin account with an empty password.

## Production

Application code reads secrets identically in every environment: `process.env`, validated by the
same schema. What changes is how they're injected — swap the `.env` file for your host's secret
manager (Railway/Render/Fly environment variables, or a vault like Doppler or 1Password). No code
changes required.
