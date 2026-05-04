import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db";
import {
  profileOnboardingCompleteRequestSchema,
  updateMyProfileRequestSchema,
} from "@kairo/shared";
import { err, ok, type Result } from "@/src/lib/result";

export type MeProfileDto = {
  id: string;
  userId: string;
  name: string | null;
  username: string | null;
  avatarUrl: string | null;
  bio: string | null;
  onboardingCompleted: boolean;
  onboardingCompletedAt: string | null;
  primaryGoal: string | null;
  accountabilityStyle: string | null;
  participationModes: string[];
  activityInterests: string[];
  preferredEventTypes: string[];
  stakePreference: string | null;
  proofPreference: string | null;
  socialCirclePreference: string | null;
  notificationPreference: string | null;
  locationPreference: string | null;
};

export type MeProfilePayload = {
  userId: string;
  onboardingCompleted: boolean;
  profile: MeProfileDto;
};

function parseStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is string => typeof x === "string");
}

function iso(d: Date | null): string | null {
  if (!d) return null;
  return d.toISOString();
}

function mapProfile(row: {
  id: string;
  userId: string;
  name: string | null;
  username: string | null;
  avatarUrl: string | null;
  bio: string | null;
  onboardingCompleted: boolean;
  onboardingCompletedAt: Date | null;
  primaryGoal: string | null;
  accountabilityStyle: string | null;
  participationModes: Prisma.JsonValue | null;
  activityInterests: Prisma.JsonValue | null;
  preferredEventTypes: Prisma.JsonValue | null;
  stakePreference: string | null;
  proofPreference: string | null;
  socialCirclePreference: string | null;
  notificationPreference: string | null;
  locationPreference: string | null;
}): MeProfileDto {
  return {
    id: row.id,
    userId: row.userId,
    name: row.name,
    username: row.username,
    avatarUrl: row.avatarUrl,
    bio: row.bio,
    onboardingCompleted: row.onboardingCompleted,
    onboardingCompletedAt: iso(row.onboardingCompletedAt),
    primaryGoal: row.primaryGoal,
    accountabilityStyle: row.accountabilityStyle,
    participationModes: parseStringArray(row.participationModes),
    activityInterests: parseStringArray(row.activityInterests),
    preferredEventTypes: parseStringArray(row.preferredEventTypes),
    stakePreference: row.stakePreference,
    proofPreference: row.proofPreference,
    socialCirclePreference: row.socialCirclePreference,
    notificationPreference: row.notificationPreference,
    locationPreference: row.locationPreference,
  };
}

const profileSelect = {
  id: true,
  userId: true,
  name: true,
  username: true,
  avatarUrl: true,
  bio: true,
  onboardingCompleted: true,
  onboardingCompletedAt: true,
  primaryGoal: true,
  accountabilityStyle: true,
  participationModes: true,
  activityInterests: true,
  preferredEventTypes: true,
  stakePreference: true,
  proofPreference: true,
  socialCirclePreference: true,
  notificationPreference: true,
  locationPreference: true,
} as const;

export async function getMeProfilePayload(userId: string): Promise<Result<MeProfilePayload>> {
  let profile = await prisma.profile.findUnique({
    where: { userId },
    select: profileSelect,
  });
  if (!profile) {
    profile = await prisma.profile.create({
      data: {
        userId,
        onboardingCompleted: false,
      },
      select: profileSelect,
    });
  }
  return ok({
    userId,
    onboardingCompleted: profile.onboardingCompleted,
    profile: mapProfile(profile),
  });
}

export async function patchMeProfile(
  userId: string,
  input: unknown,
): Promise<Result<MeProfilePayload>> {
  const parsed = updateMyProfileRequestSchema.safeParse(input);
  if (!parsed.success) {
    const flat = parsed.error.flatten();
    const msg =
      Object.entries(flat.fieldErrors)
        .flatMap(([, msgs]) => msgs ?? [])
        .join("; ") ||
      flat.formErrors.join("; ") ||
      "Invalid profile update";
    return err(msg, "VALIDATION_ERROR");
  }
  const d = parsed.data;

  const existing = await getMeProfilePayload(userId);
  if (!existing.success) return existing;

  const data: Prisma.ProfileUpdateInput = {};

  if (d.name !== undefined) {
    const t = d.name.trim();
    data.name = t === "" ? null : t;
  }
  if (d.username !== undefined) {
    const other = await prisma.profile.findFirst({
      where: { username: d.username, NOT: { userId } },
      select: { id: true },
    });
    if (other) {
      return err("That username is already taken. Pick another.", "USERNAME_CONFLICT");
    }
    data.username = d.username;
  }
  if (d.bio !== undefined) {
    const t = d.bio.trim();
    data.bio = t === "" ? null : t;
  }
  if (d.primaryGoal !== undefined) data.primaryGoal = d.primaryGoal;
  if (d.accountabilityStyle !== undefined) {
    data.accountabilityStyle = d.accountabilityStyle;
  }
  if (d.participationModes !== undefined) {
    data.participationModes = d.participationModes as unknown as Prisma.InputJsonValue;
  }
  if (d.activityInterests !== undefined) {
    data.activityInterests = d.activityInterests as unknown as Prisma.InputJsonValue;
  }
  if (d.preferredEventTypes !== undefined) {
    data.preferredEventTypes = d.preferredEventTypes as unknown as Prisma.InputJsonValue;
  }
  if (d.stakePreference !== undefined) data.stakePreference = d.stakePreference;
  if (d.proofPreference !== undefined) data.proofPreference = d.proofPreference;
  if (d.socialCirclePreference !== undefined) {
    data.socialCirclePreference = d.socialCirclePreference;
  }
  if (d.notificationPreference !== undefined) {
    data.notificationPreference = d.notificationPreference;
  }
  if (d.locationPreference !== undefined) {
    data.locationPreference = d.locationPreference;
  }

  try {
    await prisma.profile.update({
      where: { userId },
      data,
    });
  } catch (e) {
    const code =
      typeof e === "object" && e !== null && "code" in e
        ? (e as { code?: string }).code
        : "";
    if (code === "P2002") {
      return err("That username is already taken. Pick another.", "USERNAME_CONFLICT");
    }
    const msg = e instanceof Error ? e.message : "Failed to update profile";
    return err(msg, "BAD_STATE");
  }

  return getMeProfilePayload(userId);
}

export async function completeMeProfileOnboarding(
  userId: string,
  input: unknown,
): Promise<Result<{ profile: MeProfileDto }>> {
  const parsed = profileOnboardingCompleteRequestSchema.safeParse(input);
  if (!parsed.success) {
    const flat = parsed.error.flatten();
    const msg =
      Object.entries(flat.fieldErrors)
        .flatMap(([, msgs]) => msgs ?? [])
        .join("; ") || "Invalid onboarding payload";
    return err(msg, "VALIDATION_ERROR");
  }
  const d = parsed.data;
  const usernameNorm = d.username;

  const other = await prisma.profile.findFirst({
    where: { username: usernameNorm, NOT: { userId } },
    select: { id: true },
  });
  if (other) {
    return err("That username is already taken. Pick another.", "USERNAME_CONFLICT");
  }

  const now = new Date();
  const bioTrim = d.shortBio?.trim() || null;

  const modesJson = d.participationModes as unknown as Prisma.InputJsonValue;
  const interestsJson = d.activityInterests as unknown as Prisma.InputJsonValue;
  const typesJson = d.preferredEventTypes as unknown as Prisma.InputJsonValue;

  try {
    const profile = await prisma.profile.upsert({
      where: { userId },
      create: {
        userId,
        name: d.displayName.trim(),
        username: usernameNorm,
        bio: bioTrim,
        onboardingCompleted: true,
        onboardingCompletedAt: now,
        primaryGoal: d.primaryGoal ?? null,
        accountabilityStyle: d.accountabilityStyle ?? null,
        participationModes: modesJson,
        activityInterests: interestsJson,
        preferredEventTypes: typesJson,
        stakePreference: d.stakePreference ?? null,
        proofPreference: d.proofPreference ?? null,
        socialCirclePreference: d.socialCirclePreference ?? null,
        notificationPreference: d.notificationPreference ?? null,
        locationPreference: d.locationPreference ?? null,
      },
      update: {
        name: d.displayName.trim(),
        username: usernameNorm,
        bio: bioTrim,
        onboardingCompleted: true,
        onboardingCompletedAt: now,
        primaryGoal: d.primaryGoal ?? null,
        accountabilityStyle: d.accountabilityStyle ?? null,
        participationModes: modesJson,
        activityInterests: interestsJson,
        preferredEventTypes: typesJson,
        stakePreference: d.stakePreference ?? null,
        proofPreference: d.proofPreference ?? null,
        socialCirclePreference: d.socialCirclePreference ?? null,
        notificationPreference: d.notificationPreference ?? null,
        locationPreference: d.locationPreference ?? null,
      },
      select: profileSelect,
    });
    return ok({ profile: mapProfile(profile) });
  } catch (e) {
    const code = typeof e === "object" && e !== null && "code" in e ? (e as { code?: string }).code : "";
    if (code === "P2002") {
      return err("That username is already taken. Pick another.", "USERNAME_CONFLICT");
    }
    const msg = e instanceof Error ? e.message : "Failed to save profile";
    return err(msg, "BAD_STATE");
  }
}
