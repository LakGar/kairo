import type { Prisma } from "@prisma/client";
import { UserRole } from "@prisma/client";

import { prisma } from "@/lib/db";
import { err, ok, type Result } from "@/src/lib/result";
import {
  authBootstrapRequestSchema,
  type AuthBootstrapRequestInput,
} from "@kairo/shared";

export type BootstrapUserPayload = {
  userId: string;
  clerkUserId: string;
  email: string;
  profile: {
    id: string;
    userId: string;
    name: string | null;
    username: string | null;
    avatarUrl: string | null;
    bio: string | null;
  } | null;
};

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function mapPayload(
  u: {
    id: string;
    email: string;
    clerkUserId: string | null;
    profile: {
      id: string;
      userId: string;
      name: string | null;
      username: string | null;
      avatarUrl: string | null;
      bio: string | null;
    } | null;
  },
  fallbackClerkId: string,
): BootstrapUserPayload {
  return {
    userId: u.id,
    clerkUserId: u.clerkUserId ?? fallbackClerkId,
    email: u.email,
    profile: u.profile
      ? {
          id: u.profile.id,
          userId: u.profile.userId,
          name: u.profile.name,
          username: u.profile.username,
          avatarUrl: u.profile.avatarUrl,
          bio: u.profile.bio,
        }
      : null,
  };
}

async function upsertProfileTx(
  tx: Prisma.TransactionClient,
  userId: string,
  d: AuthBootstrapRequestInput,
) {
  const name =
    d.name === undefined || d.name === null ? undefined : d.name.trim() || null;
  const avatarUrl =
    d.avatarUrl === undefined || d.avatarUrl === null
      ? undefined
      : d.avatarUrl.trim() || null;
  const usernameRaw =
    d.username === undefined || d.username === null
      ? undefined
      : d.username.trim() || null;

  let username: string | null | undefined = usernameRaw;
  if (usernameRaw) {
    const taken = await tx.profile.findFirst({
      where: { username: usernameRaw, NOT: { userId } },
    });
    if (taken) username = undefined;
  }

  const existing = await tx.profile.findUnique({ where: { userId } });
  if (existing) {
    await tx.profile.update({
      where: { userId },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(avatarUrl !== undefined ? { avatarUrl } : {}),
        ...(username !== undefined ? { username } : {}),
      },
    });
  } else {
    await tx.profile.create({
      data: {
        userId,
        name: name ?? null,
        username: username ?? null,
        avatarUrl: avatarUrl ?? null,
      },
    });
  }
}

/**
 * Idempotent Clerk → Prisma user + profile upsert.
 * TODO(production): Verify Clerk JWT / session before trusting `input`; current contract is dev/staging only.
 */
export async function bootstrapClerkUser(
  input: unknown,
): Promise<Result<BootstrapUserPayload>> {
  const parsed = authBootstrapRequestSchema.safeParse(input);
  if (!parsed.success) {
    const flat = parsed.error.flatten();
    const msg =
      Object.entries(flat.fieldErrors)
        .flatMap(([, msgs]) => msgs ?? [])
        .join("; ") || "Invalid bootstrap body";
    return err(msg, "VALIDATION_ERROR");
  }
  const d = parsed.data;
  const emailNorm = normalizeEmail(d.email);

  try {
    const byClerk = await prisma.user.findUnique({
      where: { clerkUserId: d.clerkUserId },
      include: { profile: true },
    });
    if (byClerk) {
      if (normalizeEmail(byClerk.email) !== emailNorm) {
        const emailOwner = await prisma.user.findUnique({ where: { email: emailNorm } });
        if (emailOwner && emailOwner.id !== byClerk.id) {
          return err("Email already in use by another account", "CONFLICT");
        }
      }
      await prisma.$transaction(async (tx) => {
        await tx.user.update({
          where: { id: byClerk.id },
          data: { email: emailNorm },
        });
        await upsertProfileTx(tx, byClerk.id, d);
      });
      const refreshed = await prisma.user.findUnique({
        where: { id: byClerk.id },
        include: { profile: true },
      });
      if (!refreshed) return err("User missing after update", "BAD_STATE");
      return ok(mapPayload(refreshed, d.clerkUserId));
    }

    const byEmail = await prisma.user.findUnique({
      where: { email: emailNorm },
      include: { profile: true },
    });
    if (byEmail) {
      if (byEmail.clerkUserId && byEmail.clerkUserId !== d.clerkUserId) {
        return err("This email is linked to another sign-in account", "CONFLICT");
      }
      await prisma.$transaction(async (tx) => {
        await tx.user.update({
          where: { id: byEmail.id },
          data: { clerkUserId: d.clerkUserId },
        });
        await upsertProfileTx(tx, byEmail.id, d);
      });
      const refreshed = await prisma.user.findUnique({
        where: { id: byEmail.id },
        include: { profile: true },
      });
      if (!refreshed) return err("User missing after update", "BAD_STATE");
      return ok(mapPayload(refreshed, d.clerkUserId));
    }

    const created = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: emailNorm,
          clerkUserId: d.clerkUserId,
          role: UserRole.USER,
        },
      });
      await upsertProfileTx(tx, user.id, d);
      return tx.user.findUnique({
        where: { id: user.id },
        include: { profile: true },
      });
    });
    if (!created) return err("Failed to create user", "BAD_STATE");
    return ok(mapPayload(created, d.clerkUserId));
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Bootstrap failed";
    return err(msg, "BAD_STATE");
  }
}
