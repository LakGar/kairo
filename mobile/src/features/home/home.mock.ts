/**
 * Home dashboard domain types and helpers.
 * Lists and metrics are loaded from APIs when available — no bundled fixture rows.
 */

/** Cover when `GET /api/me/events` returns no `imageUrl` (events have no image column yet). */
export const COMMITMENT_COVER_PLACEHOLDER =
  "https://images.unsplash.com/photo-1517649763962-0c623066013b?w=400&h=400&fit=crop";

export type CommitmentRole =
  | "Hosting"
  | "Player"
  | "Invited"
  | "Watching"
  | "Volunteer"
  | "Personal";

export type CommitmentStatus =
  | "Needs proof"
  | "Upcoming"
  | "Verified"
  | "Waiting approval"
  | "RSVP needed"
  | "Confirmed";

export interface MockCommitment {
  id: string;
  title: string;
  imageUrl: string;
  role: CommitmentRole;
  organizerLine?: string;
  timeLabel: string;
  locationLabel: string;
  status: CommitmentStatus;
  scoreImpact: string;
  eventIdPlaceholder: string;
}

export interface MockNextAction {
  headline: string;
  eventTitle: string;
  dateTimeLabel: string;
  actionDetail: string;
  imageUrl: string;
  eventIdPlaceholder: string;
}

export interface MockProofTask {
  id: string;
  label: string;
}

export interface MockInvite {
  id: string;
  title: string;
}

export interface MockActivity {
  id: string;
  text: string;
}

export function scoreTierLabel(score: number): string {
  if (score >= 95) return "Locked In";
  if (score >= 85) return "Reliable";
  if (score >= 70) return "Slipping";
  if (score >= 50) return "At Risk";
  return "Ghost Mode";
}
