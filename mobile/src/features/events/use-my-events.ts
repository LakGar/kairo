import { useCallback, useEffect, useState } from "react";

import {
  createKairoApiFromEnv,
  KairoApiConfigurationError,
  KairoApiError,
  type ApiEventPublic,
} from "@/src/api";

import type { EventsErrorState } from "./use-upcoming-events";

export function useMyEvents() {
  const [hosting, setHosting] = useState<ApiEventPublic[]>([]);
  const [attending, setAttending] = useState<ApiEventPublic[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<EventsErrorState | null>(null);

  const load = useCallback(async (mode: "initial" | "refresh") => {
    if (mode === "initial") setLoading(true);
    else setRefreshing(true);
    setError(null);
    try {
      const api = createKairoApiFromEnv();
      const data = await api.getMyEvents();
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
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load("initial");
  }, [load]);

  const refresh = useCallback(() => load("refresh"), [load]);

  return { hosting, attending, loading, refreshing, error, refresh };
}
