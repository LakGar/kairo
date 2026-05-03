import { joinTeam } from "@/server/teams/team.service";
import { fromServiceResult, parseJsonBody, requireUserId } from "@/src/lib/api-http";

type Ctx = { params: Promise<{ teamId: string }> };

export async function POST(request: Request, ctx: Ctx) {
  const auth = requireUserId(request);
  if (!auth.ok) return auth.response;

  const { teamId } = await ctx.params;
  const body = await parseJsonBody(request);
  if (body instanceof Response) return body;

  const result = await joinTeam(teamId, body, auth.userId);
  return fromServiceResult(result);
}
