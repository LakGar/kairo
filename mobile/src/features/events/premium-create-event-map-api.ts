import {
  createEventSchema,
  createProofPromptSchema,
  createStakeSchema,
  type CreateEventInput,
  type CreateProofPromptInput,
  type CreateStakeInput,
} from "@kairo/shared";

import type { CreateEventForm, EventFormat, ProofType, StakeType } from "./create-event.types";
import {
  defaultProofTitleForApi,
  suggestPremiumProofPromptContent,
} from "./premium-proof-prompt-templates";

export function defaultPremiumSchedule(): { startsAt: Date; endsAt: Date } {
  const startsAt = new Date();
  startsAt.setDate(startsAt.getDate() + 7);
  startsAt.setHours(12, 0, 0, 0);
  const endsAt = new Date(startsAt);
  endsAt.setHours(endsAt.getHours() + 1);
  return { startsAt, endsAt };
}

export function formatPremiumStartLabel(d: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(d);
}

export function formatPremiumEndLabel(d: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(d);
}

function activityTypeFromFormat(format: EventFormat): string {
  switch (format) {
    case "OPEN_MEETUP":
      return "Meetup";
    case "TEAM_TOURNAMENT":
      return "Team tournament";
    case "SOLO_COMPETITION":
      return "Solo competition";
    case "ROUND_ROBIN":
      return "Round robin";
    case "SINGLE_ELIMINATION":
      return "Single elimination bracket";
    default:
      return "Event";
  }
}

function parseOptionalPositiveInt(raw: string): number | undefined {
  const t = raw.trim();
  if (!t) return undefined;
  const n = parseInt(t, 10);
  if (!Number.isFinite(n) || n <= 0) return undefined;
  return n;
}

function parsePremiumPriceToCents(priceLabel: string): number | undefined {
  const t = priceLabel.trim();
  if (!t || /^free$/i.test(t)) return undefined;
  const cleaned = t.replace(/[^0-9.]/g, "");
  if (!cleaned.trim()) return undefined;
  const n = Number(cleaned);
  if (!Number.isFinite(n) || n < 0) return undefined;
  return Math.round(n * 100);
}

export function validatePremiumScheduleDates(
  startsAt: Date,
  endsAt: Date,
): string | undefined {
  if (!(startsAt instanceof Date) || Number.isNaN(startsAt.getTime())) {
    return "Start time is invalid.";
  }
  if (!(endsAt instanceof Date) || Number.isNaN(endsAt.getTime())) {
    return "End time is invalid.";
  }
  if (endsAt < startsAt) {
    return "End must be on or after start.";
  }
  return undefined;
}

export function buildPremiumCreateEventPayload(
  form: CreateEventForm,
  startsAt: Date,
  endsAt: Date,
): unknown {
  const description = form.description.trim();
  const locationName = form.locationName.trim();

  const raw: Record<string, unknown> = {
    title: form.title.trim(),
    activityType: activityTypeFromFormat(form.format),
    format: form.format,
    visibility: form.visibility,
    startsAt: startsAt.toISOString(),
    endsAt: endsAt.toISOString(),
    allowTeams: form.allowTeams,
    allowSoloPlayers: form.allowSoloPlayers,
    allowWatchers: form.allowWatchers,
    allowVolunteers: form.allowVolunteers,
    currency: "USD",
  };

  if (description) {
    raw.description = description;
  }
  if (locationName) {
    raw.locationName = locationName;
  }

  const maxTeams = form.allowTeams ? parseOptionalPositiveInt(form.maxTeams) : undefined;
  const maxSoloPlayers = form.allowSoloPlayers
    ? parseOptionalPositiveInt(form.maxSoloPlayers)
    : undefined;
  const maxWatchers = form.allowWatchers
    ? parseOptionalPositiveInt(form.maxWatchers)
    : undefined;
  const maxVolunteers = form.allowVolunteers
    ? parseOptionalPositiveInt(form.maxVolunteers)
    : undefined;

  if (maxTeams !== undefined) raw.maxTeams = maxTeams;
  if (maxSoloPlayers !== undefined) raw.maxSoloPlayers = maxSoloPlayers;
  if (maxWatchers !== undefined) raw.maxWatchers = maxWatchers;
  if (maxVolunteers !== undefined) raw.maxVolunteers = maxVolunteers;

  const cents = parsePremiumPriceToCents(form.priceLabel);
  if (cents !== undefined && cents > 0) {
    raw.entryFeeCents = cents;
  }

  return raw;
}

export function safeParseCreateEventForPremium(
  form: CreateEventForm,
  startsAt: Date,
  endsAt: Date,
):
  | { ok: true; data: CreateEventInput }
  | { ok: false; message: string } {
  const raw = buildPremiumCreateEventPayload(form, startsAt, endsAt);
  const parsed = createEventSchema.safeParse(raw);
  if (!parsed.success) {
    const flat = parsed.error.flatten();
    const fieldMsgs = Object.entries(flat.fieldErrors)
      .flatMap(([key, msgs]) => (msgs?.length ? msgs.map((m) => `${key}: ${m}`) : []))
      .join("\n");
    return { ok: false, message: fieldMsgs || parsed.error.message };
  }
  return { ok: true, data: parsed.data };
}

/** Prisma / API `ProofType` for ProofPrompt — premium create uses PHOTO / VIDEO only. */
type ApiProofType = "PHOTO" | "VIDEO" | "TEXT" | "LINK";

function mapPremiumProofTypeToApi(proofType: ProofType): ApiProofType | null {
  switch (proofType) {
    case "NONE":
      return null;
    case "PHOTO":
      return "PHOTO";
    case "VIDEO":
      return "VIDEO";
    case "PHOTO_OR_VIDEO":
      // TODO: ProofPrompt is single-type today; store as PHOTO until multi-type / dual-accept prompts exist.
      return "PHOTO";
    default:
      return null;
  }
}

function clampTitle(raw: string): string {
  const t = raw.trim();
  if (t.length <= 200) return t;
  return t.slice(0, 200);
}

function composeProofPromptDescription(form: CreateEventForm, templateDescription: string): string {
  const parts: string[] = [];
  const t = templateDescription.trim();
  if (t) parts.push(t);
  if (form.proofType === "PHOTO_OR_VIDEO") {
    parts.push(
      "Participants may submit either a photo or a short video; this prompt is stored as PHOTO until the API supports a combined type (TODO).",
    );
  }
  parts.push(
    "Proof should be captured in Kairo with a photo or video once in-app capture is available.",
  );
  return parts.join(" ").slice(0, 4000);
}

/**
 * Builds a body for `POST /api/events/:id/proof-prompts`, or `null` when proof is disabled.
 * Validates with `createProofPromptSchema`; returns `null` if validation fails (caller should skip and log).
 */
export function premiumProofPromptPayloadForApi(form: CreateEventForm): CreateProofPromptInput | null {
  const apiProofType = mapPremiumProofTypeToApi(form.proofType);
  if (!apiProofType) return null;

  const custom = form.proofPrompt.trim();
  const suggested = suggestPremiumProofPromptContent(form, 0);
  const title = custom
    ? clampTitle(custom)
    : clampTitle(suggested.title.trim() || defaultProofTitleForApi(form.proofType));
  const description = composeProofPromptDescription(form, suggested.description);

  const parsed = createProofPromptSchema.safeParse({
    title,
    description,
    proofType: apiProofType,
    isRequired: true,
  });
  return parsed.success ? parsed.data : null;
}

function defaultStakeTitle(stakeType: StakeType): string {
  switch (stakeType) {
    case "TASK":
      return "Loser task";
    case "DONATION":
      return "Donation challenge";
    case "PRIZE":
      return "Prize/reward challenge";
    default:
      return "Challenge";
  }
}

function defaultStakeDescription(stakeType: StakeType): string {
  switch (stakeType) {
    case "TASK":
      return "Complete the agreed task if you lose.";
    case "DONATION":
      return "Complete the donation commitment after the event.";
    case "PRIZE":
      return "Winner receives the listed reward.";
    default:
      return "";
  }
}

/**
 * Builds a body for `POST /api/events/:id/stakes`, or `null` when stakes are disabled.
 */
export function premiumStakePayloadForApi(form: CreateEventForm): CreateStakeInput | null {
  if (form.stakeType === "NONE") return null;

  const note = form.stakeNote.trim();
  const title = defaultStakeTitle(form.stakeType);
  const description = note || defaultStakeDescription(form.stakeType);

  const parsed = createStakeSchema.safeParse({
    type: form.stakeType,
    title,
    description,
    currency: "USD",
  });
  return parsed.success ? parsed.data : null;
}
