import { z } from "zod";

/** Allowed MIME types for proof media uploads (server + client). */
export const proofMediaContentTypeSchema = z.enum([
  "image/jpeg",
  "image/png",
  "video/mp4",
  "video/quicktime",
]);

export type ProofMediaContentType = z.infer<typeof proofMediaContentTypeSchema>;

export const proofMediaUploadRequestSchema = z
  .object({
    eventId: z.string().cuid(),
    proofType: z.enum(["PHOTO", "VIDEO"]),
    contentType: proofMediaContentTypeSchema,
    /** Byte size of the file to upload; required for limits and signed upload. */
    fileSize: z.number().int().positive(),
    promptId: z.string().cuid().optional().nullable(),
    matchId: z.string().cuid().optional().nullable(),
  })
  .superRefine((val, ctx) => {
    const maxBytes = val.proofType === "PHOTO" ? 10 * 1024 * 1024 : 100 * 1024 * 1024;
    if (val.fileSize > maxBytes) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          val.proofType === "PHOTO"
            ? "Photo must be at most 10 MB."
            : "Video must be at most 100 MB.",
        path: ["fileSize"],
      });
    }
  });

export type ProofMediaUploadRequestInput = z.infer<typeof proofMediaUploadRequestSchema>;

/** Response from `POST /api/proof-media/upload-url` (signed PUT to Supabase Storage). */
export const proofMediaUploadInstructionsSchema = z.object({
  uploadUrl: z.string().url(),
  publicUrl: z.string().url(),
  method: z.literal("PUT"),
  /** Includes Content-Type, cache-control, x-upsert for Supabase signed upload. */
  headers: z.record(z.string(), z.string()),
});

export type ProofMediaUploadInstructions = z.infer<typeof proofMediaUploadInstructionsSchema>;

// TODO: virus scanning / content moderation on uploaded bytes; EXIF/location metadata policy; orphan object cleanup after failed submitProof.
