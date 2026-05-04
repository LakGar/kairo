import {
  registerPushTokenRequestSchema,
  updatePushTokenRequestSchema,
} from "@kairo/shared";

import { prisma } from "@/lib/db";
import { err, ok, type Result } from "@/src/lib/result";

export type PushTokenDto = {
  id: string;
  token: string;
  enabled: boolean;
};

function mapRow(row: { id: string; token: string; enabled: boolean }): PushTokenDto {
  return { id: row.id, token: row.token, enabled: row.enabled };
}

/**
 * Upsert by unique `token` and bind to the acting user (device handoff if token moved accounts).
 */
export async function registerPushToken(
  userId: string,
  input: unknown,
): Promise<Result<PushTokenDto>> {
  const parsed = registerPushTokenRequestSchema.safeParse(input);
  if (!parsed.success) {
    const flat = parsed.error.flatten();
    const msg =
      Object.entries(flat.fieldErrors)
        .flatMap(([, msgs]) => msgs ?? [])
        .join("; ") ||
      flat.formErrors.join("; ") ||
      parsed.error.message;
    return err(msg, "VALIDATION_ERROR");
  }
  const d = parsed.data;

  const row = await prisma.pushToken.upsert({
    where: { token: d.token },
    create: {
      userId,
      token: d.token,
      platform: d.platform?.trim() || null,
      deviceId: d.deviceId?.trim() || null,
      enabled: true,
    },
    update: {
      userId,
      platform: d.platform?.trim() || null,
      deviceId: d.deviceId?.trim() || null,
      enabled: true,
    },
    select: { id: true, token: true, enabled: true },
  });

  return ok(mapRow(row));
}

export async function updatePushTokenEnabled(
  userId: string,
  input: unknown,
): Promise<Result<PushTokenDto>> {
  const parsed = updatePushTokenRequestSchema.safeParse(input);
  if (!parsed.success) {
    const flat = parsed.error.flatten();
    const msg =
      Object.entries(flat.fieldErrors)
        .flatMap(([, msgs]) => msgs ?? [])
        .join("; ") ||
      flat.formErrors.join("; ") ||
      parsed.error.message;
    return err(msg, "VALIDATION_ERROR");
  }
  const d = parsed.data;

  const existing = await prisma.pushToken.findFirst({
    where: { token: d.token, userId },
    select: { id: true },
  });
  if (!existing) {
    return err("Push token not found for this user.", "NOT_FOUND");
  }

  const row = await prisma.pushToken.update({
    where: { id: existing.id },
    data: { enabled: d.enabled },
    select: { id: true, token: true, enabled: true },
  });

  return ok(mapRow(row));
}
