import { z } from "zod";

/** Username: lowercase letters, digits, underscore; min 3. */
const usernameSchema = z
  .string()
  .trim()
  .transform((s) => s.toLowerCase())
  .pipe(
    z
      .string()
      .min(3, "Username must be at least 3 characters")
      .max(50)
      .regex(/^[a-z0-9_]+$/, "Use lowercase letters, numbers, and underscores only"),
  );

const nullableString = z.union([z.string(), z.null()]).optional();

const stringArray = z.array(z.string()).default([]);

/**
 * Body for `PATCH /api/me/profile/onboarding` — completes onboarding and persists preferences.
 */
export const profileOnboardingCompleteRequestSchema = z.object({
  displayName: z.string().trim().min(1, "Display name is required").max(200),
  username: usernameSchema,
  shortBio: z.string().trim().max(2000).optional().default(""),
  primaryGoal: nullableString,
  accountabilityStyle: nullableString,
  participationModes: stringArray,
  activityInterests: stringArray,
  preferredEventTypes: stringArray,
  stakePreference: nullableString,
  proofPreference: nullableString,
  socialCirclePreference: nullableString,
  notificationPreference: nullableString,
  locationPreference: nullableString,
});

export type ProfileOnboardingCompleteRequestInput = z.infer<
  typeof profileOnboardingCompleteRequestSchema
>;
