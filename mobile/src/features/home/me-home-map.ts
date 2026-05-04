import type { ApiHomeAction, ApiHomeEventSummary, ApiMeEventsPayload } from "@/src/api";

import {
  COMMITMENT_COVER_PLACEHOLDER,
  type CommitmentRole,
  type CommitmentStatus,
  type MockCommitment,
  type MockNextAction,
  type MockProofTask,
  type MockActivity,
} from "@/src/features/home/home.mock";
import { formatEventStartsAt } from "@/src/features/events/format-event-range";

function toCommitmentRole(r: string): CommitmentRole {
  switch (r) {
    case "Hosting":
      return "Hosting";
    case "Player":
      return "Player";
    case "Watching":
      return "Watching";
    case "Volunteer":
      return "Volunteer";
    case "Invited":
      return "Invited";
    default:
      return "Player";
  }
}

function toCommitmentStatus(s: ApiHomeEventSummary): CommitmentStatus {
  if (s.status === "CANCELLED") return "Waiting approval";
  if (s.status === "DRAFT") return "Waiting approval";
  if (s.proofStatus === "PENDING") return "Needs proof";
  if (s.status === "COMPLETED") return "Verified";
  return "Upcoming";
}

function locationLine(s: ApiHomeEventSummary): string {
  return [s.locationName, s.city, s.state].filter(Boolean).join(" · ") || "Location TBD";
}

export function mapSummaryToMockCommitment(s: ApiHomeEventSummary): MockCommitment {
  return {
    id: `api-${s.id}-${s.role}`,
    title: s.title,
    imageUrl: s.imageUrl ?? COMMITMENT_COVER_PLACEHOLDER,
    role: toCommitmentRole(s.role),
    organizerLine: s.role === "Hosting" ? "You're organizing" : undefined,
    timeLabel: formatEventStartsAt(s.startsAt),
    locationLabel: locationLine(s),
    status: toCommitmentStatus(s),
    scoreImpact: s.scoreImpactLabel ?? "On track",
    eventIdPlaceholder: s.id,
  };
}

/** Prefer Hosting > Player > Volunteer > Watching when the same event appears in multiple lists. */
export function mergeMeHomeToCommitments(data: ApiMeEventsPayload): MockCommitment[] {
  const ordered: ApiHomeEventSummary[] = [
    ...data.hosting,
    ...data.attending,
    ...data.volunteering,
    ...data.watching,
  ];
  const priority = (r: string) => {
    if (r === "Hosting") return 0;
    if (r === "Player") return 1;
    if (r === "Volunteer") return 2;
    if (r === "Watching") return 3;
    return 9;
  };
  const best = new Map<string, ApiHomeEventSummary>();
  for (const e of ordered) {
    const cur = best.get(e.id);
    if (!cur || priority(e.role) < priority(cur.role)) best.set(e.id, e);
  }
  return [...best.values()].map(mapSummaryToMockCommitment);
}

export function homeActionToMockNextAction(
  a: ApiHomeAction,
  commitments: MockCommitment[],
): MockNextAction {
  const ev = a.eventId ? commitments.find((c) => c.eventIdPlaceholder === a.eventId) : undefined;
  return {
    headline: a.title,
    eventTitle: a.subtitle,
    dateTimeLabel: ev?.timeLabel ?? "Check your schedule",
    actionDetail: a.ctaLabel,
    imageUrl: ev?.imageUrl ?? COMMITMENT_COVER_PLACEHOLDER,
    eventIdPlaceholder: a.eventId ?? "",
    apiActionType: a.type,
    proofSubmissionId: a.proofSubmissionId,
    matchId: a.matchId,
  };
}

export function proofInboxToMockTasks(items: ApiMeEventsPayload["proofInbox"]): MockProofTask[] {
  return items.slice(0, 6).map((p) => ({
    id: p.id,
    label: `${p.title} — ${p.subtitle}`,
    eventId: p.eventId,
    matchId: p.matchId,
    proofSubmissionId: p.proofSubmissionId,
    focusTarget: p.subtitle.includes("Your submission") ? "proof" : "organizer",
  }));
}

export function activityToMock(items: ApiMeEventsPayload["recentActivity"]): MockActivity[] {
  return items.map((x) => ({ id: x.id, text: x.text }));
}
