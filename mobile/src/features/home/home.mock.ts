/**
 * Mock home dashboard data (UI phase).
 * TODO: Replace image URLs with CDN / event `coverImage` when media pipeline exists.
 * TODO: Replace all payloads with API + real `eventId` for navigation.
 */

export type CommitmentRole = "Hosting" | "Player" | "Invited" | "Watching" | "Volunteer";

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
  /** TODO: swap for local asset or signed URL from API */
  imageUrl: string;
  role: CommitmentRole;
  /** Small line above title, e.g. organizer or team */
  organizerLine?: string;
  timeLabel: string;
  locationLabel: string;
  status: CommitmentStatus;
  scoreImpact: string;
  /** TODO: wire real event id from API */
  eventIdPlaceholder: string;
}

export interface MockNextAction {
  headline: string;
  eventTitle: string;
  dateTimeLabel: string;
  actionDetail: string;
  imageUrl: string;
  /** TODO: wire real published event id when home is API-backed */
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

/** Shown on home header notification bell (mock until API). */
export const MOCK_NOTIFICATION_BADGE = 3;

export const MOCK_HOME_HEADER = {
  actionCountToday: 3,
} as const;

export const MOCK_KAIRO_SCORE = {
  score: 92,
  trend7d: -4,
  streakDays: 5,
} as const;

export const MOCK_NEXT_ACTION: MockNextAction = {
  headline: "Submit proof before tonight",
  eventTitle: "Pickleball Night",
  dateTimeLabel: "Today, 6:30 PM",
  actionDetail: "Team photo required",
  imageUrl:
    "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=800&q=80",
  eventIdPlaceholder: "mock-event-pickleball",
};

export const MOCK_COMMITMENTS: MockCommitment[] = [
  {
    id: "c1",
    title: "Kairo Pickleball Night",
    imageUrl:
      "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=600&q=80",
    role: "Player",
    organizerLine: "Hosted by Alex · Team Yellow",
    timeLabel: "Today, 6:30 PM",
    locationLabel: "San Francisco, CA",
    status: "Needs proof",
    scoreImpact: "Risk -5",
    eventIdPlaceholder: "mock-c1",
  },
  {
    id: "c2",
    title: "Founder Basketball Run",
    imageUrl:
      "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=600&q=80",
    role: "Hosting",
    organizerLine: "You’re organizing",
    timeLabel: "Thu, 7:00 AM",
    locationLabel: "Mission Bay, SF",
    status: "Upcoming",
    scoreImpact: "+3 if completed",
    eventIdPlaceholder: "mock-c2",
  },
  {
    id: "c3",
    title: "Sunday Run Club",
    imageUrl:
      "https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=600&q=80",
    role: "Invited",
    organizerLine: "Invited by Jordan",
    timeLabel: "Sun, 8:00 AM",
    locationLabel: "Golden Gate Park",
    status: "RSVP needed",
    scoreImpact: "No impact yet",
    eventIdPlaceholder: "mock-c3",
  },
  {
    id: "c4",
    title: "Startup Volleyball",
    imageUrl:
      "https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=600&q=80",
    role: "Watching",
    organizerLine: "Spectator pass",
    timeLabel: "Sat, 4:00 PM",
    locationLabel: "Oakland, CA",
    status: "Confirmed",
    scoreImpact: "+1 for showing up",
    eventIdPlaceholder: "mock-c4",
  },
];

export const MOCK_PROOF_INBOX = {
  pendingCount: 3,
  tasks: [
    { id: "p1", label: "Verify Maya’s run proof" },
    { id: "p2", label: "Submit score for Match 2" },
    { id: "p3", label: "Approve Team Alpha’s photo" },
  ] satisfies MockProofTask[],
};

export const MOCK_STREAK_RANK = {
  streakDays: 5,
  streakTrendLabel: "Best in 3 weeks",
  weeklyRank: 12,
  rankTrendLabel: "Up 4 spots",
} as const;

/** Reserved for Notifications screen — not shown on Home. */
export const MOCK_INVITES: MockInvite[] = [
  { id: "i1", title: "Join Team Red for Basketball Run" },
  { id: "i2", title: "Watch Pickleball Night" },
];

export const MOCK_ACTIVITY: MockActivity[] = [
  { id: "a1", text: "Maya verified your proof" },
  { id: "a2", text: "Team Blue won Pickleball Night" },
  { id: "a3", text: "You gained +3 Kairo Score" },
  { id: "a4", text: "Alex invited you to Founder Run Club" },
];
