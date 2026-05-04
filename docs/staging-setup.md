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

### Proof media uploads (Supabase Storage)

Used by `POST /api/proof-media/upload-url`: the website creates a **Supabase Storage signed upload URL** (service role, server-only); the mobile app **PUT**s bytes to that URL, then submits proof with the returned **public HTTPS URL**. If Supabase env is unset, the route returns **503** `NOT_CONFIGURED`. The mobile app does **not** use a Supabase key.

| Variable | Purpose |
|----------|---------|
| **`SUPABASE_URL`** | Project URL, e.g. `https://<ref>.supabase.co` |
| **`SUPABASE_SERVICE_ROLE_KEY`** | Service role key (**server only**; never ship to Expo) |
| **`SUPABASE_PROOF_BUCKET`** | Storage bucket name (default **`kairo-proof-media`** if unset) |
| **`SUPABASE_PROOF_PUBLIC_BASE_URL`** | Optional. If set, replaces the **origin** of `getPublicUrl` output (custom domain / CDN in front of public object paths). |

**Deprecated (removed):** `PROOF_STORAGE_BUCKET`, `PROOF_STORAGE_REGION`, `PROOF_STORAGE_ENDPOINT`, `PROOF_STORAGE_ACCESS_KEY_ID`, `PROOF_STORAGE_SECRET_ACCESS_KEY`, `PROOF_STORAGE_PUBLIC_BASE_URL` — prior S3-compatible presigned PUT approach.

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

### Expo push notifications (mobile + API)

- The app registers an **Expo push token** with **`POST /api/me/push-tokens`** after sign-in (silent attempt if permission already granted) and from **Settings → Notifications** (“Enable push notifications” or turning **Push** on in Channels).
- **Physical devices** are recommended: iOS Simulator and many Android emulators **cannot** obtain a real Expo push token. Use a dev build or Expo Go on hardware when testing delivery.
- **EAS / FCM:** Production iOS push typically needs Apple push keys and an **EAS project** (`extra.eas.projectId` in `app.json` or EAS-managed config). Android uses FCM through Expo; follow [Expo push setup](https://docs.expo.dev/push-notifications/push-notifications-setup/) for production.
- **Server dispatch** uses Expo’s HTTPS API (`exp.host/--/api/v2/push/send`) from `website/src/server/notifications/push.service.ts` — no separate npm dependency. Automated sends from proof/result flows are **not** wired in the MVP foundation PR.

---

## Prisma commands (from monorepo root)

| Command | When to use |
|---------|-------------|
| **`npm run db:generate`** | After any `schema.prisma` change; regenerates `@prisma/client`. Safe to run without `DATABASE_URL` for codegen in CI (generate still needs schema on disk). |
| **`npm run db:push`** | **Quick sync**: pushes schema to the DB without migration files. Good for disposable staging DBs and rapid iteration. **Requires `DATABASE_URL`.** Prisma may refuse the push if it detects possible data loss (e.g. new `@unique` on existing rows); see **`npm run db:push:accept-data-loss`** below. |
| **`npm run db:push:accept-data-loss`** | Same as `db:push` but passes **`--accept-data-loss`**. Use only on **throwaway** or dev DBs when you accept Prisma’s warning (e.g. adding `User.clerkUserId` @unique on a DB that already has users). **Never** on production without a backup and explicit review. |
| **`npm run db:migrate`** | Runs `prisma migrate dev` (loads env from `website/`). Use when you want **versioned migrations** in git. **Requires `DATABASE_URL`.** |
| **`npm run db:seed`** | Idempotent MVP seed (`packages/db/prisma/seed.ts`). **Requires `DATABASE_URL`.** |
| **`npm run db:studio`** | Opens Prisma Studio against the configured database. |
| **`npm run db:dev:fresh`** | **Destructive**: `db push --force-reset` + seed. **Never** on production. |

**Note:** This repo’s `db:push` / `db:migrate` / `db:seed` scripts use **`dotenv-cli`** pointed at **`website/.env`** and **`website/.env.local`**. Ensure `DATABASE_URL` is set there (not only in `packages/db/.env`, which is not used by these scripts).

### Restart Next.js after schema / client changes

After **`npm run db:generate`**, **`db:push`**, or **`db:push:accept-data-loss`**, **restart** the Next dev server (`npm run dev` in `website/`). Otherwise you may see transient **500**s such as:

- Prisma **`Unknown field '…' on model Profile`** (server bundle still using an old generated client), or
- **`Cannot read properties of undefined (reading 'TEAM_AGREEMENT')`** (stale enum / client in the Turbopack cache).

A fresh process loads `node_modules/@prisma/client` that matches the current `schema.prisma`.

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

## Supabase Storage (proof media)

1. In the [Supabase dashboard](https://supabase.com/dashboard) → **Storage** → create bucket **`kairo-proof-media`** (or match `SUPABASE_PROOF_BUCKET`).
2. **MVP trade-off — public read:** For `submitProof` / event UI to load images and videos without a separate “sign every read” API, the bucket should be **public** (Dashboard → bucket → **Make public**), or you must add a follow-up that serves private objects via short-lived signed GET URLs. Writes remain restricted: only the website (service role) mints signed **upload** URLs; clients never receive the service role key.
3. **CORS:** Allow the **mobile app** to **PUT** to the signed upload URL host (`*.supabase.co` / your storage API origin). For Expo dev, permissive CORS on the project Storage API is often required so `fetch(uploadUrl, { method: "PUT", … })` from the device succeeds. Tighten origins for production.
4. Set **`SUPABASE_URL`** and **`SUPABASE_SERVICE_ROLE_KEY`** in `website/.env.local` (not in mobile).

**Previous approach (deprecated):** S3-compatible presigned PUT via `PROOF_STORAGE_*` and AWS SDK — removed in favor of Supabase for MVP simplicity.

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
- [ ] If testing uploads: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, bucket + public read policy set; CORS verified for PUT to signed upload URLs.

For a step-by-step product pass, use **`docs/mvp-e2e-checklist.md`**.
