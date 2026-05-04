import { createEventSchema, type CreateEventInput } from "@kairo/shared";

import type { CreateEventForm, EventFormat } from "./create-event.types";

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
