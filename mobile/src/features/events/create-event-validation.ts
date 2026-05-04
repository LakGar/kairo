import type { CreateEventForm, CreateEventFormErrors } from "./create-event.types";

export type CreateEventValidationResult =
  | { ok: true; payload: CreateEventForm }
  | { ok: false; errors: CreateEventFormErrors };

export function validateCreateEventForm(
  form: CreateEventForm,
  options?: { skipStartLabel?: boolean },
): CreateEventValidationResult {
  const errors: CreateEventFormErrors = {};

  if (!form.title.trim()) {
    errors.title = "Event name is required.";
  }

  if (!form.locationName.trim()) {
    errors.location = "Location is required.";
  }

  if (!options?.skipStartLabel && !form.startsAtLabel.trim()) {
    errors.start = "Start time is required.";
  }

  if (!form.allowSoloPlayers && !form.allowTeams) {
    errors.participation = "Choose solo players, teams, or both.";
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  return { ok: true, payload: form };
}
