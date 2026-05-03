import { useCallback, useEffect, useState } from "react";

import {
  createKairoApiFromEnv,
  KairoApiConfigurationError,
  KairoApiError,
  type ApiMatchPublic,
  type ApiProofPrompt,
  type ApiProofSubmission,
} from "@/src/api";

export function useEventProofSubmitData(eventId: string | undefined, enabled: boolean) {
  const [prompts, setPrompts] = useState<ApiProofPrompt[]>([]);
  const [matches, setMatches] = useState<ApiMatchPublic[]>([]);
  const [submissions, setSubmissions] = useState<ApiProofSubmission[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!eventId || !enabled) {
      setPrompts([]);
      setMatches([]);
      setSubmissions([]);
      setError(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const api = createKairoApiFromEnv();
      const [p, m, s] = await Promise.all([
        api.listProofPrompts(eventId),
        api.listMatches(eventId),
        api.listProofSubmissions(eventId),
      ]);
      setPrompts(p);
      setMatches(m);
      setSubmissions(s);
    } catch (e) {
      if (e instanceof KairoApiConfigurationError) {
        setError(e.message);
      } else if (e instanceof KairoApiError) {
        setError(e.message);
      } else {
        setError(e instanceof Error ? e.message : "Could not load proof data.");
      }
      setPrompts([]);
      setMatches([]);
      setSubmissions([]);
    } finally {
      setLoading(false);
    }
  }, [eventId, enabled]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { prompts, matches, submissions, loading, error, refresh };
}
