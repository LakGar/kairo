import { z } from "zod";

import { profileUsernameSchema } from "./profile-onboarding";

const nullablePref = z.union([z.string().max(200), z.null()]).optional();

/**
 * Body for `PATCH /api/me/profile` — partial profile + preference updates.
 * At least one field must be present after parsing (non-empty object).
 */
export const updateMyProfileRequestSchema = z
  .object({
    name: z.union([z.string().max(200), z.literal("")]).optional(),
    username: profileUsernameSchema.optional(),
    bio: z.union([z.string().max(2000), z.literal("")]).optional(),
    primaryGoal: nullablePref,
    accountabilityStyle: nullablePref,
    participationModes: z.array(z.string()).optional(),
    activityInterests: z.array(z.string()).optional(),
    preferredEventTypes: z.array(z.string()).optional(),
    stakePreference: nullablePref,
    proofPreference: nullablePref,
    socialCirclePreference: nullablePref,
    notificationPreference: nullablePref,
    locationPreference: nullablePref,
  })
  .strict()
  .superRefine((val, ctx) => {
    const has = Object.values(val).some((v) => v !== undefined);
    if (!has) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "At least one field is required",
        path: [],
      });
    }
  });

export type UpdateMyProfileRequestInput = z.infer<typeof updateMyProfileRequestSchema>;
