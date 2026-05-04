import {
  EventParticipantRole,
  EventStatus,
  RegistrationStatus,
} from "@prisma/client";

import { prisma } from "@/lib/db";
import { err, ok, type Result } from "@/src/lib/result";
import { ensureUniqueEventSlug } from "@/src/lib/slug";
import { ActivityAction } from "@/server/activity/activity-actions";
import { logActivity } from "@/server/activity/activity.service";
import {
  queryEventById,
  queryEventBySlug,
  queryEventsCreatedByUser,
  queryEventsJoinedByUser,
  queryUpcomingEvents,
} from "@/server/events/event.queries";
import {
  parseCreateEvent,
  parseJoinEvent,
  parseUpdateEvent,
} from "@/server/events/event.validators";

export async function createEvent(
  input: unknown,
  currentUserId: string,
): Promise<Result<Awaited<ReturnType<typeof queryEventById>>>> {
  const parsed = parseCreateEvent(input);
  if (!parsed.success) {
    const msg = parsed.error.flatten().fieldErrors
      ? JSON.stringify(parsed.error.flatten().fieldErrors)
      : parsed.error.message;
    return err(msg, "VALIDATION_ERROR");
  }
  const d = parsed.data;
  const slug = await ensureUniqueEventSlug(prisma, d.title);

  const event = await prisma.$transaction(async (tx) => {
    const e = await tx.event.create({
      data: {
        organizerId: currentUserId,
        slug,
        title: d.title,
        description: d.description?.trim() || null,
        activityType: d.activityType,
        format: d.format,
        visibility: d.visibility,
        locationName: d.locationName ?? null,
        address: d.address ?? null,
        city: d.city ?? null,
        state: d.state ?? null,
        country: d.country ?? null,
        coverImageUrl: d.coverImageUrl ?? null,
        startsAt: d.startsAt,
        endsAt: d.endsAt ?? null,
        maxTeams: d.maxTeams ?? null,
        maxSoloPlayers: d.maxSoloPlayers ?? null,
        maxWatchers: d.maxWatchers ?? null,
        maxVolunteers: d.maxVolunteers ?? null,
        entryFeeCents: d.entryFeeCents ?? null,
        currency: d.currency ?? "USD",
        allowTeams: d.allowTeams,
        allowSoloPlayers: d.allowSoloPlayers,
        allowWatchers: d.allowWatchers,
        allowVolunteers: d.allowVolunteers,
        status: EventStatus.DRAFT,
      },
    });
    await tx.eventParticipant.create({
      data: {
        eventId: e.id,
        userId: currentUserId,
        role: EventParticipantRole.ORGANIZER,
        status: RegistrationStatus.APPROVED,
      },
    });
    await tx.activityLog.create({
      data: {
        eventId: e.id,
        userId: currentUserId,
        action: ActivityAction.EVENT_CREATED,
        metadata: { title: e.title, slug: e.slug },
      },
    });
    return e;
  });

  const full = await queryEventById(event.id);
  return ok(full!);
}

export async function updateEvent(
  eventId: string,
  input: unknown,
  currentUserId: string,
): Promise<Result<Awaited<ReturnType<typeof queryEventById>>>> {
  const existing = await prisma.event.findUnique({ where: { id: eventId } });
  if (!existing) return err("Event not found", "NOT_FOUND");
  if (existing.organizerId !== currentUserId) {
    return err("Only the organizer can update this event", "FORBIDDEN");
  }
  const parsed = parseUpdateEvent(input);
  if (!parsed.success) {
    const msg = parsed.error.flatten().fieldErrors
      ? JSON.stringify(parsed.error.flatten().fieldErrors)
      : parsed.error.message;
    return err(msg, "VALIDATION_ERROR");
  }
  const d = parsed.data;
  if (Object.keys(d).length === 0) {
    return err("No fields to update", "VALIDATION_ERROR");
  }

  const nextStarts = d.startsAt ?? existing.startsAt;
  const nextEnds = d.endsAt !== undefined ? d.endsAt : existing.endsAt;
  if (nextEnds && nextEnds < nextStarts) {
    return err("endsAt must be on or after startsAt", "VALIDATION_ERROR");
  }

  await prisma.event.update({
    where: { id: eventId },
    data: {
      ...(d.title !== undefined && { title: d.title }),
      ...(d.description !== undefined && {
        description: d.description?.trim() || null,
      }),
      ...(d.activityType !== undefined && { activityType: d.activityType }),
      ...(d.format !== undefined && { format: d.format }),
      ...(d.visibility !== undefined && { visibility: d.visibility }),
      ...(d.locationName !== undefined && { locationName: d.locationName ?? null }),
      ...(d.address !== undefined && { address: d.address ?? null }),
      ...(d.city !== undefined && { city: d.city ?? null }),
      ...(d.state !== undefined && { state: d.state ?? null }),
      ...(d.country !== undefined && { country: d.country ?? null }),
      ...(d.coverImageUrl !== undefined && { coverImageUrl: d.coverImageUrl ?? null }),
      ...(d.startsAt !== undefined && { startsAt: d.startsAt }),
      ...(d.endsAt !== undefined && { endsAt: d.endsAt ?? null }),
      ...(d.maxTeams !== undefined && { maxTeams: d.maxTeams ?? null }),
      ...(d.maxSoloPlayers !== undefined && {
        maxSoloPlayers: d.maxSoloPlayers ?? null,
      }),
      ...(d.maxWatchers !== undefined && { maxWatchers: d.maxWatchers ?? null }),
      ...(d.maxVolunteers !== undefined && {
        maxVolunteers: d.maxVolunteers ?? null,
      }),
      ...(d.entryFeeCents !== undefined && {
        entryFeeCents: d.entryFeeCents ?? null,
      }),
      ...(d.currency !== undefined && { currency: d.currency }),
      ...(d.allowTeams !== undefined && { allowTeams: d.allowTeams }),
      ...(d.allowSoloPlayers !== undefined && {
        allowSoloPlayers: d.allowSoloPlayers,
      }),
      ...(d.allowWatchers !== undefined && { allowWatchers: d.allowWatchers }),
      ...(d.allowVolunteers !== undefined && {
        allowVolunteers: d.allowVolunteers,
      }),
    },
  });

  await logActivity({
    eventId,
    userId: currentUserId,
    action: ActivityAction.EVENT_UPDATED,
    metadata: { fields: Object.keys(d) },
  });

  const full = await queryEventById(eventId);
  return ok(full!);
}

export async function publishEvent(
  eventId: string,
  currentUserId: string,
): Promise<Result<Awaited<ReturnType<typeof queryEventById>>>> {
  const existing = await prisma.event.findUnique({ where: { id: eventId } });
  if (!existing) return err("Event not found", "NOT_FOUND");
  if (existing.organizerId !== currentUserId) {
    return err("Only the organizer can publish this event", "FORBIDDEN");
  }
  if (existing.status !== EventStatus.DRAFT) {
    return err("Only draft events can be published", "BAD_STATE");
  }
  await prisma.event.update({
    where: { id: eventId },
    data: { status: EventStatus.PUBLISHED },
  });
  await logActivity({
    eventId,
    userId: currentUserId,
    action: ActivityAction.EVENT_PUBLISHED,
    metadata: {},
  });
  const full = await queryEventById(eventId);
  return ok(full!);
}

export async function cancelEvent(
  eventId: string,
  currentUserId: string,
): Promise<Result<Awaited<ReturnType<typeof queryEventById>>>> {
  const existing = await prisma.event.findUnique({ where: { id: eventId } });
  if (!existing) return err("Event not found", "NOT_FOUND");
  if (existing.organizerId !== currentUserId) {
    return err("Only the organizer can cancel this event", "FORBIDDEN");
  }
  if (existing.status === EventStatus.CANCELLED) {
    return err("Event is already cancelled", "BAD_STATE");
  }
  await prisma.event.update({
    where: { id: eventId },
    data: { status: EventStatus.CANCELLED },
  });
  await logActivity({
    eventId,
    userId: currentUserId,
    action: ActivityAction.EVENT_CANCELLED,
    metadata: {},
  });
  const full = await queryEventById(eventId);
  return ok(full!);
}

async function assertJoinCapacity(
  eventId: string,
  role: EventParticipantRole,
  event: { maxTeams: number | null; maxSoloPlayers: number | null; maxWatchers: number | null; maxVolunteers: number | null; allowTeams: boolean; allowSoloPlayers: boolean; allowWatchers: boolean; allowVolunteers: boolean },
): Promise<Result<null>> {
  if (role === EventParticipantRole.PLAYER && !event.allowSoloPlayers) {
    return err("Solo players are not allowed for this event", "FORBIDDEN");
  }
  if (role === EventParticipantRole.WATCHER && !event.allowWatchers) {
    return err("Watchers are not allowed for this event", "FORBIDDEN");
  }
  if (role === EventParticipantRole.VOLUNTEER && !event.allowVolunteers) {
    return err("Volunteers are not allowed for this event", "FORBIDDEN");
  }

  const statusOpen = [RegistrationStatus.APPROVED, RegistrationStatus.PENDING];

  if (role === EventParticipantRole.PLAYER && event.maxSoloPlayers != null) {
    const n = await prisma.eventParticipant.count({
      where: {
        eventId,
        role: EventParticipantRole.PLAYER,
        status: { in: statusOpen },
      },
    });
    if (n >= event.maxSoloPlayers) {
      return err("Maximum solo players reached for this event", "CAPACITY");
    }
  }
  if (role === EventParticipantRole.WATCHER && event.maxWatchers != null) {
    const n = await prisma.eventParticipant.count({
      where: {
        eventId,
        role: EventParticipantRole.WATCHER,
        status: { in: statusOpen },
      },
    });
    if (n >= event.maxWatchers) {
      return err("Maximum watchers reached for this event", "CAPACITY");
    }
  }
  if (role === EventParticipantRole.VOLUNTEER && event.maxVolunteers != null) {
    const n = await prisma.eventParticipant.count({
      where: {
        eventId,
        role: EventParticipantRole.VOLUNTEER,
        status: { in: statusOpen },
      },
    });
    if (n >= event.maxVolunteers) {
      return err("Maximum volunteers reached for this event", "CAPACITY");
    }
  }
  return ok(null);
}

export async function joinEvent(
  eventId: string,
  currentUserId: string,
  role: EventParticipantRole,
  note?: string | null,
): Promise<Result<Awaited<ReturnType<typeof queryEventById>>>> {
  if (role === EventParticipantRole.ORGANIZER) {
    return err("Cannot join as organizer via this action", "VALIDATION_ERROR");
  }
  const parsed = parseJoinEvent({
    role: role as "PLAYER" | "WATCHER" | "VOLUNTEER",
    note: note ?? undefined,
  });
  if (!parsed.success) {
    const msg = parsed.error.flatten().fieldErrors
      ? JSON.stringify(parsed.error.flatten().fieldErrors)
      : parsed.error.message;
    return err(msg, "VALIDATION_ERROR");
  }
  const joinRole = parsed.data.role as EventParticipantRole;

  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) return err("Event not found", "NOT_FOUND");
  if (event.status === EventStatus.CANCELLED) {
    return err("Event is cancelled", "BAD_STATE");
  }
  if (event.status === EventStatus.DRAFT) {
    return err("Event is not open for registration", "BAD_STATE");
  }

  const cap = await assertJoinCapacity(eventId, joinRole, event);
  if (!cap.success) return cap;

  await prisma.eventParticipant.upsert({
    where: {
      eventId_userId_role: {
        eventId,
        userId: currentUserId,
        role: joinRole,
      },
    },
    create: {
      eventId,
      userId: currentUserId,
      role: joinRole,
      status: RegistrationStatus.APPROVED,
      note: parsed.data.note?.trim() || null,
    },
    update: {
      status: RegistrationStatus.APPROVED,
      note: parsed.data.note?.trim() || null,
    },
  });

  await logActivity({
    eventId,
    userId: currentUserId,
    action: ActivityAction.EVENT_JOINED,
    metadata: { role: joinRole },
  });

  const full = await queryEventById(eventId);
  return ok(full!);
}

export async function joinEventAsSoloPlayer(
  eventId: string,
  currentUserId: string,
) {
  return joinEvent(eventId, currentUserId, EventParticipantRole.PLAYER);
}

export async function joinEventAsWatcher(
  eventId: string,
  currentUserId: string,
) {
  return joinEvent(eventId, currentUserId, EventParticipantRole.WATCHER);
}

export async function joinEventAsVolunteer(
  eventId: string,
  currentUserId: string,
) {
  return joinEvent(eventId, currentUserId, EventParticipantRole.VOLUNTEER);
}

export async function getEventById(eventId: string) {
  const e = await queryEventById(eventId);
  if (!e) return err("Event not found", "NOT_FOUND");
  return ok(e);
}

export async function getEventBySlug(slug: string) {
  const e = await queryEventBySlug(slug);
  if (!e) return err("Event not found", "NOT_FOUND");
  return ok(e);
}

export async function getUpcomingEvents() {
  const list = await queryUpcomingEvents();
  return ok(list);
}

export async function getMyCreatedEvents(currentUserId: string) {
  const list = await queryEventsCreatedByUser(currentUserId);
  return ok(list);
}

export async function getMyJoinedEvents(currentUserId: string) {
  const list = await queryEventsJoinedByUser(currentUserId);
  const seen = new Set<string>();
  const deduped = list.filter((e) => {
    if (seen.has(e.id)) return false;
    seen.add(e.id);
    return true;
  });
  return ok(deduped);
}
