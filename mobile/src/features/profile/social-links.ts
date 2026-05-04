import type { KairoSocialLinks } from "@/src/features/profile/kairo-profile-metadata";

function strip(s: string): string {
  return s.trim().replace(/^@+/, "");
}

/** Returns a canonical https URL for opening in the browser, or null if empty / invalid. */
export function socialLinkUrl(
  key: keyof KairoSocialLinks,
  raw: string | undefined,
): string | null {
  const v = raw?.trim();
  if (!v) return null;
  if (/^https?:\/\//i.test(v)) return v;
  const path = strip(v);
  if (!path) return null;
  switch (key) {
    case "instagram":
      return `https://instagram.com/${path.replace(/^\/+/, "")}`;
    case "x":
      return `https://x.com/${path.replace(/^\/+/, "")}`;
    case "youtube":
      if (path.startsWith("channel/") || path.startsWith("c/") || path.startsWith("@")) {
        return `https://youtube.com/${path}`;
      }
      return `https://youtube.com/@${path.replace(/^@+/, "")}`;
    case "snapchat":
      return `https://www.snapchat.com/add/${path}`;
    case "tiktok":
      return `https://www.tiktok.com/@${path.replace(/^@+/, "")}`;
    case "linkedin":
      if (path.includes("linkedin.com")) return `https://${path.replace(/^https?:\/\//i, "")}`;
      return `https://www.linkedin.com/in/${path.replace(/^\/+/, "")}`;
    case "website":
      return path.includes(".") ? `https://${path.replace(/^https?:\/\//i, "")}` : null;
    default:
      return null;
  }
}
