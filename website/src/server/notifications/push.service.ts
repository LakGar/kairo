/**
 * Expo Push Notification API (HTTPS) — no extra npm dependency.
 *
 * @see https://docs.expo.dev/push-notifications/sending-notifications/
 *
 * TODO: receipt / ticket checking; batch chunking (100+); rate limiting; retries with backoff;
 * honor per-user notification preferences from Profile + local prefs once wired.
 */
import { prisma } from "@/lib/db";
import { isLikelyExpoPushToken } from "@kairo/shared";

const EXPO_PUSH_SEND_URL = "https://exp.host/--/api/v2/push/send";

export type ExpoPushMessage = {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
};

type ExpoPushTicket = {
  status: "ok" | "error";
  id?: string;
  message?: string;
  details?: { error?: string };
};

type ExpoPushResponse = {
  data?: ExpoPushTicket[];
};

function logPushFailure(context: string, ticket: ExpoPushTicket, to: string) {
  const detail = ticket.message ?? ticket.details?.error ?? "unknown";
  console.warn(`[push] ${context} failed for ${to.slice(0, 24)}…: ${detail}`);
}

export async function sendExpoPushNotification(message: ExpoPushMessage): Promise<boolean> {
  if (!isLikelyExpoPushToken(message.to)) {
    console.warn("[push] rejected send: invalid Expo push token shape");
    return false;
  }

  try {
    const res = await fetch(EXPO_PUSH_SEND_URL, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify([message]),
    });

    if (!res.ok) {
      const t = await res.text().catch(() => "");
      console.warn(`[push] HTTP ${res.status}: ${t.slice(0, 200)}`);
      return false;
    }

    const json = (await res.json()) as ExpoPushResponse;
    const ticket = json.data?.[0];
    if (!ticket || ticket.status !== "ok") {
      logPushFailure("send", ticket ?? { status: "error", message: "no ticket" }, message.to);
      return false;
    }
    return true;
  } catch (e) {
    console.warn("[push] network error", e instanceof Error ? e.message : e);
    return false;
  }
}

/**
 * Sends the same alert to all enabled Expo tokens for a user (best-effort; no batching yet).
 */
export async function sendPushToUser(
  userId: string,
  message: { title: string; body: string; data?: Record<string, unknown> },
): Promise<{ attempted: number; succeeded: number }> {
  const tokens = await prisma.pushToken.findMany({
    where: { userId, enabled: true },
    select: { token: true },
  });

  let succeeded = 0;
  for (const row of tokens) {
    const ok = await sendExpoPushNotification({
      to: row.token,
      title: message.title,
      body: message.body,
      data: message.data,
    });
    if (ok) succeeded += 1;
  }

  return { attempted: tokens.length, succeeded };
}
