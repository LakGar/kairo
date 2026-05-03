import { useCallback, useEffect, useState } from "react";

import {
  createKairoApiFromEnv,
  KairoApiConfigurationError,
  KairoApiError,
  type ApiEventPublic,
} from "@/src/api";

import type { EventsErrorState } from "./use-upcoming-events";

export function useEventDetail(eventId: string | undefined) {
  const [event, setEvent] = useState<ApiEventPublic | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<EventsErrorState | null>(null);

  const load = useCallback(async () => {
    if (!eventId) {
      setError({ message: "Missing event id." });
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const api = createKairoApiFromEnv();
      const data = await api.getEvent(eventId);
      setEvent(data);
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
          message: e instanceof Error ? e.message : "Could not load event.",
        });
      }
      setEvent(null);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    void load();
  }, [load]);

  return { event, loading, error, reload: load };
}
