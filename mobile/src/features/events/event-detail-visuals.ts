import type { ApiEventPublic } from "@/src/api";

function hashId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) {
    h = (h * 31 + id.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

/** Vertical gradient stops (top → bottom) tuned like poster-driven event UIs. */
export const EVENT_DETAIL_GRADIENTS: readonly (readonly [string, string])[] = [
  ["#5b21b6", "#000000"],
  ["#b91c1c", "#000000"],
  ["#0e7490", "#000000"],
  ["#7c3aed", "#000000"],
];

export function gradientColorsForEvent(eventId: string): readonly [string, string] {
  const i = hashId(eventId) % EVENT_DETAIL_GRADIENTS.length;
  const pair = EVENT_DETAIL_GRADIENTS[i]!;
  return [pair[0], pair[1]];
}

/**
 * Hero cover image URL when the API exposes artwork (e.g. `coverImageUrl`).
 * Returns `null` until then — the screen uses the activity gradient only.
 */
export function heroImageUrlForEvent(event: ApiEventPublic): string | null {
  const u = event.coverImageUrl?.trim();
  if (!u || !/^https:\/\//i.test(u)) return null;
  return u;
}

export function categoryIconForActivity(activityType: string): string {
  const k = activityType.toLowerCase();
  if (k.includes("music") || k.includes("party")) return "musical-notes-outline";
  if (k.includes("run") || k.includes("fit") || k.includes("yoga")) return "fitness-outline";
  if (k.includes("ball") || k.includes("sport") || k.includes("pickle"))
    return "football-outline";
  return "calendar-outline";
}

export function formatEventEntryFeeLine(event: ApiEventPublic): string {
  if (event.entryFeeCents == null || event.entryFeeCents <= 0) {
    return "Free event";
  }
  const amount = event.entryFeeCents / 100;
  const cur = (event.currency || "USD").toUpperCase();
  if (cur === "USD") {
    const s = amount % 1 === 0 ? amount.toFixed(0) : amount.toFixed(2);
    return `From $${s}`;
  }
  const s = amount % 1 === 0 ? amount.toFixed(0) : amount.toFixed(2);
  return `From ${cur} ${s}`;
}
