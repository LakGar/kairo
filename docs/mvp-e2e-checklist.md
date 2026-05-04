# MVP end-to-end staging checklist

Use this list when validating **staging** or a **fresh local stack** (`DATABASE_URL` + `db:push` / migrate + seed + API + mobile). Check items in order where dependencies exist (e.g. event before team).

**Prerequisites:** See **`docs/staging-setup.md`** (env, Prisma, storage, device URL).

**After `db:push` / `db:generate`:** Restart the **website** dev server so API routes use the latest Prisma client (see staging doc — avoids false 500s).

---

## Account and profile

- [ ] **Create account** — Sign up with Clerk on mobile (or sign in with existing user).
- [ ] **Bootstrap profile** — After sign-in, confirm `POST /api/auth/bootstrap` succeeds (no persistent “missing user” errors; `x-kairo-user-id` / SecureStore populated).
- [ ] **Complete onboarding** — Full flow through review; `PATCH /api/me/profile/onboarding` succeeds; app lands on Home/tabs without redirect loop back to onboarding.

## Events and participation

- [ ] **Create event** — Organizer creates draft/published event per MVP flow.
- [ ] **Create proof prompt** — Organizer adds at least one proof prompt on the event (if required by your test path).
- [ ] **Join event as another user** — Second user (second device or seeded user + dev header) joins as PLAYER (or chosen role).
- [ ] **Create / join team** — Team created and second user joins where the format allows teams.

## Matches and results

- [ ] **Create match** — Organizer (or allowed role) creates a match with teams as required.
- [ ] **Submit / confirm team result** — Where **team agreement** applies: submit result as one team; opponent **confirms** (or organizer path if **organizer decides**). Confirm UI matches event `resultVerificationMode`.

## Proof

- [ ] **Capture proof** — Participant uses in-app capture flow where enabled.
- [ ] **Upload proof** — Presigned PUT succeeds (`PROOF_STORAGE_*` configured); proof row appears on event.
- [ ] **Approve proof** — Host approves pending submission; status updates in lists.

## Home and notifications

- [ ] **Home score / commitment** — After proof/result milestones, confirm **Kairo Score** / commitment copy updates as expected (`GET /api/me/events` payload).
- [ ] **Notifications** — Badge reflects actionable items; open **Notifications** screen; **Mark all read** clears badge after refocus; CTAs still navigate to event with correct `focus` where applicable.

---

## Notes

- **Two users:** Team result confirmation and “opponent” flows require two distinct Prisma users (two Clerk accounts or one Clerk + one dev-header user, depending on setup).
- **503 on upload URL:** Storage not configured — see staging setup doc.
- **401 on API:** Missing or wrong `x-kairo-user-id` / bootstrap; fix before blaming feature code.
