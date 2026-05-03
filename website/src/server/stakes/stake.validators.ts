import { createStakeSchema } from "@kairo/shared";

export function parseCreateStake(input: unknown) {
  return createStakeSchema.safeParse(input);
}
