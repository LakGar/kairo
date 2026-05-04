import type { Href } from "expo-router";

export type EventProofFocus = "proof" | "organizer" | "result";

/** Query params consumed by `/(tabs)/events/[eventId]` for Home → proof / team-result flows. */
export function buildEventDetailFocusHref(
  eventId: string,
  opts: {
    focus: EventProofFocus;
    proofSubmissionId?: string;
    matchId?: string;
  },
): Href {
  const q = new URLSearchParams();
  q.set("focus", opts.focus);
  if (opts.proofSubmissionId?.trim()) q.set("proofSubmissionId", opts.proofSubmissionId.trim());
  if (opts.matchId?.trim()) q.set("matchId", opts.matchId.trim());
  const qs = q.toString();
  return `/(tabs)/events/${encodeURIComponent(eventId)}${qs ? `?${qs}` : ""}` as Href;
}

export function pickSearchParam(
  v: string | string[] | undefined,
): string | undefined {
  if (v === undefined) return undefined;
  return Array.isArray(v) ? v[0] : v;
}
