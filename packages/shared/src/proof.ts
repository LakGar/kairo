import { z } from "zod";

import { proofTypeSchema } from "./enums";

export const createProofPromptSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.union([z.string().trim().max(4000), z.literal("")]).optional(),
  proofType: proofTypeSchema,
  isRequired: z.boolean().optional(),
});

export type CreateProofPromptInput = z.infer<typeof createProofPromptSchema>;

export const submitProofSchema = z
  .object({
    eventId: z.string().cuid(),
    matchId: z.string().cuid().optional().nullable(),
    promptId: z.string().cuid().optional().nullable(),
    type: proofTypeSchema,
    url: z.union([z.string().url().max(4000), z.literal("")]).optional().nullable(),
    text: z.union([z.string().max(8000), z.literal("")]).optional().nullable(),
  })
  .superRefine((val, ctx) => {
    if (val.type === "TEXT") {
      if (!val.text?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "TEXT proof requires text",
          path: ["text"],
        });
      }
    }
    if (val.type === "LINK") {
      if (!val.url?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "LINK proof requires url",
          path: ["url"],
        });
      }
    }
    if (val.type === "PHOTO" || val.type === "VIDEO") {
      if (!val.url?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "PHOTO/VIDEO proof requires url for MVP (no file upload yet)",
          path: ["url"],
        });
      }
    }
  });

export type SubmitProofInput = z.infer<typeof submitProofSchema>;

export const reviewProofSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
});

export type ReviewProofInput = z.infer<typeof reviewProofSchema>;
