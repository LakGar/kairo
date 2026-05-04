import { z } from "zod";

import { matchStatusSchema, resultVerificationModeSchema } from "./enums";

export const createManualMatchSchema = z
  .object({
    bracketId: z.string().cuid().optional().nullable(),
    round: z.number().int().min(1).optional().nullable(),
    matchNumber: z.number().int().min(1).optional().nullable(),
    scheduledAt: z.coerce.date().optional().nullable(),
    homeTeamId: z.string().cuid().optional().nullable(),
    awayTeamId: z.string().cuid().optional().nullable(),
    status: matchStatusSchema.optional(),
    /** Defaults to ORGANIZER_DECIDES on the server. TEAM_AGREEMENT requires both home and away teams. */
    resultVerificationMode: resultVerificationModeSchema.optional(),
  })
  .refine(
    (v) =>
      !v.homeTeamId ||
      !v.awayTeamId ||
      v.homeTeamId !== v.awayTeamId,
    { message: "Home and away teams must differ", path: ["awayTeamId"] },
  )
  .superRefine((val, ctx) => {
    if (val.resultVerificationMode === "TEAM_AGREEMENT") {
      if (!val.homeTeamId || !val.awayTeamId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "TEAM_AGREEMENT requires both home and away teams",
          path: ["resultVerificationMode"],
        });
      }
    }
  });

export type CreateManualMatchInput = z.infer<typeof createManualMatchSchema>;

export const updateMatchScoreSchema = z
  .object({
    homeScore: z.number().int().min(0).optional(),
    awayScore: z.number().int().min(0).optional(),
    status: matchStatusSchema.optional(),
  })
  .refine(
    (v) =>
      v.homeScore !== undefined ||
      v.awayScore !== undefined ||
      v.status !== undefined,
    { message: "Provide homeScore, awayScore, and/or status", path: ["homeScore"] },
  );

export type UpdateMatchScoreInput = z.infer<typeof updateMatchScoreSchema>;

export const markMatchWinnerSchema = z.object({
  winnerTeamId: z.string().cuid(),
});

export type MarkMatchWinnerInput = z.infer<typeof markMatchWinnerSchema>;

/** Team proposes score + winner; opponent must confirm or dispute. */
export const submitTeamAgreementResultSchema = z.object({
  winnerTeamId: z.string().cuid(),
  homeScore: z.number().int().min(0).optional(),
  awayScore: z.number().int().min(0).optional(),
});

export type SubmitTeamAgreementResultInput = z.infer<typeof submitTeamAgreementResultSchema>;

export const confirmTeamAgreementResultSchema = z.object({});

export const disputeTeamAgreementResultSchema = z.object({});
