import { markMeNotificationsRead } from "@/server/me/me-notifications.service";
import { fromServiceResult, parseJsonBody, requireUserId } from "@/src/lib/api-http";
import { err } from "@/src/lib/result";

/**
 * `PATCH /api/me/notifications/read` — upsert read cursor (`NotificationReadState.lastReadAt`).
 * Optional JSON body: `{ "before": "<ISO-8601>" }` (defaults to server `now`).
 */
export async function PATCH(request: Request) {
  const auth = requireUserId(request);
  if (!auth.ok) return auth.response;

  const raw = await parseJsonBody(request);
  if (raw instanceof Response) return raw;

  let before: Date | undefined;
  if (raw && typeof raw === "object" && raw !== null && "before" in raw) {
    const b = (raw as Record<string, unknown>).before;
    if (b === undefined || b === null) {
      // omit
    } else if (typeof b === "string" && b.trim()) {
      const d = new Date(b.trim());
      if (Number.isNaN(d.getTime())) {
        return fromServiceResult(err("Invalid before: expected ISO-8601 date string", "VALIDATION_ERROR"));
      }
      before = d;
    } else if (b !== undefined) {
      return fromServiceResult(err("Invalid before: expected ISO-8601 date string", "VALIDATION_ERROR"));
    }
  }

  const result = await markMeNotificationsRead(auth.userId, before);
  return fromServiceResult(result);
}
