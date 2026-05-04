import { z } from "zod";

import {
  eventFormatSchema,
  eventVisibilitySchema,
  joinEventParticipantRoleSchema,
  resultVerificationModeSchema,
} from "./enums";

export type EventFormatValue = z.infer<typeof eventFormatSchema>;
export type ResultVerificationModeValue = z.infer<typeof resultVerificationModeSchema>;

/**
 * MVP default for new matches (mirrors product plan §1.5).
 * `OPEN_MEETUP` → team agreement; structured competition formats → organizer decides.
 */
export function getDefaultResultVerificationModeForEventFormat(
  format: EventFormatValue,
): ResultVerificationModeValue {
  return format === "OPEN_MEETUP" ? "TEAM_AGREEMENT" : "ORGANIZER_DECIDES";
}

const optionalTrimmedString = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v === "" ? undefined : v));

const createEventFieldsSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  description: z.union([z.string().trim().max(8000), z.literal("")]).optional(),
  activityType: z.string().trim().min(1, "Activity type is required").max(120),
  format: eventFormatSchema,
  visibility: eventVisibilitySchema,
  locationName: optionalTrimmedString(200),
  address: optionalTrimmedString(500),
  city: optionalTrimmedString(120),
  state: optionalTrimmedString(120),
  country: optionalTrimmedString(120),
  startsAt: z.coerce.date({ invalid_type_error: "startsAt must be a valid date" }),
  endsAt: z.coerce.date().optional().nullable(),
  maxTeams: z.number().int().positive().optional().nullable(),
  maxSoloPlayers: z.number().int().positive().optional().nullable(),
  maxWatchers: z.number().int().positive().optional().nullable(),
  maxVolunteers: z.number().int().positive().optional().nullable(),
  entryFeeCents: z.number().int().min(0).optional().nullable(),
  currency: z.string().length(3).optional().default("USD"),
  allowTeams: z.boolean(),
  allowSoloPlayers: z.boolean(),
  allowWatchers: z.boolean(),
  allowVolunteers: z.boolean(),
});

export const createEventSchema = createEventFieldsSchema
  .refine(
    (v) =>
      v.allowTeams || v.allowSoloPlayers || v.allowWatchers || v.allowVolunteers,
    {
      message: "At least one participant type must be allowed",
      path: ["allowSoloPlayers"],
    },
  )
  .refine((v) => !v.endsAt || v.endsAt >= v.startsAt, {
    message: "endsAt must be on or after startsAt",
    path: ["endsAt"],
  });

export type CreateEventInput = z.infer<typeof createEventSchema>;

/** Partial updates; service layer enforces organizer-only rules and publish flows. */
export const updateEventSchema = createEventFieldsSchema.partial();

export type UpdateEventInput = z.infer<typeof updateEventSchema>;

export const joinEventSchema = z.object({
  role: joinEventParticipantRoleSchema,
  note: z.string().trim().max(500).optional(),
});

export type JoinEventInput = z.infer<typeof joinEventSchema>;
