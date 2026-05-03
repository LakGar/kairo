import {
  createEventSchema,
  joinEventSchema,
  updateEventSchema,
} from "@kairo/shared";

export function parseCreateEvent(input: unknown) {
  return createEventSchema.safeParse(input);
}

export function parseUpdateEvent(input: unknown) {
  return updateEventSchema.safeParse(input);
}

export function parseJoinEvent(input: unknown) {
  return joinEventSchema.safeParse(input);
}
