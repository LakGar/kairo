import {
  EventStatus,
  MatchResultStatus,
  MatchStatus,
  ProofStatus,
  ResultVerificationMode,
} from "@prisma/client";

const MS_DAY = 24 * 60 * 60 * 1000;
const MS_30D = 30 * MS_DAY;
const MS_7D = 7 * MS_DAY;
const MS_24H = 24 * MS_DAY;

export type ScoringTeam = {
  id: string;
  captainId: string;
  members: { userId: string }[];
};

export type ScoringMatchRow = {
  id: string;
  status: MatchStatus;
  resultStatus: MatchResultStatus;
  resultVerificationMode: ResultVerificationMode;
  submittedByTeamId: string | null;
  homeTeamId: string | null;
  awayTeamId: string | null;
  homeTeam: ScoringTeam | null;
  awayTeam: ScoringTeam | null;
  updatedAt: Date;
};

export type ScoringEventRow = {
  id: string;
  organizerId: string;
  status: EventStatus;
  startsAt: Date;
  proofPrompts: { id: string; isRequired: boolean }[];
  matches: ScoringMatchRow[];
};

export type UserProofLite = {
  eventId: string;
  matchId: string | null;
  status: ProofStatus;
};

export type CommitmentScoringUnit = {
  kind: "event" | "match";
  eventId: string;
  matchId: string | null;
  eventStartsAt: Date;
  /** Event COMPLETED or CANCELLED (MVP “ended” for proof-missing penalty). */
  eventEnded: boolean;
  /** startsAt in the future — no score penalties/bonuses. */
  isUpcoming: boolean;
  /** Included in 30d / near-upcoming commitment counts. */
  inRecentWindow: boolean;
  resultComplete: boolean;
  proofRequired: boolean;
  proofApproved: boolean;
  hasRejectedProof: boolean;
};

export function userOnTeam(team: ScoringTeam | null, userId: string): boolean {
  if (!team) return false;
  if (team.captainId === userId) return true;
  return team.members.some((m) => m.userId === userId);
}

export function userOnMatch(m: ScoringMatchRow, userId: string): boolean {
  return userOnTeam(m.homeTeam, userId) || userOnTeam(m.awayTeam, userId);
}

function eventHasRequiredProof(prompts: { isRequired: boolean }[]): boolean {
  return prompts.some((p) => p.isRequired);
}

function proofApprovedForEvent(subs: UserProofLite[], eventId: string): boolean {
  return subs.some((s) => s.eventId === eventId && s.status === ProofStatus.APPROVED);
}

function proofApprovedForMatch(
  subs: UserProofLite[],
  eventId: string,
  matchId: string,
): boolean {
  return subs.some(
    (s) =>
      s.eventId === eventId &&
      s.status === ProofStatus.APPROVED &&
      (s.matchId === null || s.matchId === matchId),
  );
}

function hasRejectedForEvent(subs: UserProofLite[], eventId: string): boolean {
  return subs.some((s) => s.eventId === eventId && s.status === ProofStatus.REJECTED);
}

function hasRejectedForMatch(
  subs: UserProofLite[],
  eventId: string,
  matchId: string,
): boolean {
  return subs.some(
    (s) =>
      s.eventId === eventId &&
      s.status === ProofStatus.REJECTED &&
      (s.matchId === null || s.matchId === matchId),
  );
}

function activeMatches(matches: ScoringMatchRow[]): ScoringMatchRow[] {
  return matches.filter((m) => m.status !== MatchStatus.CANCELLED);
}

function allActiveResultsConfirmed(matches: ScoringMatchRow[]): boolean {
  const active = activeMatches(matches);
  if (active.length === 0) return true;
  return active.every((m) => m.resultStatus === MatchResultStatus.CONFIRMED);
}

/**
 * MVP: meetups with no active matches count “result complete” once the event has started
 * (attendance assumed). TODO: tie to check-in or RSVP when available.
 */
function eventLevelResultComplete(e: ScoringEventRow, now: Date): boolean {
  const active = activeMatches(e.matches);
  if (active.length === 0) {
    return e.startsAt <= now;
  }
  return allActiveResultsConfirmed(e.matches);
}

function buildEventUnit(
  e: ScoringEventRow,
  subs: UserProofLite[],
  now: Date,
  thirtyDaysAgo: Date,
  upcomingHorizon: Date,
): CommitmentScoringUnit {
  const proofRequired = eventHasRequiredProof(e.proofPrompts);
  const resultComplete = eventLevelResultComplete(e, now);
  const proofApproved = proofApprovedForEvent(subs, e.id);
  const hasRejectedProof = hasRejectedForEvent(subs, e.id);
  const eventEnded =
    e.status === EventStatus.COMPLETED || e.status === EventStatus.CANCELLED;
  const isUpcoming = e.startsAt > now;
  const inRecentWindow =
    e.startsAt >= thirtyDaysAgo || (e.startsAt > now && e.startsAt <= upcomingHorizon);

  return {
    kind: "event",
    eventId: e.id,
    matchId: null,
    eventStartsAt: e.startsAt,
    eventEnded,
    isUpcoming,
    inRecentWindow,
    resultComplete,
    proofRequired,
    proofApproved,
    hasRejectedProof,
  };
}

function buildMatchUnit(
  e: ScoringEventRow,
  m: ScoringMatchRow,
  subs: UserProofLite[],
  now: Date,
  thirtyDaysAgo: Date,
  upcomingHorizon: Date,
): CommitmentScoringUnit {
  const proofRequired = eventHasRequiredProof(e.proofPrompts);
  const resultComplete = m.resultStatus === MatchResultStatus.CONFIRMED;
  const proofApproved = proofApprovedForMatch(subs, e.id, m.id);
  const hasRejectedProof = hasRejectedForMatch(subs, e.id, m.id);
  const eventEnded =
    e.status === EventStatus.COMPLETED || e.status === EventStatus.CANCELLED;
  const isUpcoming = e.startsAt > now;
  const inRecentWindow =
    e.startsAt >= thirtyDaysAgo || (e.startsAt > now && e.startsAt <= upcomingHorizon);

  return {
    kind: "match",
    eventId: e.id,
    matchId: m.id,
    eventStartsAt: e.startsAt,
    eventEnded,
    isUpcoming,
    inRecentWindow,
    resultComplete,
    proofRequired,
    proofApproved,
    hasRejectedProof,
  };
}

/**
 * Builds MVP commitment units for scoring (excludes WATCHER/VOLUNTEER-only roles).
 * Host → one event-level unit. Team player → one unit per match they are on. Others → event unit.
 */
export function buildCommitmentUnitsWithProofs(
  events: ScoringEventRow[],
  userId: string,
  proofByUser: UserProofLite[],
  now: Date,
): CommitmentScoringUnit[] {
  const thirtyDaysAgo = new Date(now.getTime() - MS_30D);
  const upcomingHorizon = new Date(now.getTime() + MS_30D);
  const subsForEvent = (eventId: string) => proofByUser.filter((p) => p.eventId === eventId);

  const units: CommitmentScoringUnit[] = [];

  for (const e of events) {
    const subs = subsForEvent(e.id);
    if (e.organizerId === userId) {
      units.push(buildEventUnit(e, subs, now, thirtyDaysAgo, upcomingHorizon));
      continue;
    }

    const userMatches = e.matches.filter((m) => userOnMatch(m, userId));
    if (userMatches.length > 0) {
      for (const m of userMatches) {
        units.push(buildMatchUnit(e, m, subs, now, thirtyDaysAgo, upcomingHorizon));
      }
    } else {
      units.push(buildEventUnit(e, subs, now, thirtyDaysAgo, upcomingHorizon));
    }
  }

  return units;
}

export function isFullyComplete(u: CommitmentScoringUnit): boolean {
  if (!u.resultComplete) return false;
  if (u.proofRequired && !u.proofApproved) return false;
  return true;
}

export function computeCommitmentCompletion(u: CommitmentScoringUnit): {
  fullyComplete: boolean;
  resultComplete: boolean;
  proofGateOk: boolean;
} {
  const fullyComplete = isFullyComplete(u);
  const proofGateOk = !u.proofRequired || u.proofApproved;
  return {
    fullyComplete,
    resultComplete: u.resultComplete,
    proofGateOk,
  };
}

export type KairoScoreBreakdown = {
  score: number;
  scoreLabel: string;
  sevenDayTrend: number;
  streakDays: number;
  weeklyRank: number | null;
  completedRecent: number;
  totalRecent: number;
};

export function getScoreLabel(score: number): string {
  if (score >= 95) return "Locked In";
  if (score >= 85) return "Reliable";
  if (score >= 70) return "Slipping";
  if (score >= 50) return "At Risk";
  return "Ghost Mode";
}

function unitScoreDelta(u: CommitmentScoringUnit): { bonus: number; penalty: number } {
  if (!u.inRecentWindow) return { bonus: 0, penalty: 0 };
  if (u.isUpcoming) return { bonus: 0, penalty: 0 };

  if (isFullyComplete(u)) return { bonus: 2, penalty: 0 };

  let penalty = 0;
  if (u.resultComplete && u.proofRequired && !u.proofApproved) penalty += 3;
  if (u.hasRejectedProof) penalty += 8;
  if (u.eventEnded && u.proofRequired && !u.proofApproved && !u.resultComplete) penalty += 6;

  return { bonus: 0, penalty };
}

function scoreFromUnits(units: CommitmentScoringUnit[], staleReviewCount: number): number {
  let raw = 100;
  for (const u of units) {
    const { bonus, penalty } = unitScoreDelta(u);
    raw += bonus - penalty;
  }
  raw -= 2 * staleReviewCount;
  return Math.max(0, Math.min(100, raw));
}

/**
 * MVP: compare full window score vs score from units whose event started before `now - 7d`
 * (excludes commitments tied to events that started in the last 7 days). Documented simplification.
 */
export function computeSevenDayTrend(
  allUnits: CommitmentScoringUnit[],
  staleReviewCount: number,
  now: Date,
): number {
  const cutoff = new Date(now.getTime() - MS_7D);
  const olderUnits = allUnits.filter((u) => u.eventStartsAt < cutoff);
  /** MVP: no baseline when everything is newer than 7 days — avoid comparing to an empty set. */
  if (olderUnits.length === 0) return 0;
  const a = scoreFromUnits(allUnits, staleReviewCount);
  const b = scoreFromUnits(olderUnits, staleReviewCount);
  return Math.max(-20, Math.min(20, a - b));
}

export function computeKairoScore(
  units: CommitmentScoringUnit[],
  staleTeamResultReviewCount: number,
  now: Date,
  streakDays: number,
): KairoScoreBreakdown {
  const score = scoreFromUnits(units, staleTeamResultReviewCount);
  const sevenDayTrend = computeSevenDayTrend(units, staleTeamResultReviewCount, now);

  const windowed = units.filter((u) => u.inRecentWindow);
  const totalRecent = windowed.length;
  const completedRecent = windowed.filter(isFullyComplete).length;

  return {
    score,
    scoreLabel: getScoreLabel(score),
    sevenDayTrend,
    streakDays,
    weeklyRank: null,
    completedRecent,
    totalRecent,
  };
}

/** Consecutive UTC calendar days (ending today) with a positive “completion” activity log. */
export function computeStreakDaysFromActivity(
  activityDays: Set<string>,
  now: Date,
  maxDays = 30,
): number {
  let streak = 0;
  for (let i = 0; i < maxDays; i++) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - i));
    const key = d.toISOString().slice(0, 10);
    if (activityDays.has(key)) streak += 1;
    else break;
  }
  return streak;
}

export function utcDayKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export { MS_24H, MS_30D, MS_7D };
