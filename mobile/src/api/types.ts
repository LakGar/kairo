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
  _count: {
    teams: number;
    participants: number;
    matches: number;
  };
}

/** `GET /api/me/events` — events you host vs events you joined. */
export interface ApiMyEventsPayload {
  hosting: ApiEventPublic[];
  attending: ApiEventPublic[];
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
