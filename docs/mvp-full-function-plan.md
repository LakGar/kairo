# Kairo — plan for a fully functioning MVP

This document ties together **`docs/kairo-build-log.md`**, **`docs/onboarding-build-log.md`**, and a quick pass over the **website API**, **mobile app**, and **database** to define what “fully functioning MVP” means and how to get there.

---

## 1. MVP definition (product)

**Kairo MVP = participate, not just register.** A host or player can complete this loop without developer hacks:

1. **Identity** — Sign in; the system knows which **Prisma `User`** is acting (no manual `x-kairo-user-id` copy-paste in steady state).
2. **Discover** — See real upcoming **public events** from the database.
3. **Commit** — Join an event (role), optionally **join/create a team** where the schema allows.
4. **Organize** — Host creates a draft event, **publishes**, sets up **matches / proof prompts**, and can **approve or reject proof**.
5. **Prove** — Participant submits **text or URL proof** against a prompt (MVP: no native camera upload pipeline).
6. **Home signal** — User sees **at least one** meaningful “next action” or commitment surface tied to real data (event-backed or explicit personal commitment backed by API when you add it).

**Non-goals for MVP** (from build log; keep explicit so scope does not creep):

- Real-money **payments** as a product feature (Stripe routes may exist for experiments; they are not required for MVP “done”).
- **AI brackets**, **push notifications**, **full admin web UI**, **wagering** language or flows.
- **Native media upload** (treat photo/video as URL paste or defer).

**Positioning guardrail:** participate / challenge / proof / entry fee — avoid bet / wager / odds / payout framing.

---

## 1.5 Result verification vs proof verification (product plan)

**Winner / result confirmation** and **proof verification** are **separate systems**. They can advance independently: a match may have a **confirmed result** while **proof is still pending**; proof can be **approved** before or after result confirmation depending on flow. **Do not conflate** “who won” with “did someone submit acceptable proof.”

### Principles

1. **Separation of concerns** — Result/score/winner verification uses its own states and actors. Proof uses `ProofSubmission` (or equivalent) and its own review pipeline.
2. **Casual team-vs-team (agreement mode)** — When the product uses **team agreement** for results:
   - One side **submits** a proposed result (score / winner / outcome).
   - The **opponent confirms or disputes**.
   - If **confirmed**, the match **result is confirmed** (result track complete).
   - If **disputed**, the **organizer resolves** (result becomes confirmed by organizer decision).
3. **Organized competition (organizer mode)** — For **tournaments**, **leagues**, **round robin**, **single elimination**, **solo competition**, or any event with **more than two teams** (or other policy you encode), the **organizer decides** the official winner/result. (Team agreement can remain the default only for simple two-team casual challenges—see defaults below.)
4. **Proof is orthogonal** — If the event **requires proof**, proof is still **required regardless of who decided the winner**. Submitting proof and getting it **approved** is a separate gate from **result confirmation**.
5. **Independent completion** — A match can show **result: confirmed** and **proof: pending** at the same time.
6. **“Fully completed” commitment** — A participant/team commitment counts as **fully completed** only when **both** are true:
   - **Result is confirmed** (per the event’s verification mode), **and**
   - **Proof is approved** (or proof is not required for that commitment—if “not required” is a per-event or per-role flag, document it in schema when built).

### Recommended event-level setting (planning; no schema change in this pass)

| Setting | Meaning |
|--------|---------|
| **`resultVerificationMode: TEAM_AGREEMENT`** | Two-sided flow: submit → opponent confirm/dispute → organizer only on dispute. |
| **`resultVerificationMode: ORGANIZER_DECIDES`** | Organizer sets/locks official result; no opponent confirmation step. |

**Suggested defaults by `EventFormat`:**

| `EventFormat` | Default `resultVerificationMode` |
|---------------|----------------------------------|
| `OPEN_MEETUP` | `TEAM_AGREEMENT` |
| `TEAM_TOURNAMENT` | `ORGANIZER_DECIDES` |
| `ROUND_ROBIN` | `ORGANIZER_DECIDES` |
| `SINGLE_ELIMINATION` | `ORGANIZER_DECIDES` |
| `SOLO_COMPETITION` | `ORGANIZER_DECIDES` |

Hosts may override later in settings UI once the field exists.

### Match-level result fields (shipped in repo)

| Field | Role |
|-------|------|
| **`resultVerificationMode`** | `ORGANIZER_DECIDES` (default) or `TEAM_AGREEMENT` (**submit / confirm / dispute** implemented on `Match`; see `POST .../team-result` routes). |
| **`resultStatus`** | `PENDING` → optional `WAITING_CONFIRMATION` (opponent must act) → `CONFIRMED` or `DISPUTED` (then organizer resolves to `CONFIRMED`). Organizer marking a winner sets **`CONFIRMED`** and **`resolvedByUserId`**. |
| **`submittedByTeamId`** | Which team proposed the result (agreement mode). |
| **`confirmedByTeamId`** | Which team confirmed the proposal (agreement mode). |
| **`resolvedByUserId`** | Organizer (or system) who set final result when disputed or in organizer-decides mode. |

Exact state machine naming can be refined in Prisma, but **`WAITING_CONFIRMATION`** should exist whenever the UI is blocked on the **other side**.

### Proof (unchanged conceptual model)

- **`ProofSubmission`** (or current MVP equivalent) stays **separate** from match result fields.
- Proof has its **own** lifecycle, e.g. **`PENDING` → `APPROVED` | `REJECTED`** (already aligned with much of the codebase).

### Implementation backlog (remaining after team-agreement MVP slice)

| Layer | Status / next |
|-------|----------------|
| **Prisma / DB** | `Match` result fields shipped; **`Event.resultVerificationMode`** still optional/future. |
| **`@kairo/shared`** | Team-agreement submit/confirm/dispute Zod schemas shipped. |
| **Website + REST** | Team agreement **POST** routes + services shipped; organizer resolves disputes via existing **`PATCH .../winner`**. |
| **Mobile** | Event detail **Team agreement results** section + organizer toggle for new matches shipped. |
| **Home / “next action”** | **Team result review** action from `GET /api/me/events` when the user must confirm/dispute (`TEAM_RESULT_REVIEW` → event `focus=result`). Further cards (e.g. richer priority vs inbox) — optional. |
| **Commitments / Kairo Score** | **AND** rule (confirmed result ∧ proof approved) — still to do. |
| **Copy / compliance** | Keep participate-first language. |

MVP can still use **organizer-decides** for most events; this document remains the **source of truth** for **result vs proof** separation.

---

## 2. Current state (honest snapshot)

### 2.1 Database (`packages/db`)

| Area | Status |
|------|--------|
| Prisma schema (users, profiles, events, participants, teams, matches, proof, stakes, activity) | **In place** |
| `npm run db:seed` demo graph | **Works when `DATABASE_URL` is set** |
| Prisma Migrate history | Build log notes DB may be **`db:push` managed** vs migrate — pick one for prod; for MVP dev, either is fine if documented |

### 2.2 Website (`website` — Next.js API)

| Area | Status |
|------|--------|
| Service layer + REST under `app/api/**` | **Implemented** (events, join, teams, matches, proof, stakes, billing stubs) |
| Auth | **`x-kairo-user-id` header** only — Clerk (or similar) **not** wired server-side yet |
| Public reads (e.g. `GET /api/events`) | **Working** for discovery without identity |

### 2.3 Mobile (`mobile` — Expo)

| Area | Status |
|------|--------|
| API client + envelopes + dev fallback user id | **Implemented** (`createKairoApiFromEnv`, `EXPO_PUBLIC_API_URL`, `EXPO_PUBLIC_KAIRO_DEV_USER_ID` / Clerk `kairoUserId` priority documented in code paths) |
| Discover (`(home)/index`) | **Uses live `GET /api/events`** |
| Event detail, join, teams, organizer tools, proof submit | **Wired to API** per build log Phases 9–11 |
| **Premium Create Event** (`PremiumCreateEventScreen`, Create tab) | **Not wired** — submit validates locally then `console.log`; **does not** `POST /api/events` |
| **Legacy/API create** (`CreateEventForm` if still present) | Verify single source of truth: **one** create path should call the API |
| Home dashboard | **Partially stubbed** after fixture removal: score / next action are placeholders; **personal commitment** is **SecureStore-only** (not server) |
| Chat / friends / notifications | **No backend** — empty or local-only UX |
| Onboarding (preferences) | **Local-only** completion — no server persistence |

---

## 3. North-star acceptance tests (MVP “done” when these pass)

Run these on **staging** with a real Postgres + deployed Next API + mobile build (or dev LAN as documented in `mobile/.env.example`).

1. **New Clerk user → Kairo user**
   - On first sign-in, a **Kairo `User`** row exists (or is created idempotently) and **Clerk `publicMetadata.kairoUserId`** is set to that Prisma id.
   - Mobile calls **no** `EXPO_PUBLIC_KAIRO_DEV_USER_ID` in production; optional in dev only.

2. **Discover**
   - Discover lists events from **`GET /api/events`**; pull-to-refresh works; empty/error states are understandable.

3. **Create event (host)**
   - From mobile, host creates a **draft** via **`POST /api/events`**, lands on **event detail** with that id, can **publish** and see status change.

4. **Join + team**
   - Non-host joins with a valid role; can join/create team within caps; UI refreshes counts.

5. **Proof loop**
   - Organizer creates a **proof prompt**; participant submits **text or URL** proof; organizer **approves** or **rejects**; participant sees updated state. (Orthogonal to **result verification** — see **§1.5**.)

5b. **Result verification (post–schema work)**
   - In **`TEAM_AGREEMENT`** mode: one team submits result → opponent confirms or disputes → organizer resolves disputes → **`resultStatus: CONFIRMED`**.
   - In **`ORGANIZER_DECIDES`** mode: organizer sets official result; no opponent confirmation step.
   - **Proof** may still be **pending** after result is confirmed; **commitment “fully complete”** requires both when proof is required (**§1.5**).

6. **My events**
   - **`GET /api/me/events`** reflects hosting vs attending for the signed-in Kairo user.

7. **Home**
   - Either: (a) home shows **real** “next action” / commitments from API, or (b) you explicitly scope MVP to **one** home card that is API-backed (e.g. next upcoming event the user joined) and document deferral of the rest.

---

## 4. Workstreams (recommended order)

### Stream A — **Auth bridge (highest leverage)**

**Goal:** Replace dev-header dependency for real users.

- **Website:** Middleware or route helpers: validate Clerk JWT (or session), resolve **Clerk user id → Prisma `User.id`**, attach to request context. Mutations use that id; optionally still accept `x-kairo-user-id` only in `__DEV__` for tools.
- **Mobile:** After sign-in, call a small endpoint e.g. **`POST /api/me/link`** (or Clerk webhook-driven provisioning) to ensure `User` + `Profile` exist and return `kairoUserId` for metadata sync.
- **Acceptance:** New user never touches `.env` dev user id; `GET /api/me/events` works out of the box.

### Stream B — **Create event: ship one happy path**

**Goal:** Premium UI (or trimmed UI) actually creates a draft in the DB.

- Map `CreateEventForm` / premium form state → **`createEventSchema`** payload expected by `POST /api/events`.
- On success: `router.replace` to **`/(tabs)/events/[id]`** (typed route).
- **Acceptance:** Host flow in §3.3 passes.

### Stream C — **Data model for “commitments” (if MVP includes them)**

Pick one for MVP to avoid duplicate concepts:

- **Option 1 (lean):** No separate “commitment” table — Home “commitments” = **upcoming `EventParticipant` rows** + clear copy.
- **Option 2:** Add **`PersonalCommitment`** (or reuse `Stake` / activity pattern) in Prisma + `GET/POST` API; migrate mobile SecureStore flow to sync.

Document the choice in **`docs/kairo-build-log.md`**.

### Stream D — **Home dashboard: minimum viable truth**

- Replace static empty states with **one** API-driven widget (e.g. next event or open proof) even before full “Kairo Score” exists.
- Keep score as “coming soon” until metrics are defined.

### Stream E — **Chat / notifications (explicitly post-MVP or skeleton)**

If MVP **excludes** real-time chat:

- Keep current **empty states**; add **“Coming soon”** only where it reduces support confusion.
- If MVP **includes** notifications only: **`GET /api/notifications`** + mobile `SectionList` — small slice.

### Stream F — **Release engineering**

- **Environments:** `DATABASE_URL`, `EXPO_PUBLIC_API_URL`, Clerk keys, CORS (if Expo web), Android network security config if needed.
- **CI:** `npm run typecheck` / `lint` for `mobile` + `website`; optional `prisma validate`.
- **Migrations:** Decide `migrate deploy` vs `db push` for first production.

### Stream G — **Product polish pass**

- Copy audit (participate-first, no gambling framing).
- Error surfaces: network offline, 401, validation.
- Deep links: open event from notification (post-MVP unless you scope it).

### Stream H — **Result verification vs proof (after schema)**

- Implements **§1.5**: event `resultVerificationMode`, match `resultStatus` + team/user resolution fields, APIs for submit/confirm/dispute/organizer resolve, mobile UX and Home actions, and commitment/scoring rules (**confirmed result ∧ proof approved** when proof is required).

---

## 5. Suggested timeline (indicative)

| Week | Focus |
|------|--------|
| 1 | Stream A (Clerk ↔ Prisma) + smoke E2E auth |
| 2 | Stream B (create draft + navigate) + Stream D (one real home widget) |
| 3 | Stream C decision + proof/organizer regression pass (§3.5–3.6) |
| 4 | Stream F + hardening + MVP demo script |

Adjust based on whether **chat** or **billing** is pulled into MVP.

---

## 6. Documentation hygiene

- Keep **`docs/kairo-build-log.md`** as the running **Done / Left** log per area.
- Use **`docs/onboarding-build-log.md`** only for onboarding UX changes.
- **This file (`mvp-full-function-plan.md`)** is the **strategic** MVP checklist — update when scope changes (e.g. chat in vs out).

---

## 7. Immediate next actions (first PRs)

1. **Wire `PremiumCreateEventScreen` → `createKairoApiFromEnv().createEvent`** (reuse shared Zod payload builder with `CreateEventForm` if possible).
2. **Add `POST /api/me/bootstrap` (name TBD)** — idempotent user provisioning + returns Prisma id for Clerk metadata.
3. **Update `docs/kairo-build-log.md`** “Left” sections: remove stale claims that Phases 6–12 depend on dev header only if Clerk path is underway; note premium create gap explicitly.

---

## 8. Risks

| Risk | Mitigation |
|------|------------|
| Two create UIs diverge | Delete or redirect one; single payload mapper |
| Personal commitment vs event commitment confusion | Rename UI or unify model (Stream C) |
| `localhost` on physical device | Already documented in `mobile/.env.example` — enforce in README |
| Clerk webhook vs client bootstrap race | Idempotent `User` upsert on email/sub; handle duplicates |

---

*Last updated: added **§1.5** (result vs proof verification, planned fields, implementation backlog). Earlier snapshot text may lag the repo (e.g. create-event wiring); prefer `docs/kairo-build-log.md` for “what shipped.”*
