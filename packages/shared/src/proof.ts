import { z } from "zod";

import { proofTypeSchema } from "./enums";

export const createProofPromptSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.union([z.string().trim().max(4000), z.literal("")]).optional(),
  proofType: proofTypeSchema,
  isRequired: z.boolean().optional(),
});

export type CreateProofPromptInput = z.infer<typeof createProofPromptSchema>;

function parseHttpOrFileUrl(raw: string): URL | null {
  const t = raw.trim();
  if (!t) return null;
  try {
    const u = new URL(t);
    if (u.protocol === "http:" || u.protocol === "https:" || u.protocol === "file:") {
      return u;
    }
    return null;
  } catch {
    return null;
  }
}

/** Non-local http:// media URLs are rejected (production rules are enforced again on the server). */
function isLocalhostHttpUrl(u: URL): boolean {
  if (u.protocol !== "http:") return false;
  const h = u.hostname.toLowerCase();
  return h === "localhost" || h === "127.0.0.1" || h === "[::1]";
}

export const submitProofSchema = z
  .object({
    eventId: z.string().cuid(),
    matchId: z.string().cuid().optional().nullable(),
    promptId: z.string().cuid().optional().nullable(),
    type: proofTypeSchema,
    /** Remote HTTPS URL after upload; `file:` only for dev capture before upload (server-gated). */
    url: z.union([z.string().max(4000), z.literal(""), z.null()]).optional().nullable(),
    text: z.union([z.string().max(8000), z.literal("")]).optional().nullable(),
  })
  .superRefine((val, ctx) => {
    const urlTrim = val.url?.trim() ?? "";
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
      if (!urlTrim) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "LINK proof requires url",
          path: ["url"],
        });
      } else {
        const u = parseHttpOrFileUrl(urlTrim);
        if (!u || (u.protocol !== "http:" && u.protocol !== "https:")) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "LINK proof requires an http(s) URL",
            path: ["url"],
          });
        }
      }
    }
    if (val.type === "PHOTO" || val.type === "VIDEO") {
      if (!urlTrim) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "PHOTO/VIDEO proof requires a media URL",
          path: ["url"],
        });
      } else {
        const u = parseHttpOrFileUrl(urlTrim);
        if (!u) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "PHOTO/VIDEO url must be https, file, or http://localhost (local storage)",
            path: ["url"],
          });
        } else if (u.protocol === "http:" && !isLocalhostHttpUrl(u)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "PHOTO/VIDEO proof must use https (http is only allowed for localhost dev storage)",
            path: ["url"],
          });
        }
      }
    }
  });

export type SubmitProofInput = z.infer<typeof submitProofSchema>;

export const reviewProofSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
});

export type ReviewProofInput = z.infer<typeof reviewProofSchema>;
