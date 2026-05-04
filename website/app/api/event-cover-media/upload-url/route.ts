import { createEventCoverMediaUploadUrl } from "@/server/proof/proof-media-upload.service";
import { fromServiceResult, parseJsonBody, requireUserId } from "@/src/lib/api-http";

export async function POST(request: Request) {
  const auth = requireUserId(request);
  if (!auth.ok) return auth.response;

  const body = await parseJsonBody(request);
  if (body instanceof Response) return body;

  const result = await createEventCoverMediaUploadUrl(body, auth.userId);
  return fromServiceResult(result, 200);
}
