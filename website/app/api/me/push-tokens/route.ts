import {
  registerPushToken,
  updatePushTokenEnabled,
} from "@/server/me/push-tokens.service";
import { fromServiceResult, parseJsonBody, requireUserId } from "@/src/lib/api-http";

/** `POST /api/me/push-tokens` — register or refresh an Expo device push token for the acting user. */
export async function POST(request: Request) {
  const auth = requireUserId(request);
  if (!auth.ok) return auth.response;

  const body = await parseJsonBody(request);
  if (body instanceof Response) return body;

  const result = await registerPushToken(auth.userId, body);
  return fromServiceResult(result, 200);
}

/** `PATCH /api/me/push-tokens` — enable/disable push delivery for a token owned by this user. */
export async function PATCH(request: Request) {
  const auth = requireUserId(request);
  if (!auth.ok) return auth.response;

  const body = await parseJsonBody(request);
  if (body instanceof Response) return body;

  const result = await updatePushTokenEnabled(auth.userId, body);
  return fromServiceResult(result, 200);
}
