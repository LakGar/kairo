import { z } from "zod";

/**
 * Body for `POST /api/auth/bootstrap` (mobile → website).
 * TODO(production): Verify a Clerk session token server-side; do not trust this body alone.
 */
export const authBootstrapRequestSchema = z.object({
  clerkUserId: z.string().trim().min(1).max(128),
  email: z.string().trim().email().max(320),
  name: z.string().trim().max(200).optional().nullable(),
  username: z.string().trim().max(50).optional().nullable(),
  avatarUrl: z.string().trim().max(2000).optional().nullable(),
});

export type AuthBootstrapRequestInput = z.infer<typeof authBootstrapRequestSchema>;

export const authBootstrapProfileSchema = z.object({
  id: z.string(),
  userId: z.string(),
  name: z.string().nullable(),
  username: z.string().nullable(),
  avatarUrl: z.string().nullable(),
  bio: z.string().nullable(),
});

export type AuthBootstrapProfile = z.infer<typeof authBootstrapProfileSchema>;
