import { completeMeProfileOnboarding } from "@/server/me/me-profile.service";
import { fromServiceResult, parseJsonBody, requireUserId } from "@/src/lib/api-http";

/** `PATCH /api/me/profile/onboarding` — persist onboarding answers and mark complete. */
export async function PATCH(request: Request) {
  const auth = requireUserId(request);
  if (!auth.ok) return auth.response;

  const body = await parseJsonBody(request);
  if (body instanceof Response) return body;

  const result = await completeMeProfileOnboarding(auth.userId, body);
  return fromServiceResult(result);
}
