import type { Prisma } from "@kairo/db";

import { prisma } from "@/lib/db";

export async function logActivity(input: {
  eventId?: string | null;
  userId?: string | null;
  action: string;
  metadata?: Prisma.InputJsonValue;
}): Promise<void> {
  await prisma.activityLog.create({
    data: {
      eventId: input.eventId ?? undefined,
      userId: input.userId ?? undefined,
      action: input.action,
      metadata:
        input.metadata === undefined
          ? undefined
          : (input.metadata as Prisma.InputJsonValue),
    },
  });
}
