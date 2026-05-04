export type EventVisibility = "PUBLIC" | "PRIVATE" | "INVITE_ONLY";

export type EventFormat =
  | "OPEN_MEETUP"
  | "TEAM_TOURNAMENT"
  | "SOLO_COMPETITION"
  | "ROUND_ROBIN"
  | "SINGLE_ELIMINATION";

export type StakeType = "NONE" | "TASK" | "DONATION" | "PRIZE";

/** Premium Create Event proof choices — map to API `PHOTO` / `VIDEO` (or PHOTO for combined until multi-type exists). */
export type ProofType = "NONE" | "PHOTO" | "VIDEO" | "PHOTO_OR_VIDEO";

/** Local-only create event form (mock phase). */
export type CreateEventForm = {
  title: string;
  description: string;
  coverImageUrl?: string;
  startsAtLabel: string;
  endsAtLabel: string;
  locationName: string;
  address: string;
  city: string;
  state: string;
  country: string;
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
