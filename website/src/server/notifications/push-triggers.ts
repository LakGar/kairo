/**
 * High-value push triggers (proof + team result). Uses {@link sendPushToUser}.
 *
 * TODO: align `notificationPreference` semantics for `minimal` / `important` vs push-only.
 */
import { prisma } from "@/lib/db";

import { sendPushToUser } from "@/server/notifications/push.service";

/** When clearly “off”, skip push. Null/empty/unknown → still send (product TODO). */
export function profileAllowsPush(pref: string | null | undefined): boolean {
  if (pref == null) return true;
  const p = pref.trim().toLowerCase();
  if (p === "") return true;
  if (p === "mostly-off") return false;
  if (p === "off" || p === "none") return false;
  return true;
}

export async function getTeamMemberUserIds(teamId: string): Promise<string[]> {
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    select: {
      captainId: true,
      members: { select: { userId: true } },
    },
  });
  if (!team) return [];
  const ids = new Set<string>();
  if (team.captainId) ids.add(team.captainId);
  for (const m of team.members) ids.add(m.userId);
  return [...ids];
}

/**
 * Dedupes user IDs, skips users who opt out (see {@link profileAllowsPush}), then
 * best-effort {@link sendPushToUser} per user. Does not throw.
 */
export async function sendPushToUsersBestEffort(
  userIds: string[],
  message: { title: string; body: string; data?: Record<string, unknown> },
): Promise<void> {
  const unique = [...new Set(userIds)].filter(Boolean);
  if (unique.length === 0) return;

  let profiles: { userId: string; notificationPreference: string | null }[];
  try {
    profiles = await prisma.profile.findMany({
      where: { userId: { in: unique } },
      select: { userId: true, notificationPreference: true },
    });
  } catch (e) {
    console.warn("[push] profile batch load failed", e instanceof Error ? e.message : e);
    return;
  }

  const prefByUser = new Map(profiles.map((p) => [p.userId, p.notificationPreference]));

  for (const uid of unique) {
    if (!profileAllowsPush(prefByUser.get(uid))) continue;
    try {
      await sendPushToUser(uid, message);
    } catch (e) {
      console.warn("[push] sendPushToUser threw", uid, e instanceof Error ? e.message : e);
    }
  }
}
