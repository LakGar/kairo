import {
  createProofPromptSchema,
  reviewProofSchema,
  submitProofSchema,
} from "@kairo/shared";

export function parseCreateProofPrompt(input: unknown) {
  return createProofPromptSchema.safeParse(input);
}

export function parseSubmitProof(input: unknown) {
  return submitProofSchema.safeParse(input);
}

export function parseReviewProof(input: unknown) {
  return reviewProofSchema.safeParse(input);
}
