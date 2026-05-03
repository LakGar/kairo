import { z } from "zod";

import { stakeStatusSchema, stakeTypeSchema } from "./enums";

export const createStakeSchema = z.object({
  matchId: z.string().cuid().optional().nullable(),
  type: stakeTypeSchema.default("TASK"),
  title: z.string().trim().min(1, "Title is required").max(200),
  description: z.union([z.string().trim().max(4000), z.literal("")]).optional(),
  amountCents: z.number().int().min(0).optional().nullable(),
  currency: z.string().length(3).optional().default("USD"),
});

export type CreateStakeInput = z.infer<typeof createStakeSchema>;

export const updateStakeStatusSchema = z.object({
  status: stakeStatusSchema,
});

export type UpdateStakeStatusInput = z.infer<typeof updateStakeStatusSchema>;
