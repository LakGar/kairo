import { createTeamSchema, joinTeamSchema } from "@kairo/shared";

export function parseCreateTeam(input: unknown) {
  return createTeamSchema.safeParse(input);
}

export function parseJoinTeam(input: unknown) {
  return joinTeamSchema.safeParse(input);
}
