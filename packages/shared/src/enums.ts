import { z } from "zod";

/** Mirrors `EventFormat` in Prisma — keep in sync manually (no `@prisma/client` in shared). */
export const eventFormatSchema = z.enum([
  "OPEN_MEETUP",
  "TEAM_TOURNAMENT",
  "SOLO_COMPETITION",
  "ROUND_ROBIN",
  "SINGLE_ELIMINATION",
]);

/** Mirrors `EventVisibility` in Prisma. */
export const eventVisibilitySchema = z.enum(["PUBLIC", "PRIVATE", "INVITE_ONLY"]);

/** Join flows: `PLAYER` | `WATCHER` | `VOLUNTEER` (mirrors Prisma subset). */
export const joinEventParticipantRoleSchema = z.enum(["PLAYER", "WATCHER", "VOLUNTEER"]);

/** Mirrors `MatchStatus` in Prisma. */
export const matchStatusSchema = z.enum([
  "SCHEDULED",
  "LIVE",
  "COMPLETED",
  "CANCELLED",
]);

/** Mirrors `ResultVerificationMode` in Prisma. */
export const resultVerificationModeSchema = z.enum([
  "TEAM_AGREEMENT",
  "ORGANIZER_DECIDES",
]);

/** Mirrors `MatchResultStatus` in Prisma. */
export const matchResultStatusSchema = z.enum([
  "PENDING",
  "WAITING_CONFIRMATION",
  "CONFIRMED",
  "DISPUTED",
]);

/** Mirrors `ProofType` in Prisma. */
export const proofTypeSchema = z.enum(["PHOTO", "VIDEO", "TEXT", "LINK"]);

/** Mirrors `ProofStatus` in Prisma. */
export const proofStatusSchema = z.enum(["PENDING", "APPROVED", "REJECTED"]);

/** Mirrors `StakeType` in Prisma. */
export const stakeTypeSchema = z.enum(["NONE", "TASK", "DONATION", "PRIZE"]);

/** Mirrors `StakeStatus` in Prisma. */
export const stakeStatusSchema = z.enum(["PENDING", "COMPLETED", "FAILED"]);
