import { markMatchWinner } from "@/server/matches/match.service";
import { fromServiceResult, parseJsonBody, requireUserId } from "@/src/lib/api-http";

type Ctx = { params: Promise<{ matchId: string }> };

export async function PATCH(request: Request, ctx: Ctx) {
  const auth = requireUserId(request);
  if (!auth.ok) return auth.response;

  const { matchId } = await ctx.params;
  const body = await parseJsonBody(request);
  if (body instanceof Response) return body;

  const result = await markMatchWinner(matchId, body, auth.userId);
  return fromServiceResult(result);
}
