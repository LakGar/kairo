import * as SecureStore from "expo-secure-store";

const STORE_KEY = "kairo_bootstrap_user_v1";

export type StoredBootstrap = {
  prismaUserId: string;
  clerkUserId: string;
};

/** In-memory copy so `resolveActingUserId` can read without awaiting SecureStore. */
let syncPrismaUserId: string | undefined;

export function getBootstrappedUserIdSync(): string | undefined {
  return syncPrismaUserId;
}

export function setBootstrappedUserIdSync(prismaUserId: string | undefined) {
  syncPrismaUserId = prismaUserId?.trim() || undefined;
}

export async function loadBootstrappedContext(): Promise<StoredBootstrap | null> {
  try {
    const raw = await SecureStore.getItemAsync(STORE_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as Partial<StoredBootstrap>;
    if (
      typeof p.prismaUserId === "string" &&
      p.prismaUserId.trim().length > 0 &&
      typeof p.clerkUserId === "string" &&
      p.clerkUserId.trim().length > 0
    ) {
      return { prismaUserId: p.prismaUserId.trim(), clerkUserId: p.clerkUserId.trim() };
    }
    return null;
  } catch {
    return null;
  }
}

export async function saveBootstrappedContext(ctx: StoredBootstrap) {
  const prismaUserId = ctx.prismaUserId.trim();
  const clerkUserId = ctx.clerkUserId.trim();
  syncPrismaUserId = prismaUserId;
  await SecureStore.setItemAsync(
    STORE_KEY,
    JSON.stringify({ prismaUserId, clerkUserId }),
  );
}

export async function clearBootstrappedUserId() {
  syncPrismaUserId = undefined;
  try {
    await SecureStore.deleteItemAsync(STORE_KEY);
  } catch {
    // ignore missing key
  }
}
