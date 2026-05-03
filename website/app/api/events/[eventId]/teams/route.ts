import { createTeam, getTeamsForEvent } from "@/server/teams/team.service";
import { fromServiceResult, parseJsonBody, requireUserId } from "@/src/lib/api-http";

type Ctx = { params: Promise<{ eventId: string }> };

export async function GET(_request: Request, ctx: Ctx) {
  const { eventId } = await ctx.params;
  const result = await getTeamsForEvent(eventId);
  return fromServiceResult(result);
}

export async function POST(request: Request, ctx: Ctx) {
  const auth = requireUserId(request);
  if (!auth.ok) return auth.response;

  const { eventId } = await ctx.params;
  const body = await parseJsonBody(request);
  if (body instanceof Response) return body;

  const result = await createTeam(eventId, body, auth.userId);
  return fromServiceResult(result, 201);
}
