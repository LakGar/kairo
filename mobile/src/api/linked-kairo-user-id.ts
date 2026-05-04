type ClerkUserLike = {
  unsafeMetadata?: unknown;
  publicMetadata?: unknown;
};

function readMetaString(meta: unknown, key: string): string {
  if (typeof meta !== "object" || meta === null) return "";
  const v = (meta as Record<string, unknown>)[key];
  return typeof v === "string" ? v.trim() : "";
}

/**
 * Prisma `User.id` for API `x-kairo-user-id`.
 * Set on the Clerk user as `publicMetadata.kairoUserId` or `unsafeMetadata.kairoUserId`
 * when the account is linked to Kairo’s database.
 */
export function getLinkedKairoUserId(user: ClerkUserLike | null | undefined): string | undefined {
  if (!user) return undefined;
  const fromUnsafe = readMetaString(user.unsafeMetadata, "kairoUserId");
  const fromPublic = readMetaString(user.publicMetadata, "kairoUserId");
  const id = fromUnsafe || fromPublic;
  return id.length > 0 ? id : undefined;
}
