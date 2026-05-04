import { getMeHomePayload } from "@/server/me/me-home.service";
import { fromServiceResult, requireUserId } from "@/src/lib/api-http";

/** `GET /api/me/events` — dashboard payload for the acting user (`x-kairo-user-id`). */
export async function GET(request: Request) {
  const auth = requireUserId(request);
  if (!auth.ok) return auth.response;

  const result = await getMeHomePayload(auth.userId);
  return fromServiceResult(result);
}
