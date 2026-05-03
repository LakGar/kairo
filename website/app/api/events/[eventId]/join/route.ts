import { EventParticipantRole } from "@prisma/client";

import { joinEvent } from "@/server/events/event.service";
import { err } from "@/src/lib/result";
import { fromServiceResult, parseJsonBody, requireUserId } from "@/src/lib/api-http";

type Ctx = { params: Promise<{ eventId: string }> };

export async function POST(request: Request, ctx: Ctx) {
  const auth = requireUserId(request);
  if (!auth.ok) return auth.response;

  const { eventId } = await ctx.params;
  const body = await parseJsonBody(request);
  if (body instanceof Response) return body;

  if (
    typeof body !== "object" ||
    body === null ||
    !("role" in body) ||
    typeof (body as { role: unknown }).role !== "string"
  ) {
    return fromServiceResult(err("role is required", "VALIDATION_ERROR"));
  }
  const { role, note } = body as { role: string; note?: string | null };
  if (
    role !== "PLAYER" &&
    role !== "WATCHER" &&
    role !== "VOLUNTEER"
  ) {
    return fromServiceResult(err("Invalid role", "VALIDATION_ERROR"));
  }
  const r = role as EventParticipantRole;
  const result = await joinEvent(eventId, auth.userId, r, note ?? null);
  return fromServiceResult(result);
}
