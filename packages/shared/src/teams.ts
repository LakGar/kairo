import { z } from "zod";

export const createTeamSchema = z.object({
  name: z.string().trim().min(1, "Team name is required").max(120),
  description: z.union([z.string().trim().max(2000), z.literal("")]).optional(),
  logoUrl: z.union([z.string().url().max(2000), z.literal("")]).optional(),
});

export type CreateTeamInput = z.infer<typeof createTeamSchema>;

/** Joining a team has no body fields in MVP; extend later (e.g. invite code). */
export const joinTeamSchema = z.object({}).strict();

export type JoinTeamInput = z.infer<typeof joinTeamSchema>;
