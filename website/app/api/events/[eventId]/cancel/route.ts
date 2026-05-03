import { cancelEvent } from "@/server/events/event.service";
import { fromServiceResult, requireUserId } from "@/src/lib/api-http";

type Ctx = { params: Promise<{ eventId: string }> };

export async function POST(request: Request, ctx: Ctx) {
  const auth = requireUserId(request);
  if (!auth.ok) return auth.response;

  const { eventId } = await ctx.params;
  const result = await cancelEvent(eventId, auth.userId);
  return fromServiceResult(result);
}
