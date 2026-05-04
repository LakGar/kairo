import {
  EventParticipantRole,
  EventStatus,
  MatchResultStatus,
  ProofStatus,
  RegistrationStatus,
  ResultVerificationMode,
} from "@prisma/client";

import { prisma } from "@/lib/db";
import { ActivityAction } from "@/server/activity/activity-actions";
import { ok, type Result } from "@/src/lib/result";

const eventPublicInclude = {
  organizer: { select: { id: true, email: true, profile: true } },
  _count: {
    select: { teams: true, participants: true, matches: true },
  },
} as const;

export type MeHomeEventSummary = {
  id: string;
  title: string;
  activityType: string;
  role: string;
  status: string;
  startsAt: string;
  locationName: string | null;
  city: string | null;
  state: string | null;
  imageUrl: string | null;
  proofStatus?: string | null;
  scoreImpactLabel?: string | null;
  participantCount: number;
};

export type MeHomeAction = {
  id: string;
  type: string;
  title: string;
  subtitle: string;
  eventId?: string;
  ctaLabel: string;
  proofSubmissionId?: string;
  matchId?: string;
};

export type MeHomeProofInboxItem = {
  id: string;
  title: string;
  subtitle: string;
  eventId?: string;
  matchId?: string;
  proofSubmissionId?: string;
};

export type MeHomeActivityItem = {
  id: string;
  text: string;
  createdAt: string;
};

export type MeHomeStats = {
  kairoScore: number;
  scoreLabel: string;
  sevenDayTrend: number;
  streakDays: number;
  weeklyRank: number | null;
  completedRecent: number;
  totalRecent: number;
};

export type MeHomePayload = {
  hosting: MeHomeEventSummary[];
  attending: MeHomeEventSummary[];
  invited: MeHomeEventSummary[];
  watching: MeHomeEventSummary[];
  volunteering: MeHomeEventSummary[];
  actions: MeHomeAction[];
  proofInbox: MeHomeProofInboxItem[];
  stats: MeHomeStats;
  recentActivity: MeHomeActivityItem[];
};

type EventRow = {
  id: string;
  title: string;
  activityType: string;
  status: EventStatus;
  locationName: string | null;
  city: string | null;
  state: string | null;
  startsAt: Date;
  organizerId: string;
  organizer: { profile: { name: string | null } | null };
  _count: { participants: number };
};

function iso(d: Date) {
  return d.toISOString();
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

function toSummary(e: EventRow, role: string): MeHomeEventSummary {
  return {
    id: e.id,
    title: e.title,
    activityType: e.activityType,
    role,
    status: e.status,
    startsAt: iso(e.startsAt),
    locationName: e.locationName,
    city: e.city,
    state: e.state,
    imageUrl: null,
    participantCount: e._count.participants,
    scoreImpactLabel: "On track",
  };
}

async function loadEventsForParticipant(
  userId: string,
  role: EventParticipantRole,
): Promise<EventRow[]> {
  const parts = await prisma.eventParticipant.findMany({
    where: {
      userId,
      role,
      status: { in: [RegistrationStatus.APPROVED, RegistrationStatus.PENDING] },
    },
    orderBy: { updatedAt: "desc" },
    include: {
      event: { include: eventPublicInclude },
    },
  });
  return parts.map((p) => p.event as unknown as EventRow);
}

function formatActivityText(action: string, metadata: unknown): string {
  const meta =
    typeof metadata === "object" && metadata !== null
      ? (metadata as Record<string, unknown>)
      : {};
  const title = typeof meta.title === "string" ? meta.title : undefined;
  switch (action) {
    case ActivityAction.EVENT_CREATED:
      return title ? `You created ${title}` : "You created an event";
    case ActivityAction.EVENT_PUBLISHED:
      return title ? `Published ${title}` : "You published an event";
    case ActivityAction.EVENT_JOINED:
      return title ? `Joined ${title}` : "You joined an event";
    case ActivityAction.PROOF_SUBMITTED:
      return title ? `Proof submitted for ${title}` : "Proof submitted";
    case ActivityAction.PROOF_APPROVED:
      return "Proof approved";
    case ActivityAction.PROOF_REJECTED:
      return "Proof rejected";
    case ActivityAction.TEAM_CREATED:
      return "Team created";
    case ActivityAction.TEAM_JOINED:
      return "Joined a team";
    default:
      return action.replaceAll("_", " ").toLowerCase();
  }
}

/**
 * MVP placeholder score until commitment scoring model exists.
 * Starts at 100, nudges down when proof work is pending (not a real rating formula).
 */
function buildPlaceholderStats(input: {
  pendingOwnProofs: number;
  pendingHostReviews: number;
  hostingCount: number;
}): MeHomeStats {
  const raw =
    100 -
    5 * Math.min(input.pendingOwnProofs, 4) -
    3 * Math.min(input.pendingHostReviews, 4) -
    Math.max(0, input.hostingCount - 3);
  const kairoScore = Math.max(55, Math.min(100, raw));
  const scoreLabel =
    kairoScore >= 92 ? "Locked In" : kairoScore >= 80 ? "Reliable" : "Building";
  const sevenDayTrend =
    input.pendingOwnProofs + input.pendingHostReviews === 0 ? 2 : -1;
  return {
    kairoScore,
    scoreLabel,
    sevenDayTrend,
    streakDays: input.hostingCount > 0 || input.pendingOwnProofs > 0 ? 1 : 0,
    weeklyRank: null,
    completedRecent: 0,
    totalRecent: input.hostingCount + input.pendingOwnProofs,
  };
}

export async function getMeHomePayload(userId: string): Promise<Result<MeHomePayload>> {
  const hostingRows = await prisma.event.findMany({
    where: { organizerId: userId },
    orderBy: { startsAt: "desc" },
    include: eventPublicInclude,
  });

  const [playerEvents, watcherEvents, volunteerEvents] = await Promise.all([
    loadEventsForParticipant(userId, EventParticipantRole.PLAYER),
    loadEventsForParticipant(userId, EventParticipantRole.WATCHER),
    loadEventsForParticipant(userId, EventParticipantRole.VOLUNTEER),
  ]);

  const hosting = hostingRows.map((e) =>
    toSummary(e as unknown as EventRow, "Hosting"),
  );
  const attending = playerEvents.map((e) => toSummary(e, "Player"));
  const watching = watcherEvents.map((e) => toSummary(e, "Watching"));
  const volunteering = volunteerEvents.map((e) => toSummary(e, "Volunteer"));

  const now = new Date();
  const upcomingPlayerIds = new Set(
    playerEvents.filter((e) => e.startsAt >= now).map((e) => e.id),
  );

  const promptsByEvent =
    upcomingPlayerIds.size === 0
      ? []
      : await prisma.proofPrompt.findMany({
          where: { eventId: { in: [...upcomingPlayerIds] } },
          select: {
            id: true,
            eventId: true,
            event: { select: { title: true, startsAt: true } },
          },
        });

  const pendingOwn = await prisma.proofSubmission.findMany({
    where: { userId, status: ProofStatus.PENDING },
    include: { event: { select: { id: true, title: true, startsAt: true } } },
    take: 8,
  });

  const pendingHostReviews = await prisma.proofSubmission.findMany({
    where: {
      status: ProofStatus.PENDING,
      event: { organizerId: userId },
    },
    include: {
      event: { select: { id: true, title: true } },
      user: { select: { profile: { select: { name: true, username: true } } } },
    },
    take: 8,
  });

  const teamResultReviewActions: MeHomeAction[] = [];
  const seenTeamResultMatches = new Set<string>();

  const pendingOpponentConfirmMatches = await prisma.match.findMany({
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
    take: 24,
  });

  for (const m of pendingOpponentConfirmMatches) {
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
    teamResultReviewActions.push({
      id: `team-result-review-${m.id}`,
      type: "TEAM_RESULT_REVIEW",
      title: "Confirm match result",
      subtitle: `Your opponent submitted a result. Review it before it becomes official. · ${m.event.title} · ${homeLabel} vs ${awayLabel}`,
      eventId: m.eventId,
      matchId: m.id,
      ctaLabel: "Review Result",
    });
  }

  const actions: MeHomeAction[] = [...teamResultReviewActions];
  const seenSubmitEvents = new Set<string>();

  for (const p of promptsByEvent) {
    if (!upcomingPlayerIds.has(p.eventId) || seenSubmitEvents.has(p.eventId)) continue;
    seenSubmitEvents.add(p.eventId);
    actions.push({
      id: `submit-proof-${p.id}`,
      type: "SUBMIT_PROOF",
      title: "Submit proof",
      subtitle: p.event.title,
      eventId: p.eventId,
      ctaLabel: "View event",
    });
  }

  for (const s of pendingHostReviews) {
    const submitter =
      s.user.profile?.name?.trim() ||
      s.user.profile?.username?.trim() ||
      "Participant";
    actions.push({
      id: `review-proof-${s.id}`,
      type: "REVIEW_PROOF",
      title: "Review proof",
      subtitle: `${submitter} · ${s.event.title}`,
      eventId: s.eventId,
      ctaLabel: "Review",
      proofSubmissionId: s.id,
      matchId: s.matchId ?? undefined,
    });
  }

  const proofInbox: MeHomeProofInboxItem[] = [
    ...pendingHostReviews.map((s) => {
      const who =
        s.user.profile?.name?.trim() ||
        s.user.profile?.username?.trim() ||
        "Participant";
      return {
        id: `inbox-host-${s.id}`,
        title: s.event.title,
        subtitle: `Pending review · ${who}`,
        eventId: s.eventId,
        matchId: s.matchId ?? undefined,
        proofSubmissionId: s.id,
      };
    }),
    ...pendingOwn.map((s) => ({
      id: `inbox-own-${s.id}`,
      title: s.event.title,
      subtitle: "Your submission is pending",
      eventId: s.eventId,
      matchId: s.matchId ?? undefined,
      proofSubmissionId: s.id,
    })),
  ];

  const logs = await prisma.activityLog.findMany({
    where: {
      OR: [
        { userId },
        { event: { organizerId: userId } },
        { event: { participants: { some: { userId } } } },
      ],
    },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  const recentActivity: MeHomeActivityItem[] = logs.map((l) => ({
    id: l.id,
    text: formatActivityText(l.action, l.metadata),
    createdAt: iso(l.createdAt),
  }));

  const stats = buildPlaceholderStats({
    pendingOwnProofs: pendingOwn.length,
    pendingHostReviews: pendingHostReviews.length,
    hostingCount: hosting.length,
  });

  return ok({
    hosting,
    attending,
    invited: [],
    watching,
    volunteering,
    actions: actions.slice(0, 8),
    proofInbox,
    stats,
    recentActivity,
  });
}
