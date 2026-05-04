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

**MVP mobile roadmap (2026-05-02):** Phases **6–12** are implemented for core flows against the Phase 4 API using the dev user header (`EXPO_PUBLIC_KAIRO_DEV_USER_ID`). Clerk-backed API identity and real media upload remain follow-ups per non-goals above.

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
- [x] **Phase 10 (2026-05-02):** Organizer tools on event detail — `useEventOrganizerData` (matches, proof prompts, proof submissions), `EventOrganizerSection` when `EXPO_PUBLIC_KAIRO_DEV_USER_ID` matches `event.organizerId`: publish / cancel (confirm), list matches with score + winner actions, create match (`createManualMatchSchema`), proof prompts (`createProofPromptSchema`), pending proof approve/reject; draft join copy points hosts to organizer tools; detail wires section above join/teams.
- [x] **Phase 11 (2026-05-02):** Participant proof submit — `useEventProofSubmitData` (prompts, matches, submissions), `EventProofSubmitSection` on published/live events: `submitProofSchema` + `POST /api/events/:id/proof` (TEXT / LINK / PHOTO+VIDEO via URL paste); optional match and prompt chips; “Your submissions” for the dev user; wired on event detail after teams.
- [x] **Phase 12 (2026-05-02):** Log closure + checks — `mobile/app/_layout.tsx` duplicate/unused imports removed (lint clean); `npm run typecheck` + `npm run lint` (mobile), `npm run typecheck -w website`; sign-in second-factor flow committed (Clerk legacy `prepareSecondFactor` / `attemptSecondFactor` paths).
- [x] **2026-05-03 (Discover):** `(tabs)/(home)/index` — participate-first copy per build log positioning; **Cities** row (Near you + cities from API + curated list); **Categories** row (sports, gaming, fitness, creative, community, skills, tournaments, proof, teams, online + All); `discover-config.ts`, `use-discover-palette.ts` (dark = `HomeColors` + `theme/colors` purple); featured cards take themed shell/border.

#### Work session — 2026-05-03 (Mobile / Expo / mobile)

- **Task:** Build premium home dashboard (accountability command center; mock data; no new backend).
- **Before:** `git status` showed many unrelated modified/untracked files across mobile/website; this session targets **only** home dashboard UI under `mobile/src/features/home/*`, `mobile/app/(tabs)/(home)/dashboard.tsx`, and this log.
- **Home route note:** Signed-in home tab is `mobile/app/(tabs)/(home)/dashboard.tsx` (Native Tabs `initialRouteName: "dashboard"`). There is **no** `mobile/app/(tabs)/index.tsx` in this layout; do not add a duplicate tabs index.

**After (2026-05-03):**

- **Done:** Premium home dashboard (mock UI) — score hero, next action, commitments carousel, proof inbox, streak/rank row, invites, quick actions, recent activity; design tokens `#0B0F14` + surfaces; Unsplash placeholders with TODOs in `home.mock.ts`; existing `TabScreenHeader` retained (not duplicated).
- **Files added:** `mobile/src/features/home/home-tokens.ts`, `home.mock.ts`, `home-dashboard.tsx`, `components/*.tsx` (9 components).
- **Files changed:** `mobile/app/(tabs)/(home)/dashboard.tsx` (replaced API-driven feed with scroll + `HomeDashboard`), `docs/kairo-build-log.md` (this session).
- **Commands run:** `npm run typecheck` (mobile) — pass; `npm run lint` (mobile) — pass with 4 pre-existing warnings in `onboarding-welcome-hero.tsx` (unused consts), unrelated to home.
- **App run:** Not executed in this agent session (Expo already running locally per user); visually verify Home tab + navigation on device.
- **Routes used from home (typed):** `/(tabs)/create`, `/(tabs)/events`, `/(tabs)/events/[placeholder]`, `/(tabs)/settings`; Discover remains `(home)/index` via tab switch, not pushed from Join (changed to events list for typed routes).
- **TODOs left:** Wire mock → API; real `eventId` for View Event; proof inbox / submit flows; invite accept/decline; replace remote images with CDN/event covers.
- **Commit:** `99d8a60` — `mobile: build premium home dashboard`
- **Push:** `git push origin main` — succeeded (`466f880..99d8a60`).

#### Work session — 2026-05-03 (Mobile / Expo / mobile) — Chat tab UI

- **Task:** Build sleek chat tab UI (mock threads, chips, search, priority card; black/white premium style; no backend).
- **Before:** `git status` (2026-05-03): large dirty tree across mobile/website; this session targets **only** `mobile/src/features/chat/*`, `mobile/app/(tabs)/(home)/chat.tsx`, and this log.
- **Route note:** Chat tab file is `mobile/app/(tabs)/(home)/chat.tsx` (Native Tabs trigger `name="chat"` under `(home)`). There is **no** separate `mobile/app/(tabs)/chat.tsx` — do not add a duplicate stack/tab route.

**After (2026-05-03):**

- **Done:** Sleek Chat tab — `HomeColors` palette, `TabScreenHeader` + `chrome="feedDark"`, subtitle + search + horizontal category chips (active = white/black), “Needs attention” proof priority card on **All** + **Proof** filters, mock thread list (avatars, badges, unread pills, optional event label), empty state, `Pressable` rows + Review (`console.log` until routes exist).
- **Files added:** `mobile/src/features/chat/chat.types.ts`, `chat.mock.ts`, `components/chat-category-chips.tsx`, `chat-priority-card.tsx`, `chat-thread-card.tsx`, `chat-empty-state.tsx`.
- **Files changed:** `mobile/app/(tabs)/(home)/chat.tsx`, `docs/kairo-build-log.md`.
- **Commands run:** `npm run typecheck` (mobile) — pass; `npm run lint` (mobile) — pass with 4 pre-existing warnings in `onboarding-welcome-hero.tsx`.
- **App run:** Not started in this session (Expo may already be running locally); visually verify **Chat** tab.
- **Route visually checked (source):** `/(tabs)/(home)/chat` (Native Tabs `chat` screen).
- **TODOs left:** Replace mock Unsplash URLs; add `/(tabs)/(home)/chat/[threadId]` (or stack screen) and wire `router.push` from row + proof review; real-time messaging / API later.
- **Commit:** `100645c` — `mobile: build sleek chat tab`
- **Push:** `git push origin main` — succeeded (`22f8c09..100645c`).

#### Work session — 2026-05-03 (Mobile / Expo / mobile) — Home UI refinement

- **Task:** Refine home dashboard black-and-white UI and commitment list layout (remove orange-forward chrome; vertical Luma-style commitments; remove quick actions + home invites card).
- **Before:** `git status` (run at task start); inspect `mobile/src/features/home/*`, `(tabs)/(home)/dashboard.tsx`, `tab-screen-header.tsx`. Note: `mobile/app/(tabs)/index.tsx` is not the home route in this repo — home is `(tabs)/(home)/dashboard.tsx`.

**After (same session):**

- **Palette:** `#0B0F14` bg, `#11161D` / `#171C24` cards, `rgba(255,255,255,0.10)` borders, monochrome text; white/black primary buttons; `#EF4444` notification badge; green/red only for sparse status (score trend up, commitment status lines).
- **Kairo Score:** Flat charcoal card (no warm gradient); white score, white/black tier pill.
- **Next action:** Subtle image gradient; primary = white / black text; secondary = outline on dark.
- **Commitments:** New vertical `CommitmentList` + `CommitmentListItem` (96px thumb, role pill on image, organizer line, title, time/location rows, status, score impact). Removed horizontal `CommitmentsSection` / `CommitmentCard`.
- **Removed from Home:** `QuickActions` grid (file deleted), `InvitesCard` (still on disk for Notifications — file comment + `MOCK_INVITES` reserved).
- **Header:** Single greeting column (no duplicate avatar); `TabScreenHeader` gains optional `notificationBadgeCount` (red count pill) wired from `MOCK_NOTIFICATION_BADGE` in `dashboard.tsx`.
- **Handlers:** `console.log` for Submit proof / Review inbox stubs + `TODO`s; `router.push` for View event + commitment rows with mock ids; notifications → `/(tabs)/notifications`.
- **Commands:** `npm run typecheck`, `npm run lint` (mobile) — pass (same unrelated onboarding warnings).
- **Commit:** `d231cbd` — `mobile: refine home dashboard UI`
- **Push:** `git push origin main` — succeeded (`76cd75b..d231cbd`); follow-up `4776083` — `docs: record home dashboard UI push`.

#### Work session — 2026-05-03 (Mobile / Expo / mobile) — Premium create event screen

- **Task:** Build premium Create Event screen (mock/local state, validation, glassy dark UI); route under events stack; Home header + routes to create; no backend/auth/onboarding/DB/website changes in scope.
- **Before:** `git status` — large mixed dirty tree; this session commits **only** create-event feature files, `tab-screen-header` (+) navigation, `(tabs)/create` + `events` stack registration, and this log.

**After (2026-05-03):**

- **Done:** `PremiumCreateEventScreen` — header (back / centered title / check), cover gradient + FAB `console.log` + TODO image picker, pill name/location/description, time panel (defaults + TODO picker logs), Visibility / Participation / Format / Stakes (conditional notes, no betting copy) / Proof (conditional prompt) / Capacity (gated by toggles) / Access (approval switch + price row TODO), full-width Create button; `validateCreateEventForm`; errors only after submit; clear on edit; success banner + payload `console.log`; TODO backend API comment.
- **Route:** `/(tabs)/events/create` (`mobile/app/(tabs)/events/create.tsx`); `(tabs)/create` tab renders same screen; `TabScreenHeader` home + opens `router.push("/(tabs)/events/create")` (modal + API `CreateEventForm` removed from header).
- **Files added:** `mobile/src/features/events/create-event.types.ts`, `create-event-validation.ts`, `premium-create-event-screen.tsx`, `components/create-event-*.tsx` (pill, section, option-card, toggle-row), `mobile/app/(tabs)/events/create.tsx`.
- **Files changed:** `mobile/app/(tabs)/create.tsx`, `mobile/app/(tabs)/events/_layout.tsx`, `mobile/components/tab-screen-header.tsx`, `docs/kairo-build-log.md`.
- **Commands run:** `npm run typecheck` (mobile) — pass; `npm run lint` (mobile) — pass (onboarding warnings pre-existing).
- **Route visually checked:** Source — `/(tabs)/events/create`, `/(tabs)/create`; device not re-run in agent.
- **TODOs left:** Wire `POST /events` (or client) when ready; image + datetime pickers; entry fee flow; replace `console.log` stubs.
- **Commit:** `41984c7` — `mobile: build premium create event screen`; `94d223f` — `docs: align create event session with commit hash`.
- **Push:** `git push origin main` — succeeded (`b3bde7e..94d223f`).

#### Work session — 2026-05-03 (Mobile / Expo / mobile) — Wire premium create event to API

- **Task:** Wire premium Create Event screen to `POST /api/events` (loading, config + API errors, navigate to event detail on success; map form + schedule `Date`s to `createEventSchema`; keep stake/proof UI local with TODO for follow-up API calls).
- **Before:** `git status` — large unrelated dirty tree across mobile/website; **intended commit scope:** `premium-create-event-screen.tsx`, `premium-create-event-map-api.ts` (new), `create-event-validation.ts`, and this log only.

**After (2026-05-03):**

- **Done:** Premium create submits through `createKairoApiFromEnv` + `createEvent` (`POST /api/events`); default schedule uses real `Date` (+7d noon, +1h end) with display labels from `Intl`; payload aligned via `createEventSchema.safeParse` (`premium-create-event-map-api.ts`); `validateCreateEventForm(..., { skipStartLabel: true })` + `validatePremiumScheduleDates`; missing `EXPO_PUBLIC_API_URL` or acting user id shows the requested configuration message; loading disables header check + primary CTA; `apiError` banner for Zod/API failures; success → `router.replace(\`/(tabs)/events/${id}\`)`; TODO comment for stake/proof/image picker/payments.
- **Files added:** `mobile/src/features/events/premium-create-event-map-api.ts`
- **Files changed:** `mobile/src/features/events/premium-create-event-screen.tsx`, `mobile/src/features/events/create-event-validation.ts`, `docs/kairo-build-log.md`
- **Commands run:** `cd mobile && npm run typecheck` — pass; `cd mobile && npm run lint` — pass (4 pre-existing onboarding warnings); `cd website && npm run typecheck` — pass
- **Device / app:** Not run in agent (API wiring verified by typecheck + lint only).
- **Create event API:** Wired for premium screen (draft on server; same as `CreateEventForm`).
- **TODOs left:** Date/time picker to mutate `schedule`; image picker; entry fee UI → cents; chain `createStake` / `createProofPrompt` after create when field mapping is complete.
- **Commit:** `960e185` — `mobile: wire premium create event to API`
- **Push:** `git push origin main` — succeeded (`c30c6ba..960e185`)

#### Work session — 2026-05-03 (Mobile + Website) — Clerk Prisma user bootstrap

- **Task:** Idempotent `POST /api/auth/bootstrap` (website) + mobile SecureStore persistence + `resolveActingUserId` prefers bootstrapped Prisma id before `EXPO_PUBLIC_KAIRO_DEV_USER_ID`; keep dev header fallback and optional Clerk metadata `kairoUserId`.
- **Before:** `git status` — large unrelated dirty tree; **intended commit scope:** Prisma `User.clerkUserId`, `@kairo/shared` bootstrap schema, website bootstrap route/service, mobile API + hook + signed-in tabs layout, env examples, this log.

**After (2026-05-03):**

- **Schema:** `User.clerkUserId String? @unique` in `packages/db/prisma/schema.prisma` (run `db:migrate` / `db:push` when applying to a database).
- **Shared:** `authBootstrapRequestSchema` + `AuthBootstrapRequestInput` in `packages/shared/src/auth-bootstrap.ts`.
- **Website:** `POST /api/auth/bootstrap` → `bootstrapClerkUser` — find by `clerkUserId`, else by email (attach `clerkUserId`), else create `User` + `Profile`; profile upsert respects unique `username`; TODOs for Clerk token verification; `current-user.ts` doc note.
- **Mobile:** `postAuthBootstrap`, SecureStore `{ prismaUserId, clerkUserId }`, `resolveActingUserId` = explicit metadata → bootstrap → dev; `useBootstrapKairoUser` in `(tabs)/_layout` after sign-in; `__DEV__` warnings only; `mobile/.env.example` + `website/.env.example` notes.
- **Commands run:** `npm run db:generate` (root) — pass; `cd mobile && npm run typecheck` + `npm run lint` — pass (4 pre-existing onboarding warnings); `cd website && npm run typecheck` + `npm run lint` — pass.
- **Device / app:** Not run in agent.
- **TODOs:** Production Clerk JWT verification on bootstrap; optional `db:push` for new column; wire website mutating routes off raw header when ready.
- **Commit:** `487fe4a` — `auth: add Clerk Prisma user bootstrap`; `8342c11` — `docs: record Clerk bootstrap session`
- **Push:** `git push origin main` — succeeded (`5badf0f..8342c11`)

#### Work session — 2026-05-03 (Mobile + Website) — Add My Events API and wire Home dashboard

- **Task:** Extend `GET /api/me/events` with grouped `EventSummary` + Home blocks (actions, proof inbox, MVP stats, recent activity); wire `HomeDashboard` to real data with loading / error / pull-to-refresh; keep UI components and styling.
- **Before:** `git status` — large unrelated dirty tree; **intended commit scope:** `website/app/api/me/events`, `website/src/server/me/me-home.service.ts`, mobile home + API types + `EventListRow` / `use-my-events` / My Events tab, this log.

**After (2026-05-03):**

- **Endpoint:** `GET /api/me/events` returns `ApiMeEventsPayload` — `hosting` / `attending` / `invited` (empty) / `watching` / `volunteering` summaries, `actions`, `proofInbox`, `stats` (MVP placeholder score with code comment), `recentActivity` (last 5 `ActivityLog` rows for user or related events).
- **Website:** `website/src/server/me/me-home.service.ts` — Prisma queries by organizer + participant roles; proof prompts for upcoming joined events → submit action; pending proof for host → review actions + inbox; `imageUrl` always null until schema supports it.
- **Mobile:** `getMyEventsHome`, `me-home-map.ts`, `home-dashboard.tsx` — fetch on mount, `RefreshControl`, error + retry, merge API commitments with personal row; `COMMITMENT_COVER_PLACEHOLDER`; `EventListRow` accepts `ApiHomeEventSummary`; My Events tab uses summaries; empty commitments copy + Create / Discover + personal link.
- **Commands run:** `cd website && npm run typecheck` + `npm run lint` — pass; `cd mobile && npm run typecheck` + `npm run lint` — pass (4 pre-existing onboarding warnings).
- **Device / app:** Not run in agent.
- **TODOs:** Proof submit/review routes; real scoring model; `weeklyRank`; optional prune unused `getMyCreatedEvents` / `getMyJoinedEvents` if nothing else imports them.
- **Commit:** `7539b93` — `home: wire dashboard to my events API`; `4859082` — `docs: record home dashboard API session`
- **Push:** `git push origin main` — succeeded (`c3f482f..4859082`)

#### Work session — 2026-05-03 (Mobile / Expo / mobile) — Wire Home proof actions to event detail

- **Task:** Replace Home proof `console.log` stubs with navigation to `/(tabs)/events/[eventId]?focus=proof|organizer` (+ optional `proofSubmissionId` / `matchId`); event detail shows small banners and attempts a simple scroll to the proof or organizer block.
- **Before:** `git status` — large unrelated dirty tree; **intended commit scope:** `home-dashboard`, `event-proof-nav`, `next-action-card`, `proof-inbox-card`, `home.mock` / `me-home-map`, `[eventId]` event screen, `ApiHomeAction` + `MeHomeAction` fields, this log.

**After (2026-05-03):**

- **Routes:** Home next action (Submit / Review), proof inbox **Review** (first item with `eventId`, else Discover), and inbox **row** presses → `buildEventDetailFocusHref`; `__DEV__` `console.log` only when `eventId` missing.
- **Event detail:** `pickSearchParam` for `eventId` / `focus`; `ProofFocusBanner` above organizer or proof block; delayed `scrollTo` from measured layout + `lowerPanelTopY`; TODO comment for future use of `proofSubmissionId` / `matchId` in UI.
- **Website:** `REVIEW_PROOF` actions include `proofSubmissionId` and `matchId` from Prisma submission.
- **Commands run:** `cd mobile && npm run typecheck` + `npm run lint` — pass (4 pre-existing onboarding warnings); `cd website && npm run typecheck` — pass.
- **Device / app:** Not run in agent.
- **TODOs:** Highlight a specific proof submission using query ids; tune auto-scroll vs keyboard.
- **Commit:** `d430245` — `mobile: wire home proof actions to events`; follow-up doc-only commits on `main` for this session log
- **Push:** `git push origin main` — succeeded (branch up to date with `origin/main`)

#### Work session — 2026-05-03 (Mobile / Expo / mobile) — Persist premium create event stake and proof prompt

- **Task:** After `POST /api/events` from premium Create Event, chain `POST .../proof-prompts` and `POST .../stakes` when the user selected non-NONE proof/stake types; keep loading until chained calls finish; navigate to event detail on success; on partial failure warn in `__DEV__` and still navigate (TODO: event detail banner).
- **Before:** `git status` — mixed dirty tree; **intended commit scope:** `premium-create-event-screen.tsx`, `premium-create-event-map-api.ts`, this log only.

**After (2026-05-03):**

- **Persisted:** `premiumProofPromptPayloadForApi` / `premiumStakePayloadForApi` (`premium-create-event-map-api.ts`) map UI choices to `@kairo/shared` `createProofPromptSchema` / `createStakeSchema` bodies — proof API type `PHOTO` or `TEXT` (score / friend / organizer paths use `TEXT`); default titles and short descriptions; custom `proofPrompt` trims to title when non-empty; `isRequired: true` when proof is enabled; stake titles (“Loser task”, “Donation challenge”, “Prize/reward challenge”) and descriptions from `stakeNote` or defaults (no betting copy).
- **Flow:** `createEvent` → optional `createProofPrompt` + `createStake` (separate try/catch); `submitting` stays true for the full chain; `router.replace` to new event always after successful event create unless an error is thrown before navigation; partial failures → `console.warn` in `__DEV__` + TODO for event detail banner.
- **Files changed:** `mobile/src/features/events/premium-create-event-map-api.ts`, `mobile/src/features/events/premium-create-event-screen.tsx`, `docs/kairo-build-log.md`.
- **Commands run:** `cd mobile && npm run typecheck` — pass; `cd mobile && npm run lint` — pass (4 pre-existing onboarding warnings). Website typecheck not required (no website/shared edits).
- **TODOs left:** Event detail banner when proof/stake chain fails after event create; optional parallel `Promise.allSettled` if latency matters.
- **Commit:** `9939822` — `mobile: persist create event proof and stake`; `9fd6f07` — `docs: record PR5 commit hash`
- **Push:** `git push origin main` — succeeded (`origin/main` advanced to include PR5 commits)

#### Work session — 2026-05-03 (Mobile / Expo / mobile) — Proof cleanup: photo/video premium prompts + persist

- **Task:** Tighten premium Create Event proof to **photo/video-only** options; remove text/score/friend/organizer proof paths from that UI; persist **ProofPrompt** after `POST /api/events` with `PHOTO` / `VIDEO` (combined **Photo or video** → store **`PHOTO`** until multi-type prompts); local template “Generate / Regenerate” (no AI API); keep `TEXT`/`LINK` in shared/Prisma for existing flows.
- **Before:** `git status` — mixed dirty tree; **intended commit scope:** `create-event.types.ts`, `premium-create-event-map-api.ts`, `premium-create-event-screen.tsx`, `premium-proof-prompt-templates.ts` (new), this log.

**After (2026-05-03):**

- **UI:** Proof section options — None, Photo, Video, Photo or video; helper copy about Kairo capture + “no network” for templates; **Generate prompt** / **Regenerate** fill the prompt title field from `suggestPremiumProofPromptContent` (keywords: basketball, pickleball, running + format/title/description haystack).
- **API payload:** `premiumProofPromptPayloadForApi` — title from user field or template; description = template capture text + `PHOTO_OR_VIDEO` TODO sentence + capture expectation; `isRequired: true`; `PHOTO_OR_VIDEO` → `proofType: PHOTO` with code TODO.
- **Backend/schema:** Unchanged (no enum removal; submit proof + organizer TEXT/LINK unchanged).
- **Files:** `mobile/src/features/events/create-event.types.ts`, `premium-create-event-map-api.ts`, `premium-create-event-screen.tsx`, `premium-proof-prompt-templates.ts`, `docs/kairo-build-log.md`.
- **Commands run:** `cd mobile && npm run typecheck` + `npm run lint` — pass (4 pre-existing onboarding warnings). Website checks not run (no website edits).
- **TODOs left:** Event detail banner when proof prompt create fails post-event; in-app camera capture; multi-type ProofPrompt; narrow organizer proof prompt UI to photo/video when product ready.
- **Commit:** `d739e06` — `proof: restrict create event proof to photo video prompts`; `e9f5f12` — `docs: record proof cleanup session commit`
- **Push:** `git push origin main` — succeeded

#### Work session — 2026-05-03 (Mobile / Expo / mobile) — In-app photo/video proof capture

- **Task:** Add `expo-camera` flow from event detail — capture photo or record video (≤10s), preview, retake, submit via `submitProof` with temporary `file:` URI in `url` (TODO: replace with storage URL); route `/(tabs)/proof-capture` with query params; permission-denied UX; extend `@kairo/shared` `submitProofSchema` so `file:` passes validation for PHOTO/VIDEO while LINK stays http(s)-only.
- **Before:** `git status` — mixed dirty tree; **intended commit scope:** proof capture feature files, `event-proof-submit-section`, tabs layout + route, `app.json` plugin, `packages/shared` proof schema, `mobile` lockfile, this log.

**After (2026-05-03):**

- **Dependency:** `expo-camera` (Expo SDK 54–aligned via `npx expo install expo-camera`); `app.json` `expo-camera` plugin for camera + microphone strings.
- **Route:** `mobile/app/(tabs)/proof-capture.tsx` (modal stack screen) + `ProofCaptureScreen` (`proof-capture-screen.tsx`, `proof-capture.types.ts`).
- **Event detail:** `EventProofSubmitSection` — match + prompt chips first; for selected prompt with `proofType` PHOTO/VIDEO, **Capture photo** / **Capture video** opens capture route with `eventId`, `promptId`, `matchId`, `promptTitle`; legacy TEXT/LINK + URL path unchanged when no prompt or TEXT/LINK prompt.
- **Shared:** `submitProofSchema` — `url` co-validated in `superRefine`; `file:` allowed for PHOTO/VIDEO; LINK requires http(s).
- **Commands run:** `cd mobile && npm run typecheck` + `npm run lint` — pass (4 pre-existing onboarding warnings); `cd website && npm run typecheck` + `npm run lint` — pass.
- **TODOs left:** Upload pipeline (S3/Supabase) replacing `file:` URIs; video preview component; optional `expo-av`; AI verification; paywall.
- **Commit:** `0533762` — `mobile: add in-app proof capture`; `5f64cee` — `docs: record proof capture PR6 commit`
- **Push:** `git push origin main` — succeeded

#### Work session — 2026-05-03 (Mobile + Website) — Durable proof media upload (S3 presigned PUT)

- **Task:** Replace `file:` proof submissions from capture with **HTTPS object URLs** — `POST /api/proof-media/upload-url` returns presigned **PUT** + `publicUrl`; mobile uploads via `expo-file-system` `File` + `fetch`, then `submitProof` with `publicUrl`; S3-compatible env (`PROOF_STORAGE_*`); server rejects `file:` for PHOTO/VIDEO unless `PROOF_ALLOW_FILE_URL=1`.
- **Before:** No object storage in repo; **intended commit scope:** website proof-media service + route + deps, `proof.service` guard, `@kairo/shared` request/response types, mobile client + capture upload helper + screen, env examples, this log.

**After (2026-05-03):**

- **Storage approach:** **AWS SDK v3** `S3Client` + `getSignedUrl(PutObjectCommand)` — works with **AWS S3**, **Cloudflare R2** (`PROOF_STORAGE_ENDPOINT` + `forcePathStyle`), **MinIO**, etc. No Supabase in tree.
- **API:** `POST /api/proof-media/upload-url` — Zod `proofMediaUploadRequestSchema`; keys `proof/{eventId}/{userId}/{ts}-{rand}.{ext}`; content types: `image/jpeg`, `image/png`, `video/mp4`, `video/quicktime`; size limits enforced on request body.
- **Mobile:** `createProofMediaUploadUrl` on API client; `proof-capture-upload.ts` — presign then **PUT** body; statuses “Uploading proof…” / “Submitting proof…”; upload failure does not call `submitProof`; **TODO** orphan object if submit fails after upload.
- **Deps:** website `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`; mobile `expo-file-system` (for reading captured file as upload body).
- **Env:** `website/.env.example` documents `PROOF_STORAGE_*` + `PROOF_ALLOW_FILE_URL`; `mobile/.env.example` points to website config.
- **Real storage test:** **Not run** in agent (no bucket/credentials in environment).
- **Commands run:** `cd mobile && npm run typecheck` + `npm run lint` — pass (4 pre-existing onboarding warnings); `cd website && npm run typecheck` + `npm run lint` — pass.
- **TODOs left:** Orphan upload cleanup; tighten `http:` disallow in production; optional deep participant check on presign; virus scan / moderation.
- **Commit:** `d650fe5` — `proof: add durable media upload pipeline`; `9e33f1b` — `docs: record proof upload PR7 commit hash`
- **Push:** `git push origin main` — succeeded (`ab6e774..d650fe5`, then `d650fe5..9e33f1b`)

#### Work session — 2026-05-03 (Website + Shared + Mobile) — Harden proof upload validation

- **Task:** Production-durable PHOTO/VIDEO URLs; explicit dev `file:` gate; presign **403** unless organizer or **APPROVED** participant; validate `matchId` / `promptId` belong to event on presign; clearer mobile errors; document storage/moderation TODOs.
- **URL policy (`proof.service.ts`):** `file:` only when `PROOF_ALLOW_FILE_URL=1` **and** `NODE_ENV !== "production"`; **`file:` always rejected in production.** PHOTO/VIDEO require **https** in production; in non-production **http** allowed only for **localhost** (local MinIO). LINK unchanged (http(s)).
- **Authorization:** `assertUserMaySubmitProofForEvent` — organizer **or** `EventParticipant` with `APPROVED`; used by **submitProof** and **createProofMediaUploadUrl** (replaces prior submit path that allowed PENDING). Presign checks `Match` / `ProofPrompt` scoped to `eventId` before issuing URL.
- **Shared:** `submitProofSchema` — PHOTO/VIDEO URLs reject non-local **http** (aligns with server); still require non-empty url for PHOTO/VIDEO.
- **Mobile:** `NOT_CONFIGURED` / 503 → “Proof uploads are not configured yet.”; `FORBIDDEN` / 403 → “You must be part of this event to submit proof.”; after successful upload, schema/submit failures → retry copy + TODO orphan delete.
- **Commands run:** `cd packages/shared && npx tsc --noEmit`; `cd website && npm run typecheck` + `npm run lint`; `cd mobile && npm run typecheck` + `npm run lint` — pass (4 pre-existing onboarding warnings).
- **TODOs left:** Orphan upload deletion; virus scan / moderation; EXIF policy; deep rate limits on presign.
- **Commit:** `f5585d0` — `proof: harden media upload validation`
- **Push:** `git push origin main` — succeeded

#### Work session — 2026-05-03 (Mobile / Expo / mobile) — Discover (Kairo positioning + theme)

- **Task:** Finish Discover — align with `theme/colors` + dashboard `HomeColors`; add **cities** and **Kairo-wide categories** (not concerts-only); copy grounded in `docs/kairo-build-log.md` (“participate”, proof/teams/challenges; avoid gambling framing).
- **Before:** Read `docs/kairo-build-log.md` for MVP positioning; `git status` (large dirty tree; scope Discover + small `HomeColors` / commitment card fix).

**After:**

- **Config:** `mobile/src/features/discover/discover-config.ts` — `DISCOVER_COPY`, `DISCOVER_CURATED_CITIES`, `DISCOVER_CATEGORIES` (keyword heuristics on `activityType` / title / description + `allowTeams` / `allowVolunteers` / `format` / `_count.matches`), `buildCityChips`, `matchesCityFilter`, `headlineFromEvents`.
- **Palette:** `use-discover-palette.ts` — light uses `useUIPalette` + `useColor`; dark uses `HomeColors` surfaces + purple accent from `theme/colors`.
- **Screen:** `app/(tabs)/(home)/index.tsx` — location headline reacts to city chip; labeled **Cities** / **Categories** rows; search placeholder + list headings use participate language.
- **Featured card:** accepts `imageShellBg` / `outlineColor` from palette.
- **Home tokens:** `HomeColors` extended with `surface`, `surfaceStrong`, `accent`, `warning` for dashboard components that still reference them.
- **Commitment card:** date line uses `timeLabel` + `locationLabel` (matches `MockCommitment` in `home.mock.ts`).

**Files:** `mobile/app/(tabs)/(home)/index.tsx`, `mobile/src/features/discover/discover-config.ts`, `discover-featured-card.tsx`, `use-discover-palette.ts`, `mobile/src/features/home/home-tokens.ts`, `mobile/src/features/home/components/commitment-card.tsx`, `docs/kairo-build-log.md`.

**Checks:** `cd mobile && npx tsc --noEmit --incremental false` — pass (`npm run typecheck` may hit stale incremental refs until cache cleared).

**Commit / push:** Maintainer commits when the wider dirty tree is ready.

In Progress:

- [ ] (none)

Left:

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

- `cd2e490` — `mobile: add join event and team flows on event detail`
- `d92397d` — `docs: record Phase 9 commit hash`

Next:

- **PHASES 11–12:** See session at end of log (proof submit + closure).

### 2026-05-02 — PHASE 10: Mobile organizer tools on event detail

Area:

- Mobile / Expo / `mobile`

Before Checklist:

- [x] Opened `docs/kairo-build-log.md`.
- [x] Confirmed Phase 4 routes: `publish`, `cancel`, `matches`, `proof-prompts`, `proof`, match score/winner, proof approve/reject.

Planned Work:

- Host-only section on event detail: lifecycle, matches CRUD-lite, proof prompts, proof inbox.

Files Changed:

- `mobile/src/features/events/use-event-organizer-data.ts`, `event-organizer-section.tsx`
- `mobile/app/(tabs)/events/[eventId].tsx` — `EventOrganizerSection` + order (organizer above join/teams).
- `mobile/src/features/events/event-join-section.tsx` — draft copy for host vs guest.
- `docs/kairo-build-log.md`

Commands Run:

```bash
cd mobile && npm run typecheck && npm run lint
```

Tests / Checks:

- [x] `npm run typecheck` (mobile) — passed.
- [x] `npm run lint` (mobile) — passed (warnings only in root `app/_layout.tsx`; cleared in Phases 11–12 session).

Result:

- When the dev user id matches the event organizer, **Organizer tools** loads matches, prompts, and submissions; publish/cancel, create match (team chips + optional round/match#/schedule), score/winner updates, add proof prompts, approve/reject pending proof.

Issues:

- (none)

Commit:

- `300ec95` — `mobile: add organizer tools on event detail`
- `0fd7b44` — `docs: record Phase 10 commit hash`

Next:

- **PHASES 11–12:** Delivered in session below (MVP mobile roadmap complete for Phases 6–12).

### 2026-05-02 — PHASES 11–12: Participant proof submit + MVP log closure

Area:

- Mobile / Expo / `mobile` (proof UI, layout lint, sign-in MFA)

Before Checklist:

- [x] Opened `docs/kairo-build-log.md`.
- [x] Confirmed `submitProofSchema` and `POST /api/events/[eventId]/proof`.

Planned Work:

- Phase 11: participant proof submit on event detail (text + URL types per shared Zod).
- Phase 12: clear mobile root lint noise; run mobile + website typechecks; record closure; include pending sign-in second-factor improvements.

Files Changed:

- `mobile/src/features/events/use-event-proof-submit-data.ts`, `event-proof-submit-section.tsx`
- `mobile/app/(tabs)/events/[eventId].tsx` — `EventProofSubmitSection` after teams.
- `mobile/app/_layout.tsx` — single `expo-router` import; drop unused `Stack` / `StatusBar`.
- `mobile/app/(auth)/sign-in.tsx` — second-factor preparation and verification flow.
- `docs/kairo-build-log.md`

Commands Run:

```bash
cd mobile && npm run typecheck && npm run lint
npm run typecheck -w website
```

Tests / Checks:

- [x] `npm run typecheck` (mobile) — passed.
- [x] `npm run lint` (mobile) — passed (no warnings).
- [x] `npm run typecheck` (website) — passed.

Result:

- Published/live events show **Submit proof** with validation aligned to the API; users see their own submission rows. Root layout lint is clean. Sign-in supports email/phone/TOTP/backup second factors when Clerk returns `needs_second_factor`.

Issues:

- (none)

Commit:

- `9a8667a` — `mobile: proof submit, layout cleanup, and sign-in second factor`
- `ed9e5c7` — `docs: record Phases 11-12 mobile commit hash`

Next:

- Product follow-ups: Clerk on website API, real uploads, optional monorepo workspace for `mobile`.

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
