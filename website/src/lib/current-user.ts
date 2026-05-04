/**
 * API actor id from the mobile app and other non-cookie clients.
 * Value must be the Prisma `User.id` (cuid).
 * Mobile: Clerk metadata `kairoUserId` and/or `POST /api/auth/bootstrap` + SecureStore (see mobile `resolveActingUserId`).
 */
export const KAIRO_USER_ID_HEADER = "x-kairo-user-id";

export function getCurrentUserIdFromRequest(request: Request): string | null {
  const raw = request.headers.get(KAIRO_USER_ID_HEADER);
  const id = raw?.trim();
  return id && id.length > 0 ? id : null;
}

// TODO: Replace with Clerk `auth()` / session on the server when website auth is integrated.
// TODO: Verify Clerk JWT for `POST /api/auth/bootstrap` before trusting mobile-provided identity.
