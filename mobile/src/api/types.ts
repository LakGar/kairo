/** ISO-8601 strings for `Date` fields on the wire. */
export type JsonDateString = string;

export type ApiEnvelope<T> =
  | { success: true; data: T }
  | { success: false; error: { message: string; code: string } };

export class KairoApiError extends Error {
  readonly code: string;
  readonly httpStatus: number;

  constructor(message: string, code: string, httpStatus: number) {
    super(message);
    this.name = "KairoApiError";
    this.code = code;
    this.httpStatus = httpStatus;
  }
}

export class KairoApiConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "KairoApiConfigurationError";
  }
}

/** User + profile block returned on events, teams, and proof lists. */
export interface ApiUserSnippet {
  id: string;
  email: string;
  profile: {
    id: string;
    userId: string;
    name: string | null;
    username: string | null;
    avatarUrl: string | null;
    bio: string | null;
    createdAt: JsonDateString;
    updatedAt: JsonDateString;
  } | null;
}

/** Approved attendee row included on event detail (preview; see `_count.participants` for total). */
export interface ApiEventParticipantPreview {
  id: string;
  role: string;
  status: string;
  user: ApiUserSnippet;
}

/** From `GET /api/events/[eventId]` when `x-kairo-user-id` is sent (optional on public read). */
export type ApiEventDetailPrimaryState =
  | "NOT_JOINED"
  | "ORGANIZER"
  | "PARTICIPANT"
  | "WATCHER"
  | "VOLUNTEER"
  | "INVITED"
  | "WAITLISTED";

export interface ApiEventViewerContext {
  viewerUserId: string | null;
  isOrganizer: boolean;
  participantRoles: string[];
  participantStatuses: string[];
  teamMemberships: {
    teamId: string;
    teamName: string;
    role: "CAPTAIN" | "MEMBER";
  }[];
  primaryState: ApiEventDetailPrimaryState;
  organizerStats?: {
    proofPendingCount: number;
    matchResultsPendingConfirmation: number;
    matchResultsDisputed: number;
  };
}

/** Public event payload from `GET /api/events` and `GET /api/events/[eventId]`. */
export interface ApiEventPublic {
  id: string;
  organizerId: string;
  title: string;
  slug: string;
  description: string | null;
  activityType: string;
  status: string;
  visibility: string;
  format: string;
  locationName: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  coverImageUrl?: string | null;
  startsAt: JsonDateString;
  endsAt: JsonDateString | null;
  maxTeams: number | null;
  maxSoloPlayers: number | null;
  maxWatchers: number | null;
  maxVolunteers: number | null;
  entryFeeCents: number | null;
  currency: string;
  allowTeams: boolean;
  allowSoloPlayers: boolean;
  allowWatchers: boolean;
  allowVolunteers: boolean;
  createdAt: JsonDateString;
  updatedAt: JsonDateString;
  organizer: ApiUserSnippet;
  /** Present on detail responses; list may be capped while `_count.participants` is authoritative. */
  participants?: ApiEventParticipantPreview[];
  /** Present on `GET /api/events/[eventId]` when header sent; omit on list/upcoming responses. */
  viewerContext?: ApiEventViewerContext | null;
  _count: {
    teams: number;
    participants: number;
    matches: number;
  };
}

/** One row for Home / My Events lists (`GET /api/me/events`). */
export interface ApiHomeEventSummary {
  id: string;
  title: string;
  activityType: string;
  role: string;
  status: string;
  startsAt: JsonDateString;
  locationName: string | null;
  city: string | null;
  state: string | null;
  imageUrl: string | null;
  proofStatus?: string | null;
  /** e.g. `UPCOMING` | `FULLY_VERIFIED` | `PROOF_PENDING` | … (optional for older API responses). */
  commitmentStatus?: string;
  commitmentStatusLine?: string;
  scoreImpactLabel?: string;
  scoreImpactValue?: number | null;
  completionReason?: string | null;
  participantCount: number;
}

export interface ApiHomeAction {
  id: string;
  /** `SUBMIT_PROOF` | `REVIEW_PROOF` | `TEAM_RESULT_REVIEW` | … */
  type: string;
  title: string;
  subtitle: string;
  eventId?: string;
  ctaLabel: string;
  proofSubmissionId?: string;
  matchId?: string;
}

export interface ApiHomeProofInboxItem {
  id: string;
  title: string;
  subtitle: string;
  eventId?: string;
  matchId?: string;
  proofSubmissionId?: string;
}

export interface ApiHomeActivityItem {
  id: string;
  text: string;
  createdAt: JsonDateString;
}

export interface ApiHomeStats {
  kairoScore: number;
  scoreLabel: string;
  sevenDayTrend: number;
  streakDays: number;
  weeklyRank: number | null;
  completedRecent: number;
  totalRecent: number;
}

/** `GET /api/me/notifications` — in-app notification center (derived rows; no persisted read state yet). */
export type ApiNotificationFocus = "proof" | "organizer" | "result" | null;

export interface ApiNotificationItem {
  id: string;
  type: string;
  title: string;
  body: string;
  createdAt: JsonDateString;
  readAt: JsonDateString | null;
  eventId?: string | null;
  matchId?: string | null;
  proofSubmissionId?: string | null;
  actionLabel?: string | null;
  focus?: ApiNotificationFocus;
}

export interface ApiMeNotificationsPayload {
  unreadCount: number;
  notifications: ApiNotificationItem[];
}

/** `PATCH /api/me/notifications/read` — updates read cursor. */
export interface ApiMarkNotificationsReadPayload {
  lastReadAt: JsonDateString;
}

/** `POST /api/me/push-tokens` / `PATCH /api/me/push-tokens` — Expo device token row. */
export interface ApiPushTokenDto {
  id: string;
  token: string;
  enabled: boolean;
}

/** `GET /api/me/profile` — profile + onboarding flags. */
export interface ApiMeProfileDto {
  id: string;
  userId: string;
  name: string | null;
  username: string | null;
  avatarUrl: string | null;
  bio: string | null;
  /** Public social handles from `Profile.socialLinks` (Prisma JSON). */
  socialLinks: Record<string, string> | null;
  onboardingCompleted: boolean;
  onboardingCompletedAt: JsonDateString | null;
  primaryGoal: string | null;
  accountabilityStyle: string | null;
  participationModes: string[];
  activityInterests: string[];
  preferredEventTypes: string[];
  stakePreference: string | null;
  proofPreference: string | null;
  socialCirclePreference: string | null;
  notificationPreference: string | null;
  locationPreference: string | null;
}

export interface ApiMeProfilePayload {
  userId: string;
  onboardingCompleted: boolean;
  profile: ApiMeProfileDto;
}

/** `PATCH /api/me/profile` — partial profile update; response matches `GET /api/me/profile`. */
export type ApiUpdateMyProfilePayload = ApiMeProfilePayload;

/** `PATCH /api/me/profile/onboarding` — persist onboarding + mark complete. */
export interface ApiCompleteOnboardingPayload {
  profile: ApiMeProfileDto;
}

/** `GET /api/me/events` — grouped summaries + Home dashboard blocks. */
export interface ApiMeEventsPayload {
  hosting: ApiHomeEventSummary[];
  attending: ApiHomeEventSummary[];
  invited: ApiHomeEventSummary[];
  watching: ApiHomeEventSummary[];
  volunteering: ApiHomeEventSummary[];
  actions: ApiHomeAction[];
  proofInbox: ApiHomeProofInboxItem[];
  stats: ApiHomeStats;
  recentActivity: ApiHomeActivityItem[];
}

export interface ApiTeamMember {
  id: string;
  teamId: string;
  userId: string;
  role: string;
  createdAt: JsonDateString;
  updatedAt: JsonDateString;
  user: ApiUserSnippet;
}

/** Team row as embedded on matches (no captain/members include). */
export interface ApiTeamCore {
  id: string;
  eventId: string;
  captainId: string;
  name: string;
  description: string | null;
  logoUrl: string | null;
  seed: number | null;
  createdAt: JsonDateString;
  updatedAt: JsonDateString;
}

export interface ApiTeamPublic extends ApiTeamCore {
  captain: ApiUserSnippet;
  members: ApiTeamMember[];
}

export interface ApiBracketSnippet {
  id: string;
  name: string;
}

export interface ApiMatchPublic {
  id: string;
  eventId: string;
  bracketId: string | null;
  round: number | null;
  matchNumber: number | null;
  scheduledAt: JsonDateString | null;
  homeTeamId: string | null;
  awayTeamId: string | null;
  winnerTeamId: string | null;
  homeScore: number | null;
  awayScore: number | null;
  status: string;
  /** Result verification track (orthogonal to proof). */
  resultVerificationMode: string;
  resultStatus: string;
  submittedByTeamId: string | null;
  confirmedByTeamId: string | null;
  resolvedByUserId: string | null;
  createdAt: JsonDateString;
  updatedAt: JsonDateString;
  homeTeam: ApiTeamCore | null;
  awayTeam: ApiTeamCore | null;
  winnerTeam: ApiTeamCore | null;
  bracket: ApiBracketSnippet | null;
}

export interface ApiProofPrompt {
  id: string;
  eventId: string;
  title: string;
  description: string | null;
  proofType: string;
  isRequired: boolean;
  createdAt: JsonDateString;
  updatedAt: JsonDateString;
}

export interface ApiProofSubmission {
  id: string;
  eventId: string;
  matchId: string | null;
  promptId: string | null;
  userId: string;
  type: string;
  url: string | null;
  text: string | null;
  status: string;
  createdAt: JsonDateString;
  updatedAt: JsonDateString;
  user: ApiUserSnippet;
  prompt: {
    id: string;
    title: string;
    proofType: string;
  } | null;
  match: {
    id: string;
    round: number | null;
    matchNumber: number | null;
  } | null;
}

export interface ApiStake {
  id: string;
  eventId: string;
  matchId: string | null;
  type: string;
  title: string;
  description: string | null;
  amountCents: number | null;
  currency: string;
  status: string;
  createdAt: JsonDateString;
  updatedAt: JsonDateString;
}

export interface ApiLeaveTeamResult {
  left: true;
}

export interface ApiProofReviewResult {
  id: string;
  status: string;
}

/** `POST /api/proof-media/upload-url` — signed PUT + public URL for proof media (Supabase Storage). */
export interface ApiProofMediaUploadInstructions {
  uploadUrl: string;
  publicUrl: string;
  method: "PUT";
  headers: Record<string, string>;
}

/** Stripe charge–backed row from `GET /api/billing/purchases`. */
export interface ApiBillingPurchase {
  id: string;
  amountCents: number;
  currency: string;
  status: string;
  created: number;
  description: string | null;
  receiptUrl: string | null;
}
