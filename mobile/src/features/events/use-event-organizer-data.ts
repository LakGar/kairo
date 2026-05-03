import { useCallback, useEffect, useState } from "react";

import {
  createKairoApiFromEnv,
  KairoApiConfigurationError,
  KairoApiError,
  type ApiMatchPublic,
  type ApiProofPrompt,
  type ApiProofSubmission,
} from "@/src/api";

export function useEventOrganizerData(eventId: string | undefined, enabled: boolean) {
  const [matches, setMatches] = useState<ApiMatchPublic[]>([]);
  const [prompts, setPrompts] = useState<ApiProofPrompt[]>([]);
  const [submissions, setSubmissions] = useState<ApiProofSubmission[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!eventId || !enabled) {
      setMatches([]);
      setPrompts([]);
      setSubmissions([]);
      setError(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const api = createKairoApiFromEnv();
      const [m, p, s] = await Promise.all([
        api.listMatches(eventId),
        api.listProofPrompts(eventId),
        api.listProofSubmissions(eventId),
      ]);
      setMatches(m);
      setPrompts(p);
      setSubmissions(s);
    } catch (e) {
      if (e instanceof KairoApiConfigurationError) {
        setError(e.message);
      } else if (e instanceof KairoApiError) {
        setError(e.message);
      } else {
        setError(e instanceof Error ? e.message : "Could not load organizer data.");
      }
      setMatches([]);
      setPrompts([]);
      setSubmissions([]);
    } finally {
      setLoading(false);
    }
  }, [eventId, enabled]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { matches, prompts, submissions, loading, error, refresh };
}
