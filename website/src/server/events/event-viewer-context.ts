import {
  EventParticipantRole,
  MatchResultStatus,
  ProofStatus,
  RegistrationStatus,
  TeamMemberRole,
} from "@prisma/client";

import { prisma } from "@/lib/db";

export type EventDetailPrimaryState =
  | "NOT_JOINED"
  | "ORGANIZER"
  | "PARTICIPANT"
  | "WATCHER"
  | "VOLUNTEER"
  | "INVITED"
  | "WAITLISTED";

export type EventViewerContextDto = {
  viewerUserId: string | null;
  isOrganizer: boolean;
  participantRoles: string[];
  participantStatuses: string[];
  teamMemberships: {
    teamId: string;
    teamName: string;
    role: "CAPTAIN" | "MEMBER";
  }[];
  primaryState: EventDetailPrimaryState;
  organizerStats?: {
    proofPendingCount: number;
    matchResultsPendingConfirmation: number;
    matchResultsDisputed: number;
  };
};

export async function getEventViewerContext(
  eventId: string,
  organizerId: string,
  viewerUserId: string | null,
): Promise<EventViewerContextDto> {
  if (!viewerUserId) {
    return {
      viewerUserId: null,
      isOrganizer: false,
      participantRoles: [],
      participantStatuses: [],
      teamMemberships: [],
      primaryState: "NOT_JOINED",
    };
  }

  const isOrganizer = viewerUserId === organizerId;

  const [participantRows, teamRows, organizerStats] = await Promise.all([
    prisma.eventParticipant.findMany({
      where: { eventId, userId: viewerUserId },
      select: { role: true, status: true },
    }),
    prisma.teamMember.findMany({
      where: { userId: viewerUserId, team: { eventId } },
      include: { team: { select: { id: true, name: true } } },
    }),
    isOrganizer
      ? Promise.all([
          prisma.proofSubmission.count({
            where: { eventId, status: ProofStatus.PENDING },
          }),
          prisma.match.count({
            where: {
              eventId,
              resultStatus: MatchResultStatus.WAITING_CONFIRMATION,
            },
          }),
          prisma.match.count({
            where: {
              eventId,
              resultStatus: MatchResultStatus.DISPUTED,
            },
          }),
        ]).then(([proofPendingCount, matchResultsPendingConfirmation, matchResultsDisputed]) => ({
          proofPendingCount,
          matchResultsPendingConfirmation,
          matchResultsDisputed,
        }))
      : Promise.resolve(undefined),
  ]);

  const participantRoles = participantRows.map((p) => p.role);
  const participantStatuses = participantRows.map((p) => p.status);

  const teamMemberships = teamRows.map((tm) => ({
    teamId: tm.team.id,
    teamName: tm.team.name,
    role: tm.role === TeamMemberRole.CAPTAIN ? ("CAPTAIN" as const) : ("MEMBER" as const),
  }));

  let primaryState: EventDetailPrimaryState;

  if (isOrganizer) {
    primaryState = "ORGANIZER";
  } else {
    const approvedPlayer = participantRows.some(
      (p) =>
        p.role === EventParticipantRole.PLAYER && p.status === RegistrationStatus.APPROVED,
    );
    const isTeamParticipant = teamRows.length > 0;
    const hasWaitlisted = participantRows.some(
      (p) => p.status === RegistrationStatus.WAITLISTED,
    );
    const approvedWatcher = participantRows.some(
      (p) =>
        p.role === EventParticipantRole.WATCHER && p.status === RegistrationStatus.APPROVED,
    );
    const approvedVolunteer = participantRows.some(
      (p) =>
        p.role === EventParticipantRole.VOLUNTEER &&
        p.status === RegistrationStatus.APPROVED,
    );

    if (approvedPlayer || isTeamParticipant) {
      primaryState = "PARTICIPANT";
    } else if (hasWaitlisted) {
      primaryState = "WAITLISTED";
    } else if (approvedWatcher) {
      primaryState = "WATCHER";
    } else if (approvedVolunteer) {
      primaryState = "VOLUNTEER";
    } else {
      primaryState = "NOT_JOINED";
    }
  }

  return {
    viewerUserId,
    isOrganizer,
    participantRoles,
    participantStatuses,
    teamMemberships,
    primaryState,
    ...(organizerStats ? { organizerStats } : {}),
  };
}
