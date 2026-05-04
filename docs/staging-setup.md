# Staging and local database setup

This document describes how to point the **website** (Next.js API + Prisma) and **mobile** (Expo) at a real Postgres instance and optional object storage so you can run end-to-end flows on a device or shared staging host.

Recent schema work includes: `User.clerkUserId`, `NotificationReadState`, `Profile` onboarding fields, match result verification fields, and related API surfaces. Apply schema to your database before relying on those features in staging.

---

## Website environment (`website/.env` and `website/.env.local`)

Prisma CLI commands in this repo load **`website/.env`** then **`website/.env.local`** (see `packages/db/package.json` and `dotenv-cli`). Put secrets in `.env.local` and keep `.env.example` committed as documentation only.

### Required

| Variable | Purpose |
|----------|---------|
| **`DATABASE_URL`** | PostgreSQL connection string for Prisma (`@kairo/db`). Example: `postgresql://USER:PASSWORD@HOST:5432/DBNAME?sslmode=require` |

Without `DATABASE_URL`, `npm run db:push`, `db:migrate`, and `db:seed` will not apply schema or data.

### Proof media uploads (S3-compatible)

Used by `POST /api/proof-media/upload-url` and presigned **PUT** from the mobile app. If unset, the route returns **503** `NOT_CONFIGURED`.

| Variable | Purpose |
|----------|---------|
| **`PROOF_STORAGE_BUCKET`** | Bucket name |
| **`PROOF_STORAGE_REGION`** | e.g. `us-east-1`; R2 often uses `auto` |
| **`PROOF_STORAGE_ACCESS_KEY_ID`** | Provider access key |
| **`PROOF_STORAGE_SECRET_ACCESS_KEY`** | Provider secret |
| **`PROOF_STORAGE_PUBLIC_BASE_URL`** | HTTPS base for public object URLs (no trailing slash) |
| **`PROOF_STORAGE_ENDPOINT`** | Optional; set for R2, MinIO, or custom S3-compatible endpoints |

### Local / non-production only

| Variable | Purpose |
|----------|---------|
| **`PROOF_ALLOW_FILE_URL`** | When set to `1` (and not production), allows `file:` URLs on PHOTO/VIDEO proof for local dev. Ignored when `NODE_ENV=production`. |

### Optional (billing)

| Variable | Purpose |
|----------|---------|
| **`STRIPE_SECRET_KEY`** | Stripe API for billing portal / purchases (see `website/.env.example`) |

### Clerk (website) — future / production hardening

Mobile signs in with **Clerk**; `POST /api/auth/bootstrap` currently trusts the JSON body with a **TODO** to verify a Clerk session or JWT on the server. When you add server-side verification, you will typically add:

- **`CLERK_SECRET_KEY`** (or publishable + secret pair per Clerk docs)
- Any **JWKS** / **issuer** settings your verification middleware requires

Until then, staging can still work using the acting-user header pattern documented in `website/.env.example`.

---

## Mobile environment (`mobile/.env`)

### Required for signed-in flows

| Variable | Purpose |
|----------|---------|
| **`EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`** | Clerk publishable key (see Clerk dashboard). Required for sign-in / sign-up in the app. |
| **`EXPO_PUBLIC_API_URL`** | Origin of the Next.js API (no trailing slash), e.g. `https://staging-api.example.com` or LAN URL for device testing. |

### Dev fallback only

| Variable | Purpose |
|----------|---------|
| **`EXPO_PUBLIC_KAIRO_DEV_USER_ID`** | Prisma `User.id` used as `x-kairo-user-id` when bootstrap / Clerk metadata has not linked an id yet. **Use only for local dev** after `npm run db:seed`; copy a seeded user id from the seed log. Do not rely on this in production staging unless you understand the impersonation risk. |

---

## Prisma commands (from monorepo root)

| Command | When to use |
|---------|-------------|
| **`npm run db:generate`** | After any `schema.prisma` change; regenerates `@prisma/client`. Safe to run without `DATABASE_URL` for codegen in CI (generate still needs schema on disk). |
| **`npm run db:push`** | **Quick sync**: pushes schema to the DB without migration files. Good for disposable staging DBs and rapid iteration. **Requires `DATABASE_URL`.** |
| **`npm run db:migrate`** | Runs `prisma migrate dev` (loads env from `website/`). Use when you want **versioned migrations** in git. **Requires `DATABASE_URL`.** |
| **`npm run db:seed`** | Idempotent MVP seed (`packages/db/prisma/seed.ts`). **Requires `DATABASE_URL`.** |
| **`npm run db:studio`** | Opens Prisma Studio against the configured database. |
| **`npm run db:dev:fresh`** | **Destructive**: `db push --force-reset` + seed. **Never** on production. |

**Note:** This repo’s `db:push` / `db:migrate` / `db:seed` scripts use **`dotenv-cli`** pointed at **`website/.env`** and **`website/.env.local`**. Ensure `DATABASE_URL` is set there (not only in `packages/db/.env`, which is not used by these scripts).

### Migration-based workflow (recommended for long-lived staging)

1. Set `DATABASE_URL` in `website/.env.local`.
2. Create a migration: `cd packages/db && npx dotenv -o -e ../../website/.env -e ../../website/.env.local -- prisma migrate dev --name describe_change`  
   Or rely on root `npm run db:migrate` if it matches your workflow.
3. Commit migration SQL under `packages/db/prisma/migrations/` (when you adopt migrate dev in earnest).

### Quick staging sync (no migration history)

1. Set `DATABASE_URL`.
2. From root: `npm run db:push`
3. `npm run db:seed` (optional demo data)

---

## Object storage (S3 / R2 / MinIO)

1. Create a **private** bucket (or bucket with restricted write via presigned PUT only).
2. Configure **CORS** on the bucket (or via reverse proxy) so the **mobile app origin** (or `*` for dev only) can:
   - **PUT** to the presigned URL returned by the API
   - Optionally **GET** for `PROOF_STORAGE_PUBLIC_BASE_URL` if objects are read directly from the client
3. Set **`PROOF_STORAGE_PUBLIC_BASE_URL`** to the HTTPS URL clients use to load images (CDN or bucket public hostname).

MinIO locally: run MinIO, create bucket, set endpoint to `http://localhost:9000` (or LAN IP for phones), and align region/access keys with your MinIO config.

---

## Device and simulator testing

- **`EXPO_PUBLIC_API_URL` must be reachable from the phone or emulator.** `localhost` / `127.0.0.1` on the device refers to the **device**, not your Mac.
  - **iOS Simulator (Mac):** `http://127.0.0.1:3000` is usually fine.
  - **Android emulator:** often `http://10.0.2.2:3000` maps to the host loopback.
  - **Physical device:** use your machine’s **LAN IP** (same Wi‑Fi) and ensure the Next dev server listens on `0.0.0.0` (`next dev --hostname 0.0.0.0` or your host’s network URL).
- **HTTPS:** production-like staging should use TLS; Expo and Clerk may require HTTPS for certain flows depending on configuration.
- **Firewall:** allow inbound port 3000 (or your API port) on the host when testing from a phone.

---

## Checklist before “staging is ready”

- [ ] `DATABASE_URL` set in `website/.env.local` (or CI secrets).
- [ ] `npm run db:push` **or** `npm run db:migrate` applied successfully once.
- [ ] `npm run db:seed` run if you need demo users/events (optional).
- [ ] `EXPO_PUBLIC_API_URL` points at a URL the device can reach.
- [ ] Clerk keys present on mobile; bootstrap completes (Prisma user id in SecureStore or metadata).
- [ ] If testing uploads: `PROOF_STORAGE_*` set and CORS verified for PUT.

For a step-by-step product pass, use **`docs/mvp-e2e-checklist.md`**.
