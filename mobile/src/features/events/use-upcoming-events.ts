import { useCallback, useEffect, useState } from "react";

import {
  createKairoApiFromEnv,
  KairoApiConfigurationError,
  KairoApiError,
  type ApiEventPublic,
} from "@/src/api";

export type EventsErrorState = {
  message: string;
  code?: string;
};

export function useUpcomingEvents() {
  const [events, setEvents] = useState<ApiEventPublic[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<EventsErrorState | null>(null);

  const load = useCallback(async (mode: "initial" | "refresh") => {
    if (mode === "initial") setLoading(true);
    else setRefreshing(true);
    setError(null);
    try {
      const api = createKairoApiFromEnv();
      const list = await api.listUpcomingEvents();
      setEvents(list);
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
          message: e instanceof Error ? e.message : "Could not load events.",
        });
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load("initial");
  }, [load]);

  const refresh = useCallback(() => load("refresh"), [load]);

  return { events, loading, refreshing, error, refresh };
}
