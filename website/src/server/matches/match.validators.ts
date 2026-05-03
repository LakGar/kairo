import {
  createManualMatchSchema,
  markMatchWinnerSchema,
  updateMatchScoreSchema,
} from "@kairo/shared";

export function parseCreateManualMatch(input: unknown) {
  return createManualMatchSchema.safeParse(input);
}

export function parseUpdateMatchScore(input: unknown) {
  return updateMatchScoreSchema.safeParse(input);
}

export function parseMarkMatchWinner(input: unknown) {
  return markMatchWinnerSchema.safeParse(input);
}
