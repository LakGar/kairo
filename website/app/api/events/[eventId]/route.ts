import { getEventById, updateEvent } from "@/server/events/event.service";
import {
  fromServiceResult,
  parseJsonBody,
  requireUserId,
} from "@/src/lib/api-http";
import { getCurrentUserIdFromRequest } from "@/src/lib/current-user";

type Ctx = { params: Promise<{ eventId: string }> };

/** Public read; optional `x-kairo-user-id` enriches payload with `viewerContext`. */
export async function GET(request: Request, ctx: Ctx) {
  const { eventId } = await ctx.params;
  const viewerUserId = getCurrentUserIdFromRequest(request);
  const result = await getEventById(eventId, viewerUserId);
  return fromServiceResult(result);
}

export async function PATCH(request: Request, ctx: Ctx) {
  const auth = requireUserId(request);
  if (!auth.ok) return auth.response;

  const { eventId } = await ctx.params;
  const body = await parseJsonBody(request);
  if (body instanceof Response) return body;

  const result = await updateEvent(eventId, body, auth.userId);
  return fromServiceResult(result);
}
