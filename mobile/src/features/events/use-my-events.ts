import { useUser } from "@clerk/expo";
import { useCallback, useEffect, useState } from "react";

import {
  createKairoApiFromEnv,
  getLinkedKairoUserId,
  KairoApiConfigurationError,
  KairoApiError,
  type ApiHomeEventSummary,
  type ApiMeEventsPayload,
} from "@/src/api";

import type { EventsErrorState } from "./use-upcoming-events";

export function useMyEvents() {
  const { user } = useUser();
  const [hosting, setHosting] = useState<ApiHomeEventSummary[]>([]);
  const [attending, setAttending] = useState<ApiHomeEventSummary[]>([]);
  const [homePayload, setHomePayload] = useState<ApiMeEventsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<EventsErrorState | null>(null);

  const load = useCallback(async (mode: "initial" | "refresh") => {
    if (mode === "initial") setLoading(true);
    else setRefreshing(true);
    setError(null);
    try {
      const api = createKairoApiFromEnv({ userId: getLinkedKairoUserId(user) });
      const data = await api.getMyEvents();
      setHomePayload(data);
      setHosting(data.hosting);
      setAttending(data.attending);
    } catch (e) {
      if (e instanceof KairoApiConfigurationError) {
        setError({
          message:
            "Set EXPO_PUBLIC_API_URL in mobile/.env (see .env.example) and restart Expo.",
          code: "CONFIG",
        });
      } else if (e instanceof KairoApiError) {
        setError({ message: e.message, code: e.code });
      } else {
        setError({
          message: e instanceof Error ? e.message : "Could not load your events.",
        });
      }
      setHosting([]);
      setAttending([]);
      setHomePayload(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    void load("initial");
  }, [load]);

  const refresh = useCallback(() => load("refresh"), [load]);

  return { hosting, attending, homePayload, loading, refreshing, error, refresh };
}
