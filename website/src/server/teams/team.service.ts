import {
  EventParticipantRole,
  EventStatus,
  RegistrationStatus,
  TeamMemberRole,
} from "@prisma/client";

import { prisma } from "@/lib/db";
import { err, ok, type Result } from "@/src/lib/result";
import { ActivityAction } from "@/server/activity/activity-actions";
import { queryTeamById, queryTeamsForEvent } from "@/server/teams/team.queries";
import { parseCreateTeam, parseJoinTeam } from "@/server/teams/team.validators";

export async function createTeam(
  eventId: string,
  input: unknown,
  currentUserId: string,
): Promise<Result<Awaited<ReturnType<typeof queryTeamById>>>> {
  const parsed = parseCreateTeam(input);
  if (!parsed.success) {
    const msg = parsed.error.flatten().fieldErrors
      ? JSON.stringify(parsed.error.flatten().fieldErrors)
      : parsed.error.message;
    return err(msg, "VALIDATION_ERROR");
  }
  const d = parsed.data;

  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) return err("Event not found", "NOT_FOUND");
  if (!event.allowTeams) {
    return err("Teams are not allowed for this event", "FORBIDDEN");
  }
  if (event.status === EventStatus.CANCELLED) {
    return err("Event is cancelled", "BAD_STATE");
  }
  if (event.maxTeams != null) {
    const n = await prisma.team.count({ where: { eventId } });
    if (n >= event.maxTeams) {
      return err("Maximum teams reached for this event", "CAPACITY");
    }
  }

  try {
    const team = await prisma.$transaction(async (tx) => {
      const t = await tx.team.create({
        data: {
          eventId,
          captainId: currentUserId,
          name: d.name,
          description: d.description?.trim() || null,
          logoUrl: d.logoUrl?.trim() || null,
        },
      });
      await tx.teamMember.create({
        data: {
          teamId: t.id,
          userId: currentUserId,
          role: TeamMemberRole.CAPTAIN,
        },
      });
      await tx.eventParticipant.upsert({
        where: {
          eventId_userId_role: {
            eventId,
            userId: currentUserId,
            role: EventParticipantRole.PLAYER,
          },
        },
        create: {
          eventId,
          userId: currentUserId,
          role: EventParticipantRole.PLAYER,
          status: RegistrationStatus.APPROVED,
        },
        update: { status: RegistrationStatus.APPROVED },
      });
      await tx.activityLog.create({
        data: {
          eventId,
          userId: currentUserId,
          action: ActivityAction.TEAM_CREATED,
          metadata: { teamId: t.id, name: t.name },
        },
      });
      return t;
    });

    const full = await queryTeamById(team.id);
    return ok(full!);
  } catch (e: unknown) {
    if (
      typeof e === "object" &&
      e !== null &&
      "code" in e &&
      (e as { code: string }).code === "P2002"
    ) {
      return err("A team with this name already exists for this event", "CONFLICT");
    }
    throw e;
  }
}

export async function joinTeam(
  teamId: string,
  input: unknown,
  currentUserId: string,
): Promise<Result<Awaited<ReturnType<typeof queryTeamById>>>> {
  const parsed = parseJoinTeam(input);
  if (!parsed.success) {
    const msg = parsed.error.flatten().fieldErrors
      ? JSON.stringify(parsed.error.flatten().fieldErrors)
      : parsed.error.message;
    return err(msg, "VALIDATION_ERROR");
  }

  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: { event: true },
  });
  if (!team) return err("Team not found", "NOT_FOUND");
  if (team.event.status === EventStatus.CANCELLED) {
    return err("Event is cancelled", "BAD_STATE");
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.teamMember.create({
        data: {
          teamId,
          userId: currentUserId,
          role: TeamMemberRole.MEMBER,
        },
      });
      await tx.eventParticipant.upsert({
        where: {
          eventId_userId_role: {
            eventId: team.eventId,
            userId: currentUserId,
            role: EventParticipantRole.PLAYER,
          },
        },
        create: {
          eventId: team.eventId,
          userId: currentUserId,
          role: EventParticipantRole.PLAYER,
          status: RegistrationStatus.APPROVED,
        },
        update: { status: RegistrationStatus.APPROVED },
      });
      await tx.activityLog.create({
        data: {
          eventId: team.eventId,
          userId: currentUserId,
          action: ActivityAction.TEAM_JOINED,
          metadata: { teamId },
        },
      });
    });
  } catch (e: unknown) {
    if (
      typeof e === "object" &&
      e !== null &&
      "code" in e &&
      (e as { code: string }).code === "P2002"
    ) {
      return err("You are already on this team", "CONFLICT");
    }
    throw e;
  }

  const full = await queryTeamById(teamId);
  return ok(full!);
}

export async function leaveTeam(
  teamId: string,
  currentUserId: string,
): Promise<Result<{ left: true }>> {
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: { members: true },
  });
  if (!team) return err("Team not found", "NOT_FOUND");

  const membership = team.members.find((m) => m.userId === currentUserId);
  if (!membership) return err("You are not a member of this team", "NOT_FOUND");

  await prisma.$transaction(async (tx) => {
    await tx.teamMember.delete({
      where: { id: membership.id },
    });

    const others = await tx.teamMember.findMany({ where: { teamId } });
    if (others.length === 0) {
      await tx.team.delete({ where: { id: teamId } });
    } else if (team.captainId === currentUserId) {
      const nextCaptain = others[0]!;
      await tx.team.update({
        where: { id: teamId },
        data: { captainId: nextCaptain.userId },
      });
      if (nextCaptain.role !== TeamMemberRole.CAPTAIN) {
        await tx.teamMember.update({
          where: { id: nextCaptain.id },
          data: { role: TeamMemberRole.CAPTAIN },
        });
      }
    }

    await tx.activityLog.create({
      data: {
        eventId: team.eventId,
        userId: currentUserId,
        action: ActivityAction.TEAM_LEFT,
        metadata: { teamId },
      },
    });
  });

  return ok({ left: true });
}

export async function getTeamsForEvent(eventId: string) {
  const list = await queryTeamsForEvent(eventId);
  return ok(list);
}

export async function getTeamById(teamId: string) {
  const t = await queryTeamById(teamId);
  if (!t) return err("Team not found", "NOT_FOUND");
  return ok(t);
}
