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
    /** Defaults to ORGANIZER_DECIDES on the server. TEAM_AGREEMENT reserved for a later PR. */
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
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "TEAM_AGREEMENT is not available yet; omit or use ORGANIZER_DECIDES",
        path: ["resultVerificationMode"],
      });
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
