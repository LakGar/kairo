import {
  createManualMatch,
  getMatchesForEvent,
} from "@/server/matches/match.service";
import { fromServiceResult, parseJsonBody, requireUserId } from "@/src/lib/api-http";

type Ctx = { params: Promise<{ eventId: string }> };

export async function GET(_request: Request, ctx: Ctx) {
  const { eventId } = await ctx.params;
  const result = await getMatchesForEvent(eventId);
  return fromServiceResult(result);
}

export async function POST(request: Request, ctx: Ctx) {
  const auth = requireUserId(request);
  if (!auth.ok) return auth.response;

  const { eventId } = await ctx.params;
  const body = await parseJsonBody(request);
  if (body instanceof Response) return body;

  const result = await createManualMatch(eventId, body, auth.userId);
  return fromServiceResult(result, 201);
}
