import { useCallback, useEffect, useState } from "react";

import {
  createKairoApiFromEnv,
  KairoApiConfigurationError,
  KairoApiError,
  type ApiTeamPublic,
} from "@/src/api";

export function useEventTeams(eventId: string | undefined) {
  const [teams, setTeams] = useState<ApiTeamPublic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!eventId?.trim()) {
      setTeams([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const api = createKairoApiFromEnv();
      const list = await api.listTeams(eventId);
      setTeams(list);
    } catch (e) {
      if (e instanceof KairoApiConfigurationError) {
        setError(e.message);
      } else if (e instanceof KairoApiError) {
        setError(e.message);
      } else {
        setError(e instanceof Error ? e.message : "Could not load teams.");
      }
      setTeams([]);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { teams, loading, error, refresh };
}
