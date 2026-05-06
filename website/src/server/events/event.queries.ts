import type { Prisma } from "@kairo/db";
import { EventStatus, RegistrationStatus } from "@prisma/client";

import { prisma } from "@/lib/db";

/** Approved attendees for “who’s going” on the public event page (capped). */
const eventParticipantPreviewArgs = {
  where: { status: RegistrationStatus.APPROVED },
  take: 32,
  orderBy: { createdAt: "asc" as const },
  select: {
    id: true,
    role: true,
    status: true,
    user: { select: { id: true, email: true, profile: true } },
  },
} satisfies Prisma.EventParticipantFindManyArgs;

const eventPublicInclude = {
  organizer: { select: { id: true, email: true, profile: true } },
  _count: {
    select: { teams: true, participants: true, matches: true },
  },
} satisfies Prisma.EventInclude;

/** Single-event fetch only — avoids loading attendee rows on every list. */
const eventDetailInclude = {
  ...eventPublicInclude,
  participants: eventParticipantPreviewArgs,
} satisfies Prisma.EventInclude;

export async function queryEventById(id: string) {
  return prisma.event.findUnique({
    where: { id },
    include: eventDetailInclude,
  });
}

export async function queryEventBySlug(slug: string) {
  return prisma.event.findUnique({
    where: { slug },
    include: eventDetailInclude,
  });
}

export async function queryUpcomingEvents(limit = 50) {
  const now = new Date();
  return prisma.event.findMany({
    where: {
      status: { in: [EventStatus.PUBLISHED, EventStatus.LIVE] },
      startsAt: { gte: now },
    },
    orderBy: { startsAt: "asc" },
    take: limit,
    include: eventPublicInclude,
  });
}

export async function queryEventsCreatedByUser(userId: string) {
  return prisma.event.findMany({
    where: { organizerId: userId },
    orderBy: { startsAt: "desc" },
    include: eventPublicInclude,
  });
}

export async function queryEventsJoinedByUser(userId: string) {
  const parts = await prisma.eventParticipant.findMany({
    where: { userId },
    include: {
      event: { include: eventPublicInclude },
    },
    orderBy: { updatedAt: "desc" },
  });
  return parts.map((p) => p.event);
}
