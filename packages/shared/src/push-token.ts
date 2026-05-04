import { z } from "zod";

/** Expo / FCM-backed device tokens returned by `expo-notifications`. */
export function isLikelyExpoPushToken(token: string): boolean {
  const t = token.trim();
  return t.startsWith("ExponentPushToken[") || t.startsWith("ExpoPushToken[");
}

/** Body for `POST /api/me/push-tokens`. */
export const registerPushTokenRequestSchema = z
  .object({
    token: z.string().trim().min(1),
    platform: z.string().trim().max(32).optional(),
    deviceId: z.string().trim().max(200).optional(),
  })
  .strict()
  .superRefine((val, ctx) => {
    if (!isLikelyExpoPushToken(val.token)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Token must be an Expo push token (ExponentPushToken[…] or ExpoPushToken[…]).",
        path: ["token"],
      });
    }
  });

export type RegisterPushTokenRequestInput = z.infer<typeof registerPushTokenRequestSchema>;

/** Body for `PATCH /api/me/push-tokens` — toggle delivery for a token owned by the user. */
export const updatePushTokenRequestSchema = z
  .object({
    token: z.string().trim().min(1),
    enabled: z.boolean(),
  })
  .strict();

export type UpdatePushTokenRequestInput = z.infer<typeof updatePushTokenRequestSchema>;
