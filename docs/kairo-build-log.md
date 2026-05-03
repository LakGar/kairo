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

## Project Areas

### Database / Prisma / packages/db

Done:

- [x] Prisma schema lives in `packages/db/prisma/schema.prisma`.
- [x] `@kairo/db` package exists (`packages/db`).
- [x] Root scripts include `db:generate`, `db:migrate`, `db:push`, `db:studio`.
- [x] Prisma client generates from the DB package.

In Progress:

- [ ] (none)

Left:

- [ ] Apply migrations or `db:push` against a real PostgreSQL instance when ready.
- [ ] Optional: seed scripts or dev fixtures for local testing.

### Website / Next.js / website

Done:

- [x] `website/lib/db.ts` re-exports `prisma` from `@kairo/db`.
- [x] `website/next.config.ts` transpiles `@kairo/db` (and Turbopack root points at monorepo root).
- [x] App Router present with root `app/layout.tsx` and `app/page.tsx`.

In Progress:

- [ ] (none)

Left:

- [ ] API routes or server actions for events, users, and registrations.
- [ ] Auth aligned with product (Clerk or other) for the **website** if distinct from mobile.
- [ ] `npm run typecheck` script at repo or website level (optional; `next build` runs TypeScript today).

### Mobile / Expo / mobile

Done:

- [x] Auth routes live under `mobile/app/(auth)/` (sign-in, sign-up, index, layout).
- [x] Main tabs live under `mobile/app/(tabs)/`.
- [x] Onboarding routes live under `mobile/app/(onboarding)/`.
- [x] Clerk auth uses `@clerk/expo` and `@clerk/expo/legacy` hooks for sign-in and sign-up flow.

In Progress:

- [ ] (none)

Left:

- [ ] Finalize app location in monorepo (`mobile` vs `apps/mobile`) and workspace wiring if moved.
- [ ] Mobile API consumption against the Next.js / shared backend when APIs exist.

### Shared / Packages / Types

Done:

- [x] Monorepo workspace includes `packages/*` and `website` (root `package.json`).

In Progress:

- [ ] (none)

Left:

- [ ] Shared validators/types package after backend services stabilize.
- [ ] Optional: `packages/shared` for Zod schemas and DTOs consumed by web and mobile.

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
git push
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

- (Push outcome recorded below after commands run.)

After Checklist:

- [x] Updated Done / In Progress / Left sections for all areas.
- [x] Added this work session (push result appended after `git push`).
- [x] Ran `git status`.
- [x] Committed stable changes (scoped to `docs/kairo-build-log.md` only).
- [ ] Pushed to GitHub — see Commit / Issues below.

Commit:

- (Recorded after commit.)

Next:

- Implement website backend APIs or server actions; keep each task scoped and update this log per session.
- Run `npm run db:push` or `db:migrate` when a database URL is configured.

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
