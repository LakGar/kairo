import * as Notifications from "expo-notifications";
import type { Href } from "expo-router";
import { useRouter } from "expo-router";
import { useEffect } from "react";

import {
  buildEventDetailFocusHref,
  type EventProofFocus,
} from "@/src/features/home/event-proof-nav";

let didReadInitialNotificationResponse = false;

function parseString(v: unknown): string | undefined {
  if (typeof v === "string" && v.trim()) return v.trim();
  return undefined;
}

function navigateFromPushData(
  router: { push: (href: Href) => void },
  data: Record<string, unknown>,
) {
  const eventId = parseString(data.eventId);
  if (!eventId) {
    console.info("[push] tap ignored: missing eventId", data);
    return;
  }

  const focusRaw = parseString(data.focus);
  const focus: EventProofFocus =
    focusRaw === "proof" || focusRaw === "organizer" || focusRaw === "result"
      ? focusRaw
      : "organizer";

  const href = buildEventDetailFocusHref(eventId, {
    focus,
    proofSubmissionId: parseString(data.proofSubmissionId),
    matchId: parseString(data.matchId),
  });

  try {
    router.push(href);
  } catch (e) {
    console.warn("[push] router.push failed", e, href);
  }
}

/** Handles notification opens: cold start (once) + in-app taps. */
export function usePushNotificationResponseNavigation(enabled: boolean) {
  const router = useRouter();

  useEffect(() => {
    if (!enabled) return;

    const onResponse = (response: Notifications.NotificationResponse) => {
      const raw = response.notification.request.content.data;
      const data =
        raw && typeof raw === "object" && !Array.isArray(raw)
          ? (raw as Record<string, unknown>)
          : {};
      navigateFromPushData(router, data);
    };

    const sub = Notifications.addNotificationResponseReceivedListener(onResponse);

    void (async () => {
      if (didReadInitialNotificationResponse) return;
      didReadInitialNotificationResponse = true;
      try {
        const last = await Notifications.getLastNotificationResponseAsync();
        if (last) onResponse(last);
      } catch (e) {
        console.warn("[push] getLastNotificationResponseAsync", e);
      }
    })();

    return () => sub.remove();
  }, [enabled, router]);
}
