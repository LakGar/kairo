```txt
Before starting this task:
1. Open docs/kairo-build-log.md.
2. Add this task under the correct area.
3. Run git status.
4. Inspect relevant existing files.
5. Do not create duplicate files.

After finishing this task:
1. Update docs/kairo-build-log.md.
2. Run relevant checks.
3. Run git status.
4. Commit with a clear message.
5. Push to GitHub.
6. If push fails, write the exact failure in docs/kairo-build-log.md.
```

# Kairo Build Log

## Kairo MVP build plan (Phases 0–12)

Single roadmap; execute one phase per session unless explicitly combined.

| Phase | Area | Goal (short) |
|------:|------|----------------|
| 0 | Shared | Repo audit, build log, git truth |
| 1 | Database | MVP Prisma schema audit/finalize |
| 2 | Shared | `packages/shared` or defer validators to website |
| 3 | Website | Server services (events, teams, matches, proof, stakes, activity) |
| 4 | Website | REST API routes for mobile + dev `x-kairo-user-id` |
| 5 | Database | `db:seed` + demo data |
| 6 | Mobile | API client + types + `EXPO_PUBLIC_API_URL` |
| 7 | Mobile | Event discovery UI |
| 8 | Mobile | Create event flow |
| 9 | Mobile | Join / team flows |
| 10 | Mobile | Organizer tools MVP on event detail |
| 11 | Mobile | Proof submit (text/URL only) |
| 12 | Mobile + Website | E2E polish, checks, log closure |

**Non-goals (MVP):** payments, wagering language, real media upload, AI brackets, push notifications, full admin UI, production mobile↔website auth until wired.

**Positioning:** Luma = register; Kairo = participate. Copy: task, challenge, reward, prize, donation, entry fee — avoid bet/wager/odds/gambling/payout framing.

---

## Project Areas

### Database / Prisma / packages/db

Done:

- [x] Prisma schema lives in `packages/db/prisma/schema.prisma` (single schema; no `website/prisma`).
- [x] `@kairo/db` package exists (`packages/db`).
- [x] Root scripts include `db:generate`, `db:migrate`, `db:push`, `db:studio`, `db:seed`.
- [x] **Phase 5 (2026-05-02):** `packages/db/prisma/seed.ts` — idempotent MVP demo data; `prisma.seed` + `npm run seed` in `@kairo/db`; root `db:seed`. Seed skips with a warning when `DATABASE_URL` is unset; otherwise runs cleanup + inserts (users, events, teams, bracket/matches, proof, stakes, activity log).
- [x] Prisma client generates from the DB package.
- [x] **Phase 0 audit (2026-05-02):** On disk, schema includes models `User`, `Profile`, `Event`, `EventParticipant`, `Team`, `TeamMember`, `Bracket`, `Match`, `ProofPrompt`, `ProofSubmission`, `Stake`, `ActivityLog` and enums `UserRole` through `StakeStatus` as required for MVP foundation.
- [x] **Phase 1 (2026-05-02):** Schema reviewed end-to-end; `ProofSubmission.eventId` ↔ `Event` relation intact; no payments/AI/storage tables added; proof remains `url` + `text` only. Composite indexes added for common lookups: `Event` `[status, startsAt]` (replaces standalone `[status]` to avoid redundancy), `EventParticipant` `[eventId, userId]`, `ProofSubmission` `[eventId, status]`, `Stake` `[eventId, status]`; `ActivityLog` `[createdAt]` for timelines.

In Progress:

- [ ] (none)

Left:

- [ ] Apply migrations or `db:push` when `DATABASE_URL` is set and intentional (no Postgres URL in repo root or `packages/db/.env` today — only `mobile/.env` for Clerk).

### Website / Next.js / website

Done:

- [x] `website/lib/db.ts` re-exports `prisma` / `PrismaClient` / `Prisma` from `@kairo/db` (use `import { prisma } from "@/lib/db"` in app code).
- [x] `website/next.config.ts` transpiles `@kairo/db` and `@kairo/shared` (Turbopack root points at monorepo root).
- [x] **Phase 0 audit:** App Router with `website/app/layout.tsx` and `website/app/page.tsx` only — no `website/app/api/*` yet.
- [x] **Phase 3 prep:** `website/package.json` includes `@kairo/shared` + `@prisma/client`; `npm run typecheck` runs `tsc --noEmit`; `website/src/lib/current-user.ts` (`x-kairo-user-id`); `website/src/server/activity/activity-actions.ts`; `website/.env.example` documents `DATABASE_URL` + dev header (removed misplaced Clerk key from example).
- [x] **Phase 3:** Server layer under `website/src/server/` — `activity` (`logActivity`), `events` (create/update/publish/cancel/join + queries), `teams` (create/join/leave + queries), `matches` (create/score/winner + queries), `proof` (prompts/submit/approve/reject + queries), `stakes` (create/complete/fail + queries); `website/src/lib/result.ts`, `slug.ts`; path aliases `@/server/*`, `@/src/*` in `website/tsconfig.json`.
- [x] **Phase 4:** `website/app/api/**` REST handlers — JSON `{ success, data | error }`, HTTP status from service codes; mutating routes use `requireUserId` → `x-kairo-user-id` (TODO Clerk); `website/src/lib/api-http.ts` (`fromServiceResult`, `parseJsonBody`, `requireUserId`); public reads: `GET /api/events` (upcoming), `GET /api/events/[eventId]`, lists for teams/matches/proof/stakes/prompts.

In Progress:

- [ ] (none)

Left:

- [ ] Website auth: replace `x-kairo-user-id` with Clerk (or other) when ready.

### Mobile / Expo / mobile

Done:

- [x] **Phase 0 audit:** `mobile/package.json` — `main`: `expo-router/entry`; Expo SDK ~54; `expo-router`, `@clerk/expo`, fonts, etc.
- [x] Auth screens: `mobile/app/(auth)/` — `_layout.tsx`, `index.tsx`, `sign-in.tsx`, `sign-up.tsx`.
- [x] Tabs: `mobile/app/(tabs)/` — `_layout.tsx` (Stack + auth gate), `index.tsx`, `create.tsx`, `events/[eventId].tsx`.
- [x] Onboarding: `mobile/app/(onboarding)/` — `_layout.tsx`, `index.tsx`, `finish.tsx` (plus `mobile/src/features/onboarding/*`).
- [x] Root `mobile/app/_layout.tsx` — `ClerkProvider`, `tokenCache`, `Slot`, `unstable_settings.anchor` `(tabs)`.
- [x] Clerk: `@clerk/expo` + `@clerk/expo/legacy` where used in sign-in/sign-up.
- [x] **Navigation (verified in source):** `sign-in.tsx` → `router.replace("/(tabs)")`; `sign-up.tsx` → `router.replace("/(onboarding)")`; completing onboarding → `router.replace("/(tabs)")` in `use-onboarding-flow.tsx` (`finishOnboarding`). Note: `finish.tsx` is a legacy `Redirect` to `/(onboarding)`; real completion uses the hook above.
- [x] **Phase 3 prep:** `mobile/.gitignore` ignores `.env` (not only `.env*.local`) so `mobile/.env` cannot be committed accidentally.
- [x] **Phase 6 (2026-05-02):** `mobile/src/api/` — `createKairoApi` / `createKairoApiFromEnv` for all Phase 4 REST paths; JSON envelope + `KairoApiError`; DTO types for events, teams, matches, proof, stakes; dev `x-kairo-user-id` from `EXPO_PUBLIC_KAIRO_DEV_USER_ID` or `expo.extra.devUserId`; base URL from `EXPO_PUBLIC_API_URL` or `expo.extra.apiUrl` (`app.config.ts` merges `app.json` + extra). `@kairo/shared` via `file:../packages/shared` for input types re-exported from `@/src/api`. `mobile/.env.example`; `npm run typecheck`.
- [x] **Phase 7 (2026-05-02):** Event discovery — `mobile/src/features/events/` (`useUpcomingEvents`, `useEventDetail`, `EventListRow`, `format-event-range`); `(tabs)/index` lists `GET /api/events` with pull-to-refresh, empty state, config/API errors + retry; `(tabs)/events/[eventId]` shows `GET /api/events/:id` (about, location, organizer, counts); `(tabs)/_layout` registers Stack screens with header sign-out.
- [x] **Phase 8 (2026-05-02):** Create event — `CreateEventForm` + `create-event-defaults`; `createEventSchema` (`@kairo/shared`) client validation; `POST /api/events` via `createKairoApiFromEnv`; `(tabs)/create` draft flow, `router.replace` to new event detail; Discover header **Create** + **Sign out**; `.env.example` notes dev user id required for creates.
- [x] **Phase 9 (2026-05-02):** Join + teams on event detail — `useEventTeams`, `EventJoinSection` (`POST /api/events/:id/join` with PLAYER/WATCHER/VOLUNTEER + optional note; draft/cancelled copy), `EventTeamsSection` (list teams, `joinTeam` / `leaveTeam`, `createTeam` with `createTeamSchema`); `(tabs)/events/[eventId]` refreshes event + teams after mutations.

In Progress:

- [ ] (none)

Left:

- [ ] **Phases 10–11:** Organizer tools on event detail, proof submit per MVP plan.
- [ ] Optional: add `mobile` to root npm workspaces or keep standalone installs.
- [ ] Server-backed onboarding persistence (later).

### Shared / Packages / Types

Done:

- [x] Root `package.json` workspaces: `apps/*`, `packages/*`, `website` (note: **`mobile` is not a workspace package** — lives alongside; use `mobile/package-lock.json` for mobile-only installs unless changed).
- [x] **Phase 0 audit:** Root `package-lock.json` is the lockfile for workspace installs; `website/` has no nested `package-lock.json` in tree.
- [x] `origin` → `https://github.com/LakGar/kairo.git` (fetch/push).
- [x] `docs/kairo-build-log.md` is the **main** build source of truth; `docs/onboarding-build-log.md` exists for onboarding-only notes.
- [x] **Phase 2:** `@kairo/shared` package at `packages/shared` — Zod validators (`events`, `teams`, `matches`, `proof`, `stakes`) + `enums.ts` string literals aligned with Prisma (no `@prisma/client` dependency in shared for lighter mobile imports).
- [x] **Phase 3 prep:** Root `.gitignore` restored/expanded for monorepo (`node_modules`, env files with `!.env.example`, Next/Expo artifacts); `mobile/.gitignore` ignores `.env`.

In Progress:

- [ ] (none)

Left:

- [ ] **Git cleanup:** Legacy root single-app files may still show as deleted until explicitly committed or restored; keep root layout monorepo-only.
- [ ] Product language guardrails in UI copy (no gambling framing).

---

## Work Sessions

### 2026-05-02 — Add Kairo build log and GitHub push workflow

Area:

- Shared / Packages / Types (process + documentation spanning the repo)

Before Checklist:

- [x] Checked current git status (noted large unrelated unstaged changes; only `docs/kairo-build-log.md` will be committed for this chunk).
- [x] Read relevant existing files (`website/app/*`, `mobile/app/*`, `package.json`) to avoid mis-documenting routes (auth/tabs/onboarding and Clerk are **mobile**, not website).
- [x] Confirmed correct project area for each Done bullet.
- [x] Confirmed no duplicate schema/package/app files are introduced by this task.
- [x] Confirmed routes/imports match current repo structure.

Planned Work:

- Add `docs/kairo-build-log.md` as the build-progress source of truth.
- Embed the pre-task / post-task Cursor instructions at the top of this file.
- Run `git status`, commit only the new doc, push to GitHub.

Files Changed:

- `docs/kairo-build-log.md` — new build log, initialized Project Areas and first Work Session.

Commands Run:

```bash
git status
git add docs/kairo-build-log.md
git commit -m "add Kairo build log"
git push   # failed initially — no remote (see Issues)
```

Tests / Checks:

- [ ] Typecheck passed — not run as a dedicated script (no `typecheck` in root `package.json`).
- [ ] Lint passed — not run for this documentation-only change.
- [ ] App route checked — not applicable.
- [ ] Prisma generate — not run (schema unchanged).
- [ ] Prisma push/migrate — not run.

Result:

- Build log file exists and documents accurate split between **website** vs **mobile** vs **database**.

Issues:

- `git push` failed at first: no Git remote was configured.

Exact error from that first `git push`:

```text
fatal: No configured push destination.
Either specify the URL from the command-line or configure a remote repository using

    git remote add <name> <url>

and then push using the remote name

    git push <name>
```

Resolved later: origin added and `main` pushed (see work session **Configure origin and push main** below).

After Checklist:

- [x] Updated Done / In Progress / Left sections for all areas.
- [x] Added this work session (push result recorded after `git push`).
- [x] Ran `git status`.
- [x] Committed stable changes (scoped to `docs/kairo-build-log.md` only).
- [x] Pushed to GitHub — completed after `git remote add` + `git push -u origin main` (see session below).

Commit:

- `f3e1739` — `add Kairo build log`

Next:

- Implement website backend APIs or server actions; keep each task scoped and update this log per session.
- Run `npm run db:push` or `db:migrate` when a database URL is configured.

### 2026-05-02 — Configure origin and push main

Area:

- Shared / Packages / Types (repository hosting)

Before Checklist:

- [x] Checked `git remote -v` after adding origin.
- [x] Confirmed branch is `main`.

Planned Work:

- Add `origin` remote and push `main` to GitHub.

Files Changed:

- (none for the push itself; this session documents the command-only step.)

Commands Run:

```bash
git remote add origin https://github.com/LakGar/kairo.git
git branch --show-current   # main
git push -u origin main
```

Tests / Checks:

- [ ] Typecheck — not run (no code change).
- [ ] Lint — not run.

Result:

- `origin` points at `https://github.com/LakGar/kairo.git`.
- Remote branch `main` created; local `main` tracks `origin/main`.

Issues:

- (none)

After Checklist:

- [x] Updated this work session in `docs/kairo-build-log.md`.
- [x] Prior session’s “Pushed to GitHub” note corrected to reflect successful push.

Commit:

- `docs: record successful GitHub push in build log` (includes this session text)

Next:

- Commit and push remaining monorepo work when ready (large unstaged/untracked tree locally is not yet on `origin`).

### 2026-05-02 — PHASE 0: Repo audit and MVP build log update

Area:

- Shared / Packages / Types (process, documentation, cross-cutting git/repo truth)

Before Checklist:

- [x] Opened `docs/kairo-build-log.md`.
- [x] Ran `git status` — see Result (untracked `mobile/`, `packages/`, `website/`; deleted legacy root Next files; branch `main` **up to date with `origin/main`** for **committed** history only).
- [x] Inspected `package.json` (root), `packages/db/package.json`, `packages/db/prisma/schema.prisma` (partial + model list), `website/package.json`, `website/lib/db.ts`, `mobile/package.json`, `mobile/app/_layout.tsx`, glob/file lists for `mobile/app/(auth)`, `(tabs)`, `(onboarding)`; grepped `router.replace` in mobile.
- [x] Confirmed no duplicate Prisma schema under `website/prisma` (none present).
- [x] Confirmed `docs/onboarding-build-log.md` exists.

Planned Work:

- Record consolidated MVP Phases 0–12 and Phase 0 audit outcome.
- No application code changes in Phase 0.

Files Changed:

- `docs/kairo-build-log.md` — MVP phase table, refreshed Project Areas from inspection, this work session.

Commands Run:

```bash
git status
git remote -v
git log -1 --oneline
# File reads / greps as described in Before Checklist (no npm scripts run for Phase 0).
git add docs/kairo-build-log.md
git commit -m "docs: update MVP build log (phase 0 audit)"
git push
```

Tests / Checks:

- [ ] Typecheck — not run (documentation-only phase).
- [ ] Lint — not run.
- [ ] `npm run db:generate` — not run (schema unchanged).

Result:

- **Disk layout:** `packages/db`, `website`, `mobile` match monorepo expectations; Prisma only in `packages/db/prisma/schema.prisma`.
- **Git vs disk:** Large divergence — monorepo app folders **untracked**; root still shows removals from prior single-app layout. Plan a follow-up chunk to `git add` + commit `packages/`, `website/`, `mobile/` (and resolve root deletions / `.gitignore`) so GitHub matches local MVP tree.
- **Routing:** Sign-in → `/(tabs)`; sign-up → `/(onboarding)`; onboarding completion → `/(tabs)` via `finishOnboarding` in `use-onboarding-flow.tsx` (not via `finish.tsx` redirect target).

Issues:

- (none for Phase 0 scope.)

After Checklist:

- [x] Updated Done / Left / MVP plan in `docs/kairo-build-log.md`.
- [x] Added this work session.
- [x] Ran `git status` (recorded above).

Commit:

- `docs: update MVP build log (phase 0 audit)`

Next:

- **Git hygiene (parallel priority):** Commit untracked monorepo paths so `origin` reflects real code.

### 2026-05-02 — PHASE 1: Database schema audit and MVP indexes

Area:

- Database / Prisma / `packages/db`

Before Checklist:

- [x] Opened `docs/kairo-build-log.md`.
- [x] Ran `git status -sb`.
- [x] Read full `packages/db/prisma/schema.prisma` (models, enums, relations, indexes).

Planned Work:

- Confirm MVP model/enum set; avoid overbuild (no payments pipeline, no file storage tables).
- Add only high-value indexes for list/filter patterns.
- Run `prisma validate` + `npm run db:generate`; run `db:push` only if a real `DATABASE_URL` exists.

Files Changed:

- `packages/db/prisma/schema.prisma` — composite indexes on `Event`, `EventParticipant`, `ProofSubmission`, `Stake`; `ActivityLog.createdAt`; dropped redundant `Event` index on `status` alone in favor of `[status, startsAt]`.
- `packages/db/package.json`, `packages/db/tsconfig.json`, `packages/db/src/index.ts`, `packages/db/.env.example` — committed in follow-up so `@kairo/db` is usable from git (first commit had only the schema file by mistake).
- `docs/kairo-build-log.md` — Phase 1 session + Database area updates.

Commands Run:

```bash
git status -sb
# prisma validate (first attempt without DATABASE_URL) failed P1012 — env missing
DATABASE_URL="postgresql://user:pass@localhost:5432/kairo" npx prisma validate --schema=packages/db/prisma/schema.prisma
npm run db:generate
# npm run db:push — skipped: no intentional real DATABASE_URL in workspace for sync
git add packages/db/prisma/schema.prisma docs/kairo-build-log.md && git commit -m "db: finalize Kairo MVP schema" && git push
git add packages/db/package.json packages/db/tsconfig.json packages/db/src packages/db/.env.example && git commit -m "db: add @kairo/db package manifest and Prisma client entry" && git push
```

Tests / Checks:

- [x] `prisma validate` — passed when run with **placeholder** `DATABASE_URL` (CLI otherwise errors with P1012 in this repo).
- [x] `npm run db:generate` — passed.
- [ ] `npm run db:push` / migrate — not run (no configured Postgres URL for Prisma in repo; push not intended this session).
- [ ] Typecheck / lint — not run (schema-only change).

Result:

- MVP schema finalized for Phase 1 scope; client regenerated.

Issues:

- First `git add` for Phase 1 only staged `schema.prisma` + docs, leaving `@kairo/db` manifest/client untracked; fixed immediately with a second commit so clones can run `prisma generate` / workspace installs.

After Checklist:

- [x] Updated Database Done / Left and this work session.
- [x] Ran checks above; documented skipped `db:push`.

Commit:

- `272635a` — `db: finalize Kairo MVP schema`
- `a8c7a16` — `db: add @kairo/db package manifest and Prisma client entry`
- `60038bc` — `docs: update Phase 1 log (db package files commit)`

Next:

- **PHASE 3:** Website server services + wire `@kairo/shared` / `@/lib/db`.
- **PHASE 5:** Seed script when ready.
- Configure `DATABASE_URL` locally and run `npm run db:push` or `db:migrate` when you want a physical DB.

### 2026-05-03 — PHASE 2: Shared Zod validators (`@kairo/shared`)

Area:

- Shared / Packages / Types — `packages/shared`

Before Checklist:

- [x] Opened `docs/kairo-build-log.md`.
- [x] Ran `git status -sb`.
- [x] Confirmed root workspaces include `packages/*` and no pre-existing `packages/shared` (no duplicate package).
- [x] Confirmed Prisma enums in `packages/db/prisma/schema.prisma` for alignment (manual mirror in `src/enums.ts`).

Planned Work:

- Add `@kairo/shared` with Zod schemas from MVP plan: events (create/update/join), teams (create/join), matches (create/score/winner), proof (prompt/submit/review), stakes (create/update status).
- Avoid `@prisma/client` in shared; keep literals in sync with DB enums by convention.

Files Changed:

- `packages/shared/package.json`, `packages/shared/tsconfig.json`, `packages/shared/src/*.ts` — new package.
- `package-lock.json` — workspace dependency `zod` for `@kairo/shared`.
- `docs/kairo-build-log.md` — Shared area + this session.

Commands Run:

```bash
git status -sb
npm install
npx tsc --noEmit -p packages/shared/tsconfig.json
```

Tests / Checks:

- [x] `npx tsc --noEmit -p packages/shared/tsconfig.json` — passed.
- [ ] Root / website `npm run lint` — not run (out of scope for this package-only change).

Result:

- `@kairo/shared` ready for Phase 3 `website` service imports (`"@kairo/shared": "*"` + optional `transpilePackages`).

Issues:

- (none)

After Checklist:

- [x] Updated Shared Done / Left and this session.
- [x] Ran Typecheck for `packages/shared` only.

Commit:

- `shared: add zod validators package`

Next:

- **PHASE 3:** Website server layer + `import` from `@kairo/shared` and `@/lib/db`.

### 2026-05-03 — Phase 3 prep: website wiring, dev user stub, activity constants, gitignore

Area:

- Website / Next.js / `website`
- Shared / Packages / Types (root ignore rules)
- Mobile / Expo / `mobile` (`.gitignore` only)

Before Checklist:

- [x] Opened `docs/kairo-build-log.md`.
- [x] Ran `git status`; verified `mobile/.env` is ignored before staging `mobile/`.

Planned Work:

- Add `@kairo/shared` to website + `transpilePackages`; `getCurrentUserIdFromRequest` + `ActivityAction` constants; root `.gitignore`; `npm run typecheck`; tighten mobile env ignore; fix `website/.env.example`.

Files Changed:

- `.gitignore` — new monorepo-oriented rules at repo root.
- `website/package.json`, `website/next.config.ts`, `website/.env.example`, `website/src/lib/current-user.ts`, `website/src/server/activity/activity-actions.ts`
- `mobile/.gitignore`
- `docs/kairo-build-log.md`
- `package-lock.json` — workspace link to `@kairo/shared` for website.
- `package.json` (root) — monorepo workspaces + `db:*` scripts; removes legacy single-app root `package.json` content.
- Legacy root Next app files — deleted (`src/`, `public/*.svg`, old `next.config.ts`, etc.).
- `mobile/**` — app skeleton, assets, config, and lockfile (secrets excluded via `.gitignore`).

Commands Run:

```bash
npm install
npm run typecheck -w website
git add … && git commit && git push
```

Tests / Checks:

- [x] `npm run typecheck -w website` — passed.
- [ ] `npm run lint -w website` — not run.

Result:

- Phase 3 services can import `@kairo/shared` and log via `ActivityAction`; API routes can use `getCurrentUserIdFromRequest`.

Issues:

- (none)

Commit:

- `fc91216` — `chore: prep website for phase 3 (shared, user stub, gitignore)`

### 2026-05-03 — PHASE 3: Website server services (`@/lib/db`, `@kairo/shared`)

Area:

- Website / Next.js / `website`

Before Checklist:

- [x] Opened `docs/kairo-build-log.md`.
- [x] Ran `git status`; inspected Prisma schema + `@kairo/shared` validators.

Planned Work:

- Implement MVP services per roadmap: events, teams, matches, proof, stakes, activity logging; `result` + `slug` helpers; `currentUserId` passed in (no Clerk on web yet).

Files Changed:

- `website/src/lib/result.ts`, `website/src/lib/slug.ts`
- `website/src/server/activity/activity.service.ts`
- `website/src/server/events/*`, `teams/*`, `matches/*`, `proof/*`, `stakes/*`
- `website/tsconfig.json` — path aliases `@/server/*`, `@/src/*`
- `website/package.json` — `@prisma/client` for enums in services
- `docs/kairo-build-log.md`
- `package-lock.json` (if updated)

Commands Run:

```bash
npm install
npm run typecheck -w website
```

Tests / Checks:

- [x] `npm run typecheck -w website` — passed.
- [x] `npm run lint -w website` — passed.
- [ ] `npm run db:generate` — not required (schema unchanged).

Result:

- Services return `Result<T>` (`ok` / `err`); mutations append `ActivityLog` via `ActivityAction` constants; joins enforce caps/flags; team flows use transactions; match winner validated against home/away.

Issues:

- (none)

Commit:

- `388edb9` — `website: add event service layer`

Next:

- **PHASE 4:** REST API (completed in session below); then **PHASE 5** seed (completed 2026-05-02).

### 2026-05-03 — PHASE 4: Website REST API for mobile

Area:

- Website / Next.js / `website`

Before Checklist:

- [x] Opened `docs/kairo-build-log.md`.
- [x] Confirmed Phase 3 services exist; no duplicate Prisma schema.

Planned Work:

- Add `app/api/**` route handlers per MVP list; shared HTTP helpers; dev `x-kairo-user-id` via `requireUserId`.

Files Changed:

- `website/src/lib/api-http.ts` — `fromServiceResult`, `requireUserId`, `parseJsonBody`, `jsonError`.
- `website/app/api/events/route.ts`, `events/[eventId]/route.ts`, `.../publish`, `.../cancel`, `.../join`, `.../teams`, `.../matches`, `.../proof-prompts`, `.../proof`, `.../stakes`.
- `website/app/api/teams/[teamId]/join/route.ts`, `.../leave/route.ts`.
- `website/app/api/matches/[matchId]/score/route.ts`, `.../winner/route.ts`.
- `website/app/api/proof/[proofSubmissionId]/approve/route.ts`, `.../reject/route.ts`.
- `website/src/server/proof/proof.queries.ts` + `proof.service.ts` — `getProofPromptsForEvent`.
- `docs/kairo-build-log.md`

Commands Run:

```bash
npm run typecheck -w website
npm run lint -w website
cd website && npm run build
```

Tests / Checks:

- [x] `npm run typecheck -w website` — passed.
- [x] `npm run lint -w website` — passed.
- [x] `npm run build` (website) — passed; route table lists all new API routes.

Result:

- Mobile can call `EXPO_PUBLIC_API_URL` + paths below; mutating requests need `x-kairo-user-id: <User.cuid>` until Clerk replaces it.

Issues:

- (none)

Commit:

- `60090a5` — `website: add mobile API routes`

Next:

- **PHASE 5:** seed (`db:seed`); **PHASE 6:** mobile API client — see sessions below on `main`.

### 2026-05-02 — PHASE 5: Database seed (`db:seed`)

Area:

- Database / Prisma / `packages/db`

Before Checklist:

- [x] Opened `docs/kairo-build-log.md`.
- [x] Ran `git status`; inspected `packages/db/package.json` and Prisma schema (no duplicate schema).

Planned Work:

- Add idempotent `prisma/seed.ts`, wire `prisma db seed` + root `db:seed`, document and verify commands.

Files Changed:

- `packages/db/prisma/seed.ts` — MVP demo seed (cleanup by slug/email, then users/profiles, two published events, participants, teams/members, bracket, matches, proof prompts + one submission, stakes, activity log). Exits early when `DATABASE_URL` is missing.
- `packages/db/package.json` — `prisma.seed`: `tsx prisma/seed.ts`; script `seed`; devDependency `tsx`.
- `package.json` (root) — script `db:seed`.
- `package-lock.json` — lockfile update for `tsx`.
- `docs/kairo-build-log.md`

Commands Run:

```bash
git status
npm install
npm run db:seed
DATABASE_URL=postgresql://localhost:5432/kairo npm run db:seed
cd packages/db && DATABASE_URL=postgresql://localhost:5432/kairo npx prisma validate
```

Tests / Checks:

- [x] `npm run db:seed` (no `DATABASE_URL` in environment) — exited 0; seed script logged `Skipping seed: DATABASE_URL is not set.`; Prisma reported seed executed.
- [x] `DATABASE_URL=postgresql://localhost:5432/kairo npm run db:seed` — seed attempted DB work; failed with `PrismaClientInitializationError` / user denied access on database `(not available)` (no reachable local Postgres in this environment — expected).
- [x] `DATABASE_URL=postgresql://localhost:5432/kairo npx prisma validate` (in `packages/db`) — passed.

Result:

- From repo root: `npm run db:seed` runs Prisma seed for `@kairo/db`. Set `DATABASE_URL` and apply schema (`db:push` or migrate) before expecting a successful full seed.

Issues:

- Full seed against a live DB was not verified here (no local Postgres accepting the test URL).

Commit:

- `6c4be65` — `db: add MVP seed script and db:seed wiring` (build log commit hash corrected in `8294d9e` on `main`).

Next:

- **PHASE 7:** mobile event discovery UI.

### 2026-05-02 — PHASE 6: Mobile API client (`EXPO_PUBLIC_API_URL`)

Area:

- Mobile / Expo / `mobile`

Before Checklist:

- [x] Opened `docs/kairo-build-log.md`.
- [x] Ran `git status`; inspected `website/app/api/**` and `website/src/lib/api-http.ts` for envelope + routes.

Planned Work:

- Typed fetch client for all MVP REST endpoints; env + `app.config` extra for API base URL and dev user id; align with `{ success, data | error }`.

Files Changed:

- `mobile/app.config.ts` — dynamic config: `extra.apiUrl` / `extra.devUserId` from env at build time.
- `mobile/.env.example` — `EXPO_PUBLIC_API_URL`, optional `EXPO_PUBLIC_KAIRO_DEV_USER_ID`.
- `mobile/src/api/config.ts`, `types.ts`, `kairo-client.ts`, `index.ts` — client + exports + shared input type re-exports.
- `mobile/package.json` — `typecheck`, dependency `@kairo/shared` (`file:../packages/shared`).
- `mobile/package-lock.json`
- `docs/kairo-build-log.md`

Commands Run:

```bash
git status
cd mobile && npm install && npm run typecheck && npm run lint
```

Tests / Checks:

- [x] `npm run typecheck` (mobile) — passed.
- [x] `npm run lint` (mobile) — passed (warnings only in pre-existing root `app/_layout.tsx`; no new errors).

Result:

- Import `createKairoApiFromEnv` from `@/src/api` (or `@/src/api/index`) after copying `mobile/.env.example` → `mobile/.env` and setting `EXPO_PUBLIC_API_URL` to the running Next site. Mutations need a dev user id until Clerk replaces `x-kairo-user-id` on the website.

Issues:

- (none)

Commit:

- `dbe0c15` — `mobile: add Kairo API client and EXPO_PUBLIC_API_URL`

Next:

- **PHASE 10:** Organizer tools on mobile (Phases 7–9 complete on `main`).

### 2026-05-02 — PHASE 7: Mobile event discovery UI

Area:

- Mobile / Expo / `mobile`

Before Checklist:

- [x] Opened `docs/kairo-build-log.md`.
- [x] Ran `git status`; reused Phase 6 `@/src/api` client and existing themed components.

Planned Work:

- Upcoming events list + navigation to read-only event detail; loading / empty / error states aligned with MVP positioning.

Files Changed:

- `mobile/src/features/events/format-event-range.ts`, `use-upcoming-events.ts`, `use-event-detail.ts`, `event-list-row.tsx`
- `mobile/app/(tabs)/index.tsx` — Discover list screen.
- `mobile/app/(tabs)/events/[eventId].tsx` — Event detail screen.
- `mobile/app/(tabs)/_layout.tsx` — Stack screen options, header sign-out.
- `docs/kairo-build-log.md`

Commands Run:

```bash
git status
cd mobile && npm run typecheck && npm run lint
```

Tests / Checks:

- [x] `npm run typecheck` (mobile) — passed.
- [x] `npm run lint` (mobile) — passed (warnings only in root `app/_layout.tsx`).

Result:

- Signed-in users see **Discover** with upcoming published events; tap opens **Event** detail. Requires `EXPO_PUBLIC_API_URL` and a running website with data (e.g. after `db:seed`).

Issues:

- (none)

Commit:

- `8879c9c` — `mobile: add event discovery UI and detail screen`
- `7a753a8` — `docs: record Phase 7 event discovery commit hash`

Next:

- **PHASE 10:** Organizer tools on mobile.

### 2026-05-02 — PHASE 8: Mobile create event (draft)

Area:

- Mobile / Expo / `mobile`

Before Checklist:

- [x] Opened `docs/kairo-build-log.md`.
- [x] Ran `git status`; aligned payload with `createEventSchema` / `POST /api/events`.

Planned Work:

- Screen to collect MVP create-event fields, validate with shared Zod, submit with dev user header, navigate to new event detail.

Files Changed:

- `mobile/src/features/events/create-event-form.tsx`, `create-event-defaults.ts`
- `mobile/app/(tabs)/create.tsx`
- `mobile/app/(tabs)/_layout.tsx` — Create + Sign out on Discover; `create` stack screen.
- `mobile/.env.example`
- `docs/kairo-build-log.md`

Commands Run:

```bash
git status
cd mobile && npm run typecheck && npm run lint
```

Tests / Checks:

- [x] `npm run typecheck` (mobile) — passed.
- [x] `npm run lint` (mobile) — passed (warnings only in root `app/_layout.tsx`).

Result:

- **Create** opens **New event**; **Create draft** posts to the website API (requires `EXPO_PUBLIC_API_URL` + `EXPO_PUBLIC_KAIRO_DEV_USER_ID`). Success opens the new event (draft) on the detail screen. Publish remains a later flow / website.

Issues:

- (none)

Commit:

- `52de809` — `mobile: add create event draft flow`
- `3d792d4` — `docs: record Phase 8 commit hash`

Next:

- **PHASE 10:** Organizer tools on mobile.

### 2026-05-02 — PHASE 9: Mobile join event + teams

Area:

- Mobile / Expo / `mobile`

Before Checklist:

- [x] Opened `docs/kairo-build-log.md`.
- [x] Confirmed Phase 4 routes: `join`, `teams` POST/GET, `teams/[id]/join|leave`.

Planned Work:

- Event detail: join as player/watcher/volunteer; list teams; create team; join/leave team; dev header messaging.

Files Changed:

- `mobile/src/features/events/use-event-teams.ts`, `event-join-section.tsx`, `event-teams-section.tsx`
- `mobile/app/(tabs)/events/[eventId].tsx`
- `docs/kairo-build-log.md`

Commands Run:

```bash
cd mobile && npm run typecheck && npm run lint
```

Tests / Checks:

- [x] `npm run typecheck` (mobile) — passed.
- [x] `npm run lint` (mobile) — passed (warnings only in root `app/_layout.tsx`).

Result:

- On a **published** event, users with dev id can **Join** with role + note, manage **Teams** (create, join, leave). Draft/cancelled paths show copy; teams hidden or explained when `allowTeams` is false.

Issues:

- (none)

Commit:

- (record after `git commit`)

Next:

- **PHASE 10:** Organizer tools MVP on event detail.

---

## Rules

Before every task, update `docs/kairo-build-log.md` with the task under the correct area.

Differentiate clearly between:

- Database / Prisma / `packages/db`
- Website / Next.js / `website`
- Mobile / Expo / `mobile`
- Shared / Packages / Types

Before changing files, run:

```bash
git status
```

Before changing files, inspect the relevant files so you do not create duplicate layouts, duplicate Prisma schemas, duplicate package locks, or wrong route groups.

After finishing a stable chunk, run appropriate checks:

- `npm run db:generate` if database schema changed
- `npm run db:push` or `db:migrate` only when intended
- `npm run typecheck` if available
- `npm run lint` if available

After checks, update `docs/kairo-build-log.md` again with:

- files changed
- commands run
- what passed
- what failed
- what remains

Commit after each stable chunk.

Push to GitHub after each stable commit.

If GitHub remote is missing or push fails, write the exact error in `docs/kairo-build-log.md` and tell the maintainer.

Do not claim something is tested unless you actually ran the check.

Do not mark something done unless the code exists and checks were attempted.

Do not mix mobile, website, and database tasks in the log. Always label the area.
