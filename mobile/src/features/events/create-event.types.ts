export type EventVisibility = "PUBLIC" | "PRIVATE" | "INVITE_ONLY";

export type EventFormat =
  | "OPEN_MEETUP"
  | "TEAM_TOURNAMENT"
  | "SOLO_COMPETITION"
  | "ROUND_ROBIN"
  | "SINGLE_ELIMINATION";

export type StakeType = "NONE" | "TASK" | "DONATION" | "PRIZE";

export type ProofType =
  | "NONE"
  | "PHOTO"
  | "SCORE_CONFIRMATION"
  | "FRIEND_VERIFICATION"
  | "ORGANIZER_APPROVAL";

/** Local-only create event form (mock phase). */
export type CreateEventForm = {
  title: string;
  description: string;
  coverImageUrl?: string;
  startsAtLabel: string;
  endsAtLabel: string;
  locationName: string;
  visibility: EventVisibility;
  format: EventFormat;
  allowSoloPlayers: boolean;
  allowTeams: boolean;
  allowWatchers: boolean;
  allowVolunteers: boolean;
  stakeType: StakeType;
  stakeNote: string;
  proofType: ProofType;
  proofPrompt: string;
  maxTeams: string;
  maxSoloPlayers: string;
  maxWatchers: string;
  maxVolunteers: string;
  requireApproval: boolean;
  priceLabel: string;
};

export type CreateEventFormErrors = Partial<
  Record<"title" | "location" | "participation" | "start", string>
>;
