import { createEvent, getUpcomingEvents } from "@/server/events/event.service";
import { fromServiceResult, parseJsonBody, requireUserId } from "@/src/lib/api-http";

export async function GET() {
  const result = await getUpcomingEvents();
  return fromServiceResult(result);
}

export async function POST(request: Request) {
  const auth = requireUserId(request);
  if (!auth.ok) return auth.response;

  const body = await parseJsonBody(request);
  if (body instanceof Response) return body;

  const result = await createEvent(body, auth.userId);
  return fromServiceResult(result, 201);
}
