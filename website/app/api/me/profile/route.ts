import { getMeProfilePayload } from "@/server/me/me-profile.service";
import { fromServiceResult, requireUserId } from "@/src/lib/api-http";

/** `GET /api/me/profile` — acting user + profile + onboarding completion. */
export async function GET(request: Request) {
  const auth = requireUserId(request);
  if (!auth.ok) return auth.response;

  const result = await getMeProfilePayload(auth.userId);
  return fromServiceResult(result);
}
