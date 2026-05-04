import { getMeNotificationsPayload } from "@/server/me/me-notifications.service";
import { fromServiceResult, requireUserId } from "@/src/lib/api-http";

/** `GET /api/me/notifications` — in-app notification feed for the acting user (`x-kairo-user-id`). */
export async function GET(request: Request) {
  const auth = requireUserId(request);
  if (!auth.ok) return auth.response;

  const result = await getMeNotificationsPayload(auth.userId);
  return fromServiceResult(result);
}
