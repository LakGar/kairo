import {
  EventFormat,
  MatchResultStatus,
  MatchStatus,
  ResultVerificationMode,
} from "@prisma/client";
import { getDefaultResultVerificationModeForEventFormat } from "@kairo/shared";

import { prisma } from "@/lib/db";
import { err, ok, type Result } from "@/src/lib/result";
import { ActivityAction } from "@/server/activity/activity-actions";
import { logActivity } from "@/server/activity/activity.service";
import { queryMatchById, queryMatchesForEvent } from "@/server/matches/match.queries";
import {
  getTeamMemberUserIds,
  sendPushToUsersBestEffort,
} from "@/server/notifications/push-triggers";
import {
  parseConfirmTeamAgreementResult,
  parseCreateManualMatch,
  parseDisputeTeamAgreementResult,
  parseMarkMatchWinner,
  parseSubmitTeamAgreementResult,
  parseUpdateMatchScore,
} from "@/server/matches/match.validators";

async function assertOrganizerForEvent(
  eventId: string,
  userId: string,
): Promise<Result<{ format: EventFormat }>> {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { organizerId: true, format: true },
  });
  if (!event) return err("Event not found", "NOT_FOUND");
  if (event.organizerId !== userId) {
    return err("Only the organizer can modify matches", "FORBIDDEN");
  }
  return ok({ format: event.format });
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

async function isUserMemberOfTeam(teamId: string, userId: string): Promise<boolean> {
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    select: { captainId: true },
  });
  if (!team) return false;
  if (team.captainId === userId) return true;
  const m = await prisma.teamMember.findFirst({
    where: { teamId, userId },
  });
  return Boolean(m);
}

/** Home or away team id if the user is on that side, else null. */
async function getUserTeamIdForMatchSides(
  homeTeamId: string | null,
  awayTeamId: string | null,
  userId: string,
): Promise<string | null> {
  if (homeTeamId && (await isUserMemberOfTeam(homeTeamId, userId))) return homeTeamId;
  if (awayTeamId && (await isUserMemberOfTeam(awayTeamId, userId))) return awayTeamId;
  return null;
}

function getOpponentTeamId(
  homeTeamId: string | null,
  awayTeamId: string | null,
  submittedByTeamId: string | null,
): string | null {
  if (!homeTeamId || !awayTeamId || !submittedByTeamId) return null;
  if (submittedByTeamId === homeTeamId) return awayTeamId;
  if (submittedByTeamId === awayTeamId) return homeTeamId;
  return null;
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

  let verificationMode: ResultVerificationMode =
    d.resultVerificationMode ??
    (getDefaultResultVerificationModeForEventFormat(org.data.format) as ResultVerificationMode);
  if (
    verificationMode === ResultVerificationMode.TEAM_AGREEMENT &&
    (!d.homeTeamId || !d.awayTeamId)
  ) {
    verificationMode = ResultVerificationMode.ORGANIZER_DECIDES;
  }

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
      resultVerificationMode: verificationMode,
      resultStatus: MatchResultStatus.PENDING,
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

  if (
    existing.resultVerificationMode === ResultVerificationMode.TEAM_AGREEMENT &&
    existing.resultStatus === MatchResultStatus.WAITING_CONFIRMATION
  ) {
    return err(
      "Result is waiting for the opponent to confirm or dispute. The organizer cannot override this step.",
      "BAD_STATE",
    );
  }

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
      resultStatus: MatchResultStatus.CONFIRMED,
      resolvedByUserId: currentUserId,
    },
  });

  await logActivity({
    eventId: existing.eventId,
    userId: currentUserId,
    action: ActivityAction.MATCH_WINNER_MARKED,
    metadata: { matchId, winnerTeamId: updated.winnerTeamId },
  });

  await logActivity({
    eventId: existing.eventId,
    userId: currentUserId,
    action: ActivityAction.MATCH_RESULT_CONFIRMED,
    metadata: {
      matchId,
      winnerTeamId: updated.winnerTeamId,
      resultVerificationMode: existing.resultVerificationMode,
    },
  });

  const full = await queryMatchById(matchId);
  return ok(full!);
}

/**
 * Team agreement: a side submits winner (+ optional scores).
 * Sets `MatchStatus.LIVE` and `resultStatus.WAITING_CONFIRMATION` — **not** `COMPLETED` until the opponent
 * confirms (then `COMPLETED`) or disputes (`DISPUTED`, stays `LIVE` until organizer `markMatchWinner`).
 */
export async function submitTeamAgreementResult(
  matchId: string,
  input: unknown,
  currentUserId: string,
): Promise<Result<Awaited<ReturnType<typeof queryMatchById>>>> {
  const existing = await queryMatchById(matchId);
  if (!existing) return err("Match not found", "NOT_FOUND");

  if (existing.resultVerificationMode !== ResultVerificationMode.TEAM_AGREEMENT) {
    return err("This match does not use team agreement for results.", "BAD_STATE");
  }
  if (!existing.homeTeamId || !existing.awayTeamId) {
    return err("Team agreement requires both home and away teams.", "VALIDATION_ERROR");
  }
  if (existing.resultStatus !== MatchResultStatus.PENDING) {
    return err("A result was already submitted or this match is not awaiting a new submission.", "BAD_STATE");
  }

  const parsed = parseSubmitTeamAgreementResult(input);
  if (!parsed.success) {
    const msg = parsed.error.flatten().fieldErrors
      ? JSON.stringify(parsed.error.flatten().fieldErrors)
      : parsed.error.message;
    return err(msg, "VALIDATION_ERROR");
  }
  const d = parsed.data;

  if (d.winnerTeamId !== existing.homeTeamId && d.winnerTeamId !== existing.awayTeamId) {
    return err("Winner must be the home or away team", "VALIDATION_ERROR");
  }

  const userTeamId = await getUserTeamIdForMatchSides(
    existing.homeTeamId,
    existing.awayTeamId,
    currentUserId,
  );
  if (!userTeamId) {
    return err("You must be on the home or away team to submit a result.", "FORBIDDEN");
  }

  const updated = await prisma.match.update({
    where: { id: matchId },
    data: {
      winnerTeamId: d.winnerTeamId,
      homeScore: d.homeScore ?? null,
      awayScore: d.awayScore ?? null,
      submittedByTeamId: userTeamId,
      confirmedByTeamId: null,
      resolvedByUserId: null,
      resultStatus: MatchResultStatus.WAITING_CONFIRMATION,
      status: MatchStatus.LIVE,
    },
  });

  await logActivity({
    eventId: existing.eventId,
    userId: currentUserId,
    action: ActivityAction.MATCH_TEAM_RESULT_SUBMITTED,
    metadata: {
      matchId,
      submittedByTeamId: userTeamId,
      winnerTeamId: updated.winnerTeamId,
    },
  });

  const opponentTeamId = getOpponentTeamId(
    existing.homeTeamId,
    existing.awayTeamId,
    userTeamId,
  );
  if (opponentTeamId) {
    try {
      const memberIds = await getTeamMemberUserIds(opponentTeamId);
      const targets = memberIds.filter((id) => id !== currentUserId);
      await sendPushToUsersBestEffort(targets, {
        title: "Confirm match result",
        body: "Your opponent submitted a result. Review it before it becomes official.",
        data: {
          type: "TEAM_RESULT_REVIEW",
          eventId: existing.eventId,
          matchId,
          focus: "result",
        },
      });
    } catch (e) {
      console.warn("[push] team agreement result notify", e instanceof Error ? e.message : e);
    }
  }

  const full = await queryMatchById(matchId);
  return ok(full!);
}

export async function confirmTeamAgreementResult(
  matchId: string,
  input: unknown,
  currentUserId: string,
): Promise<Result<Awaited<ReturnType<typeof queryMatchById>>>> {
  const existing = await queryMatchById(matchId);
  if (!existing) return err("Match not found", "NOT_FOUND");

  const parsed = parseConfirmTeamAgreementResult(input);
  if (!parsed.success) {
    const msg = parsed.error.flatten().fieldErrors
      ? JSON.stringify(parsed.error.flatten().fieldErrors)
      : parsed.error.message;
    return err(msg, "VALIDATION_ERROR");
  }

  if (existing.resultVerificationMode !== ResultVerificationMode.TEAM_AGREEMENT) {
    return err("This match does not use team agreement for results.", "BAD_STATE");
  }
  if (existing.resultStatus !== MatchResultStatus.WAITING_CONFIRMATION) {
    return err("There is no result waiting for confirmation.", "BAD_STATE");
  }
  if (!existing.submittedByTeamId || !existing.homeTeamId || !existing.awayTeamId) {
    return err("Match is missing submission or team data.", "BAD_STATE");
  }

  const userTeamId = await getUserTeamIdForMatchSides(
    existing.homeTeamId,
    existing.awayTeamId,
    currentUserId,
  );
  if (!userTeamId) {
    return err("You must be on the home or away team to confirm.", "FORBIDDEN");
  }
  if (userTeamId === existing.submittedByTeamId) {
    return err("The submitting team cannot confirm its own result.", "FORBIDDEN");
  }

  const opponentExpected = getOpponentTeamId(
    existing.homeTeamId,
    existing.awayTeamId,
    existing.submittedByTeamId,
  );
  if (userTeamId !== opponentExpected) {
    return err("Only the opposing team can confirm this result.", "FORBIDDEN");
  }

  const updated = await prisma.match.update({
    where: { id: matchId },
    data: {
      confirmedByTeamId: userTeamId,
      resultStatus: MatchResultStatus.CONFIRMED,
      status: MatchStatus.COMPLETED,
    },
  });

  await logActivity({
    eventId: existing.eventId,
    userId: currentUserId,
    action: ActivityAction.MATCH_TEAM_RESULT_CONFIRMED,
    metadata: { matchId, confirmedByTeamId: updated.confirmedByTeamId },
  });

  await logActivity({
    eventId: existing.eventId,
    userId: currentUserId,
    action: ActivityAction.MATCH_RESULT_CONFIRMED,
    metadata: {
      matchId,
      winnerTeamId: updated.winnerTeamId,
      resultVerificationMode: existing.resultVerificationMode,
    },
  });

  const full = await queryMatchById(matchId);
  return ok(full!);
}

export async function disputeTeamAgreementResult(
  matchId: string,
  input: unknown,
  currentUserId: string,
): Promise<Result<Awaited<ReturnType<typeof queryMatchById>>>> {
  const existing = await queryMatchById(matchId);
  if (!existing) return err("Match not found", "NOT_FOUND");

  const parsed = parseDisputeTeamAgreementResult(input);
  if (!parsed.success) {
    const msg = parsed.error.flatten().fieldErrors
      ? JSON.stringify(parsed.error.flatten().fieldErrors)
      : parsed.error.message;
    return err(msg, "VALIDATION_ERROR");
  }

  if (existing.resultVerificationMode !== ResultVerificationMode.TEAM_AGREEMENT) {
    return err("This match does not use team agreement for results.", "BAD_STATE");
  }
  if (existing.resultStatus !== MatchResultStatus.WAITING_CONFIRMATION) {
    return err("There is no result waiting for confirmation.", "BAD_STATE");
  }
  if (!existing.submittedByTeamId || !existing.homeTeamId || !existing.awayTeamId) {
    return err("Match is missing submission or team data.", "BAD_STATE");
  }

  const userTeamId = await getUserTeamIdForMatchSides(
    existing.homeTeamId,
    existing.awayTeamId,
    currentUserId,
  );
  if (!userTeamId) {
    return err("You must be on the home or away team to dispute.", "FORBIDDEN");
  }
  if (userTeamId === existing.submittedByTeamId) {
    return err("The submitting team cannot dispute its own result.", "FORBIDDEN");
  }

  const opponentExpected = getOpponentTeamId(
    existing.homeTeamId,
    existing.awayTeamId,
    existing.submittedByTeamId,
  );
  if (userTeamId !== opponentExpected) {
    return err("Only the opposing team can dispute this result.", "FORBIDDEN");
  }

  await prisma.match.update({
    where: { id: matchId },
    data: {
      resultStatus: MatchResultStatus.DISPUTED,
      status: MatchStatus.LIVE,
    },
  });

  await logActivity({
    eventId: existing.eventId,
    userId: currentUserId,
    action: ActivityAction.MATCH_TEAM_RESULT_DISPUTED,
    metadata: { matchId, disputedByTeamId: userTeamId },
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
