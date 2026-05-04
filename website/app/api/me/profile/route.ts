import {
  getMeProfilePayload,
  patchMeProfile,
} from "@/server/me/me-profile.service";
import { fromServiceResult, parseJsonBody, requireUserId } from "@/src/lib/api-http";

/** `GET /api/me/profile` — acting user + profile + onboarding completion. */
export async function GET(request: Request) {
  const auth = requireUserId(request);
  if (!auth.ok) return auth.response;

  const result = await getMeProfilePayload(auth.userId);
  return fromServiceResult(result);
}

/** `PATCH /api/me/profile` — partial update of display name, username, bio, and preferences. */
export async function PATCH(request: Request) {
  const auth = requireUserId(request);
  if (!auth.ok) return auth.response;

  const body = await parseJsonBody(request);
  if (body instanceof Response) return body;

  const result = await patchMeProfile(auth.userId, body);
  return fromServiceResult(result);
}
