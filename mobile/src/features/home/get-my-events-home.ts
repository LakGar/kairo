import { createKairoApiFromEnv, type ApiMeEventsPayload } from "@/src/api";

/** `GET /api/me/events` — Home dashboard + My Events summaries. */
export async function getMyEventsHome(userId?: string | null): Promise<ApiMeEventsPayload> {
  return createKairoApiFromEnv({ userId }).getMyEvents();
}
