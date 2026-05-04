import { z } from "zod";

/** Event hero image before an event id exists — stored under `event-covers/{userId}/…` in the proof bucket. */
export const eventCoverMediaUploadRequestSchema = z
  .object({
    contentType: z.enum(["image/jpeg", "image/png"]),
    fileSize: z.number().int().positive(),
  })
  .superRefine((val, ctx) => {
    const maxBytes = 10 * 1024 * 1024;
    if (val.fileSize > maxBytes) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Cover image must be at most 10 MB.",
        path: ["fileSize"],
      });
    }
  });

export type EventCoverMediaUploadRequestInput = z.infer<typeof eventCoverMediaUploadRequestSchema>;
