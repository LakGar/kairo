/**
 * In-app notifications feed (MVP) — derived from matches, proof, and activity log.
 *
 * Read badge: `NotificationReadState.lastReadAt` cursor (not per-notification rows).
 *
 * TODO: full `Notification` table; per-notification read state; push delivery.
 */
import {
  MatchResultStatus,
  ProofStatus,
  ResultVerificationMode,
} from "@prisma/client";

import { prisma } from "@/lib/db";
import { ActivityAction } from "@/server/activity/activity-actions";
import { formatActivityText } from "@/server/me/me-home.service";
import { ok, type Result } from "@/src/lib/result";

export type NotificationFocus = "proof" | "organizer" | "result" | null;

export type NotificationItem = {
  id: string;
  type: string;
  title: string;
  body: string;
  createdAt: string;
  readAt: string | null;
  eventId?: string | null;
  matchId?: string | null;
  proofSubmissionId?: string | null;
  actionLabel?: string | null;
  focus?: NotificationFocus;
};

export type MeNotificationsPayload = {
  unreadCount: number;
  notifications: NotificationItem[];
};

export type MarkNotificationsReadPayload = {
  lastReadAt: string;
};

function iso(d: Date) {
  return d.toISOString();
}

/** Badge/read line: rows at or before cursor are "read"; actionable CTAs stay client-side regardless. */
function readAtForRow(rowCreatedAt: Date, lastReadAt: Date | null, type: string): string | null {
  const t = rowCreatedAt.getTime();
  if (!lastReadAt) {
    const actionable = type === "TEAM_RESULT_REVIEW" || type === "REVIEW_PROOF";
    if (actionable) return null;
    return iso(rowCreatedAt);
  }
  if (t <= lastReadAt.getTime()) return iso(rowCreatedAt);
  return null;
}

function userOnTeam(
  team: {
    captainId: string;
    members: { userId: string }[];
  },
  userId: string,
): boolean {
  if (team.captainId === userId) return true;
  return team.members.some((m) => m.userId === userId);
}

function activityTitle(action: string): string {
  switch (action) {
    case ActivityAction.EVENT_CREATED:
      return "Event created";
    case ActivityAction.EVENT_UPDATED:
      return "Event updated";
    case ActivityAction.EVENT_PUBLISHED:
      return "Event published";
    case ActivityAction.EVENT_CANCELLED:
      return "Event cancelled";
    case ActivityAction.EVENT_JOINED:
      return "Joined an event";
    case ActivityAction.PROOF_SUBMITTED:
      return "Proof submitted";
    case ActivityAction.PROOF_APPROVED:
      return "Proof approved";
    case ActivityAction.PROOF_REJECTED:
      return "Proof rejected";
    case ActivityAction.MATCH_TEAM_RESULT_SUBMITTED:
      return "Match result submitted";
    case ActivityAction.MATCH_TEAM_RESULT_CONFIRMED:
      return "Match result confirmed";
    case ActivityAction.MATCH_TEAM_RESULT_DISPUTED:
      return "Match result disputed";
    case ActivityAction.MATCH_RESULT_CONFIRMED:
      return "Match result confirmed";
    case ActivityAction.MATCH_WINNER_MARKED:
      return "Match winner set";
    case ActivityAction.MATCH_SCORE_UPDATED:
      return "Score updated";
    case ActivityAction.TEAM_CREATED:
      return "Team created";
    case ActivityAction.TEAM_JOINED:
      return "Joined a team";
    default:
      return "Update";
  }
}

export async function getMeNotificationsPayload(
  userId: string,
): Promise<Result<MeNotificationsPayload>> {
  const [allWaitingConfirmMatches, pendingHostReviews, recentProofDecisions, logs, readState] =
    await Promise.all([
      prisma.match.findMany({
        where: {
          resultVerificationMode: ResultVerificationMode.TEAM_AGREEMENT,
          resultStatus: MatchResultStatus.WAITING_CONFIRMATION,
          submittedByTeamId: { not: null },
          homeTeamId: { not: null },
          awayTeamId: { not: null },
        },
        include: {
          event: { select: { id: true, title: true } },
          homeTeam: {
            select: {
              id: true,
              name: true,
              captainId: true,
              members: { select: { userId: true } },
            },
          },
          awayTeam: {
            select: {
              id: true,
              name: true,
              captainId: true,
              members: { select: { userId: true } },
            },
          },
        },
        orderBy: { updatedAt: "desc" },
      }),
      prisma.proofSubmission.findMany({
        where: {
          status: ProofStatus.PENDING,
          event: { organizerId: userId },
        },
        include: {
          event: { select: { id: true, title: true } },
          user: { select: { profile: { select: { name: true, username: true } } } },
        },
        take: 24,
        orderBy: { updatedAt: "desc" },
      }),
      prisma.proofSubmission.findMany({
        where: {
          userId,
          status: { in: [ProofStatus.APPROVED, ProofStatus.REJECTED] },
        },
        include: { event: { select: { id: true, title: true } } },
        orderBy: { updatedAt: "desc" },
        take: 15,
      }),
      prisma.activityLog.findMany({
        where: {
          OR: [
            { userId },
            { event: { organizerId: userId } },
            { event: { participants: { some: { userId } } } },
          ],
        },
        orderBy: { createdAt: "desc" },
        take: 10,
        include: { event: { select: { id: true, title: true } } },
      }),
      prisma.notificationReadState.findUnique({ where: { userId } }),
    ]);

  const lastReadAt = readState?.lastReadAt ?? null;

  const notifications: NotificationItem[] = [];
  const seenTeamResultMatches = new Set<string>();

  for (const m of allWaitingConfirmMatches) {
    if (notifications.length >= 80) break;
    if (!m.submittedByTeamId || !m.homeTeam || !m.awayTeam) continue;
    const submitter =
      m.submittedByTeamId === m.homeTeamId ? m.homeTeam : m.awayTeam;
    const opponent = m.submittedByTeamId === m.homeTeamId ? m.awayTeam : m.homeTeam;
    if (userOnTeam(submitter, userId)) continue;
    if (!userOnTeam(opponent, userId)) continue;
    if (seenTeamResultMatches.has(m.id)) continue;
    seenTeamResultMatches.add(m.id);

    const homeLabel = m.homeTeam.name;
    const awayLabel = m.awayTeam.name;
    notifications.push({
      id: `team-result-${m.id}`,
      type: "TEAM_RESULT_REVIEW",
      title: "Confirm match result",
      body: `Your opponent submitted a result. Review it before it becomes official. · ${m.event.title} · ${homeLabel} vs ${awayLabel}`,
      createdAt: iso(m.updatedAt),
      readAt: readAtForRow(m.updatedAt, lastReadAt, "TEAM_RESULT_REVIEW"),
      eventId: m.eventId,
      matchId: m.id,
      proofSubmissionId: null,
      actionLabel: "Confirm Result",
      focus: "result",
    });
  }

  for (const s of pendingHostReviews) {
    const submitter =
      s.user.profile?.name?.trim() ||
      s.user.profile?.username?.trim() ||
      "Participant";
    notifications.push({
      id: `proof-review-${s.id}`,
      type: "REVIEW_PROOF",
      title: "Proof needs review",
      body: `${submitter} · ${s.event.title}`,
      createdAt: iso(s.updatedAt),
      readAt: readAtForRow(s.updatedAt, lastReadAt, "REVIEW_PROOF"),
      eventId: s.eventId,
      matchId: s.matchId,
      proofSubmissionId: s.id,
      actionLabel: "Review",
      focus: "organizer",
    });
  }

  for (const s of recentProofDecisions) {
    const approved = s.status === ProofStatus.APPROVED;
    const ownType = approved ? "PROOF_APPROVED" : "PROOF_REJECTED";
    notifications.push({
      id: `proof-own-${s.id}`,
      type: ownType,
      title: approved ? "Proof approved" : "Proof rejected",
      body: s.event.title,
      createdAt: iso(s.updatedAt),
      readAt: readAtForRow(s.updatedAt, lastReadAt, ownType),
      eventId: s.eventId,
      matchId: s.matchId,
      proofSubmissionId: s.id,
      actionLabel: "View Event",
      focus: "proof",
    });
  }

  for (const l of logs) {
    const created = iso(l.createdAt);
    notifications.push({
      id: `activity-${l.id}`,
      type: l.action,
      title: activityTitle(l.action),
      body: formatActivityText(l.action, l.metadata),
      createdAt: created,
      readAt: readAtForRow(l.createdAt, lastReadAt, l.action),
      eventId: l.eventId,
      matchId: null,
      proofSubmissionId: null,
      actionLabel: l.eventId ? "View Event" : null,
      focus: null,
    });
  }

  notifications.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  const unreadCount = notifications.filter((n) => n.readAt === null).length;

  return ok({ unreadCount, notifications });
}

export async function markMeNotificationsRead(
  userId: string,
  before?: Date,
): Promise<Result<MarkNotificationsReadPayload>> {
  const at = before ?? new Date();
  await prisma.notificationReadState.upsert({
    where: { userId },
    create: { userId, lastReadAt: at },
    update: { lastReadAt: at },
  });
  return ok({ lastReadAt: iso(at) });
}
