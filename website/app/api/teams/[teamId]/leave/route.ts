import { leaveTeam } from "@/server/teams/team.service";
import { fromServiceResult, requireUserId } from "@/src/lib/api-http";

type Ctx = { params: Promise<{ teamId: string }> };

export async function POST(request: Request, ctx: Ctx) {
  const auth = requireUserId(request);
  if (!auth.ok) return auth.response;

  const { teamId } = await ctx.params;
  const result = await leaveTeam(teamId, auth.userId);
  return fromServiceResult(result);
}
