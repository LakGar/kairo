import { MatchStatus } from "@prisma/client";

import { prisma } from "@/lib/db";
import { err, ok, type Result } from "@/src/lib/result";
import { ActivityAction } from "@/server/activity/activity-actions";
import { logActivity } from "@/server/activity/activity.service";
import { queryMatchById, queryMatchesForEvent } from "@/server/matches/match.queries";
import {
  parseCreateManualMatch,
  parseMarkMatchWinner,
  parseUpdateMatchScore,
} from "@/server/matches/match.validators";

async function assertOrganizerForEvent(
  eventId: string,
  userId: string,
): Promise<Result<null>> {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { organizerId: true },
  });
  if (!event) return err("Event not found", "NOT_FOUND");
  if (event.organizerId !== userId) {
    return err("Only the organizer can modify matches", "FORBIDDEN");
  }
  return ok(null);
}

async function assertTeamsBelongToEvent(
  eventId: string,
  homeTeamId: string | null | undefined,
  awayTeamId: string | null | undefined,
): Promise<Result<null>> {
  if (homeTeamId) {
    const t = await prisma.team.findFirst({
      where: { id: homeTeamId, eventId },
    });
    if (!t) return err("Home team is not part of this event", "VALIDATION_ERROR");
  }
  if (awayTeamId) {
    const t = await prisma.team.findFirst({
      where: { id: awayTeamId, eventId },
    });
    if (!t) return err("Away team is not part of this event", "VALIDATION_ERROR");
  }
  return ok(null);
}

export async function createManualMatch(
  eventId: string,
  input: unknown,
  currentUserId: string,
): Promise<Result<Awaited<ReturnType<typeof queryMatchById>>>> {
  const org = await assertOrganizerForEvent(eventId, currentUserId);
  if (!org.success) return org;

  const parsed = parseCreateManualMatch(input);
  if (!parsed.success) {
    const msg = parsed.error.flatten().fieldErrors
      ? JSON.stringify(parsed.error.flatten().fieldErrors)
      : parsed.error.message;
    return err(msg, "VALIDATION_ERROR");
  }
  const d = parsed.data;

  const teams = await assertTeamsBelongToEvent(
    eventId,
    d.homeTeamId ?? undefined,
    d.awayTeamId ?? undefined,
  );
  if (!teams.success) return teams;

  const match = await prisma.match.create({
    data: {
      eventId,
      bracketId: d.bracketId ?? undefined,
      round: d.round ?? undefined,
      matchNumber: d.matchNumber ?? undefined,
      scheduledAt: d.scheduledAt ?? undefined,
      homeTeamId: d.homeTeamId ?? undefined,
      awayTeamId: d.awayTeamId ?? undefined,
      status: d.status ?? MatchStatus.SCHEDULED,
    },
  });

  await logActivity({
    eventId,
    userId: currentUserId,
    action: ActivityAction.MATCH_CREATED,
    metadata: { matchId: match.id },
  });

  const full = await queryMatchById(match.id);
  return ok(full!);
}

export async function updateMatchScore(
  matchId: string,
  input: unknown,
  currentUserId: string,
): Promise<Result<Awaited<ReturnType<typeof queryMatchById>>>> {
  const existing = await queryMatchById(matchId);
  if (!existing) return err("Match not found", "NOT_FOUND");
  const org = await assertOrganizerForEvent(existing.eventId, currentUserId);
  if (!org.success) return org;

  const parsed = parseUpdateMatchScore(input);
  if (!parsed.success) {
    const msg = parsed.error.flatten().fieldErrors
      ? JSON.stringify(parsed.error.flatten().fieldErrors)
      : parsed.error.message;
    return err(msg, "VALIDATION_ERROR");
  }
  const d = parsed.data;

  const updated = await prisma.match.update({
    where: { id: matchId },
    data: {
      ...(d.homeScore !== undefined && { homeScore: d.homeScore }),
      ...(d.awayScore !== undefined && { awayScore: d.awayScore }),
      ...(d.status !== undefined && { status: d.status }),
    },
  });

  await logActivity({
    eventId: existing.eventId,
    userId: currentUserId,
    action: ActivityAction.MATCH_SCORE_UPDATED,
    metadata: {
      matchId,
      homeScore: updated.homeScore,
      awayScore: updated.awayScore,
      status: updated.status,
    },
  });

  const full = await queryMatchById(matchId);
  return ok(full!);
}

export async function markMatchWinner(
  matchId: string,
  input: unknown,
  currentUserId: string,
): Promise<Result<Awaited<ReturnType<typeof queryMatchById>>>> {
  const existing = await queryMatchById(matchId);
  if (!existing) return err("Match not found", "NOT_FOUND");
  const org = await assertOrganizerForEvent(existing.eventId, currentUserId);
  if (!org.success) return org;

  const parsed = parseMarkMatchWinner(input);
  if (!parsed.success) {
    const msg = parsed.error.flatten().fieldErrors
      ? JSON.stringify(parsed.error.flatten().fieldErrors)
      : parsed.error.message;
    return err(msg, "VALIDATION_ERROR");
  }
  const { winnerTeamId } = parsed.data;

  if (
    winnerTeamId !== existing.homeTeamId &&
    winnerTeamId !== existing.awayTeamId
  ) {
    return err("Winner must be the home or away team", "VALIDATION_ERROR");
  }

  const updated = await prisma.match.update({
    where: { id: matchId },
    data: {
      winnerTeamId,
      status: MatchStatus.COMPLETED,
    },
  });

  await logActivity({
    eventId: existing.eventId,
    userId: currentUserId,
    action: ActivityAction.MATCH_WINNER_MARKED,
    metadata: { matchId, winnerTeamId: updated.winnerTeamId },
  });

  const full = await queryMatchById(matchId);
  return ok(full!);
}

export async function getMatchesForEvent(eventId: string) {
  const list = await queryMatchesForEvent(eventId);
  return ok(list);
}

export async function getMatchById(matchId: string) {
  const m = await queryMatchById(matchId);
  if (!m) return err("Match not found", "NOT_FOUND");
  return ok(m);
}
