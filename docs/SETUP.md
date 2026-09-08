# Local Development Setup (Windows)

PostgreSQL and Redis run as natively installed Windows services (no Docker). Redis has no official
Windows build, so we use **Memurai** — a free, drop-in Redis-compatible Windows service.

## 1. Install prerequisites

- **Node.js 20+** — check with `node -v`.
- **PostgreSQL** — installer from [postgresql.org/download/windows](https://www.postgresql.org/download/windows/),
  or `winget install PostgreSQL.PostgreSQL`. Remember the password you set for the `postgres` user.
- **Redis (via Memurai)** — only needed from build phase 6 onward (the review ingestion queue).
  Download **Memurai Developer** (free) from [memurai.com](https://www.memurai.com/get-memurai) and
  install it as a Windows service. Alternative: enable WSL2 and run `redis-server` inside it.

npm ships with Node — nothing else to install.

## 2. Create the database

Using pgAdmin, or `psql` from your PostgreSQL `bin` folder:

```sql
CREATE DATABASE review_autoreply_dev;
```

## 3. Configure

Copy the template and fill it in — one file configures everything:

```
copy .env.example .env
```

At minimum set:

- **`DATABASE_URL`** — your real PostgreSQL password, e.g.
  `postgresql://postgres:yourpassword@localhost:5432/review_autoreply_dev`
- **`JWT_SECRET`** — generate with `openssl rand -base64 48`
- **`TOKEN_ENCRYPTION_KEY`** — generate with `openssl rand -base64 32`
- **`ADMIN_SEED_PASSWORD`** — the password for your first dashboard login. If you leave it blank a
  known development default is used and a warning is printed.

`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` and `OPENAI_API_KEY` are required by the env schema but
can stay as `placeholder` until build phases 5 and 7 — nothing calls those APIs yet. Notification
settings (`SLACK_WEBHOOK_URL`, `SMTP_*`) can be left blank; that channel is simply disabled.

Full explanation of every value: [CREDENTIALS.md](CREDENTIALS.md).

## 4. Install and set up the database

This project is an npm workspace, so everything is run from the **project root** — one install
covers both apps.

```
npm install
npm run db:migrate       # creates all tables
npm run db:seed          # brands, campuses, admin user
npm run db:seed-reviews  # optional: sample reviews to work with
```

Inspect the database visually any time with `npm run db:studio`.

## 5. Start both apps

```
npm run dev              # API on :4000, dashboard on :3100
```

(Or `npm run dev:backend` / `npm run dev:frontend` to run just one.)

Open <http://localhost:3100> and sign in with the admin credentials from step 3.

You'll land on the dashboard with the sidebar (Dashboard / Reviews / Alerts / Reports / Settings).
Reviews, Alerts, Reports and Settings are all live against real data.

To see AI-drafted replies, add an `OPENAI_API_KEY` to `.env`, then trigger the pipeline from the
Reviews page. Without a key the app runs normally and logs a clear warning — only reply generation
is unavailable.

## Verifying it actually works

1. **Database** — `npm run db:studio`. Confirm `brands` has ACE Training and MultiSkills,
   `locations` has 4 campuses each, and `users.passwordHash` starts with `$argon2id$`
   (never plaintext).
2. **Wrong password is rejected** — a bad login shows "Invalid email or password", not a stack trace.
   An unknown email gives the *identical* message, so the form can't be used to discover which
   emails have accounts.
3. **No password leakage** — in browser devtools → Network, confirm no response from `/auth/me`,
   `/auth/login` or `/brands` contains a `passwordHash` field.
4. **Round-trip persistence** — edit a brand's tone in Settings, refresh the page, confirm it stuck.

## Troubleshooting

**"Port 3100 is in use"** — another app has the port. Either stop it, or change the port in
`frontend/package.json` (`next dev -p <port>`) and set `WEB_APP_URL` in `.env` to match. They must
agree or the browser will block API calls with a CORS error.

**"Invalid environment configuration"** on backend start — the message lists exactly which values in
`.env` are missing or malformed. Compare against `.env.example`.

**"Can't reach database server"** — confirm the PostgreSQL Windows service is running
(`services.msc`, or `sc query postgresql-x64-18`) and that the password in `DATABASE_URL` is correct.
