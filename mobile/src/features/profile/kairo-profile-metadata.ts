/** Stored on Clerk `unsafeMetadata.kairoProfile` until a dedicated profile API exists. */

export const KAIRO_PROFILE_METADATA_KEY = "kairoProfile" as const;

export type KairoSocialLinks = {
  instagram?: string;
  x?: string;
  youtube?: string;
  snapchat?: string;
  tiktok?: string;
  linkedin?: string;
  website?: string;
};

export type KairoProfileStats = {
  wins?: number;
  netEarningsCents?: number;
};

export type KairoProfileMetadata = {
  bio?: string;
  social?: KairoSocialLinks;
  stats?: KairoProfileStats;
};

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

export function parseKairoProfile(unsafeMetadata: unknown): KairoProfileMetadata {
  if (!isRecord(unsafeMetadata)) return {};
  const raw = unsafeMetadata[KAIRO_PROFILE_METADATA_KEY];
  if (!isRecord(raw)) return {};
  const socialRaw = raw.social;
  const statsRaw = raw.stats;
  const social = isRecord(socialRaw)
    ? {
        instagram: typeof socialRaw.instagram === "string" ? socialRaw.instagram : undefined,
        x: typeof socialRaw.x === "string" ? socialRaw.x : undefined,
        youtube: typeof socialRaw.youtube === "string" ? socialRaw.youtube : undefined,
        snapchat: typeof socialRaw.snapchat === "string" ? socialRaw.snapchat : undefined,
        tiktok: typeof socialRaw.tiktok === "string" ? socialRaw.tiktok : undefined,
        linkedin: typeof socialRaw.linkedin === "string" ? socialRaw.linkedin : undefined,
        website: typeof socialRaw.website === "string" ? socialRaw.website : undefined,
      }
    : undefined;
  const stats = isRecord(statsRaw)
    ? {
        wins: typeof statsRaw.wins === "number" && Number.isFinite(statsRaw.wins) ? statsRaw.wins : undefined,
        netEarningsCents:
          typeof statsRaw.netEarningsCents === "number" && Number.isFinite(statsRaw.netEarningsCents)
            ? statsRaw.netEarningsCents
            : undefined,
      }
    : undefined;
  return {
    bio: typeof raw.bio === "string" ? raw.bio : undefined,
    social,
    stats,
  };
}

function compactSocial(s: KairoSocialLinks | undefined): KairoSocialLinks | undefined {
  if (!s) return undefined;
  const out: KairoSocialLinks = {};
  (Object.keys(s) as (keyof KairoSocialLinks)[]).forEach((k) => {
    const t = s[k]?.trim();
    if (t) out[k] = t;
  });
  return Object.keys(out).length ? out : undefined;
}

/** Merges `next` profile fields into Clerk `unsafeMetadata`, preserving unrelated keys. */
export function mergeKairoProfileIntoUnsafe(
  existingUnsafe: unknown,
  next: KairoProfileMetadata,
): Record<string, unknown> {
  const prevRoot = isRecord(existingUnsafe) ? { ...existingUnsafe } : {};
  const prevProfile = parseKairoProfile(prevRoot);

  const statsOut: KairoProfileStats =
    next.stats !== undefined ? { ...next.stats } : { ...prevProfile.stats };
  if (statsOut.wins != null) {
    if (!Number.isFinite(statsOut.wins) || statsOut.wins < 0) delete statsOut.wins;
    else statsOut.wins = Math.floor(statsOut.wins);
  }
  if (statsOut.netEarningsCents != null) {
    if (!Number.isFinite(statsOut.netEarningsCents) || statsOut.netEarningsCents < 0) {
      delete statsOut.netEarningsCents;
    } else statsOut.netEarningsCents = Math.round(statsOut.netEarningsCents);
  }
  const hasStats = statsOut.wins != null || statsOut.netEarningsCents != null;

  const social = compactSocial({ ...prevProfile.social, ...next.social });
  const bio = next.bio !== undefined ? next.bio.trim() || undefined : prevProfile.bio?.trim() || undefined;

  const profile: KairoProfileMetadata = {
    bio,
    social,
    stats: hasStats ? statsOut : undefined,
  };

  const hasAny = profile.bio || profile.social || profile.stats;
  if (!hasAny) {
    delete prevRoot[KAIRO_PROFILE_METADATA_KEY];
    return prevRoot;
  }
  return { ...prevRoot, [KAIRO_PROFILE_METADATA_KEY]: profile };
}
