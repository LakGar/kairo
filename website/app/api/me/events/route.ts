import { NextResponse } from "next/server";

import { getMyCreatedEvents, getMyJoinedEvents } from "@/server/events/event.service";
import { fromServiceResult, requireUserId } from "@/src/lib/api-http";

export async function GET(request: Request) {
  const auth = requireUserId(request);
  if (!auth.ok) return auth.response;

  const hosting = await getMyCreatedEvents(auth.userId);
  if (!hosting.success) return fromServiceResult(hosting);

  const attending = await getMyJoinedEvents(auth.userId);
  if (!attending.success) return fromServiceResult(attending);

  return NextResponse.json({
    success: true,
    data: {
      hosting: hosting.data,
      attending: attending.data,
    },
  });
}
