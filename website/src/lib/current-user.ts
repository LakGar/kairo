/**
 * Temporary dev identity for API routes until Clerk (or other) auth is wired on the website.
 *
 * Send: `x-kairo-user-id: <user cuid>` from clients (e.g. mobile) in local development only.
 */
export const KAIRO_USER_ID_HEADER = "x-kairo-user-id";

export function getCurrentUserIdFromRequest(request: Request): string | null {
  const raw = request.headers.get(KAIRO_USER_ID_HEADER);
  const id = raw?.trim();
  return id && id.length > 0 ? id : null;
}

// TODO: Replace with Clerk `auth()` / session on the server when website auth is integrated.
