import {
  confirmTeamAgreementResultSchema,
  createManualMatchSchema,
  disputeTeamAgreementResultSchema,
  markMatchWinnerSchema,
  submitTeamAgreementResultSchema,
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

export function parseSubmitTeamAgreementResult(input: unknown) {
  return submitTeamAgreementResultSchema.safeParse(input);
}

export function parseConfirmTeamAgreementResult(input: unknown) {
  return confirmTeamAgreementResultSchema.safeParse(input ?? {});
}

export function parseDisputeTeamAgreementResult(input: unknown) {
  return disputeTeamAgreementResultSchema.safeParse(input ?? {});
}
