import { approveProof } from "@/server/proof/proof.service";
import { fromServiceResult, requireUserId } from "@/src/lib/api-http";

type Ctx = { params: Promise<{ proofSubmissionId: string }> };

export async function POST(request: Request, ctx: Ctx) {
  const auth = requireUserId(request);
  if (!auth.ok) return auth.response;

  const { proofSubmissionId } = await ctx.params;
  const result = await approveProof(proofSubmissionId, auth.userId);
  return fromServiceResult(result);
}
