import { useAuth, useUser } from "@clerk/expo";
import { useCallback, useEffect, useState } from "react";

import { createKairoApiFromEnv } from "@/src/api";
import { resolveActingUserId } from "@/src/api/kairo-client";
import { KairoApiError } from "@/src/api/types";

export type MeProfileOnboardingGate =
  | "unknown"
  | "checking"
  | "needs_onboarding"
  | "ready"
  /** Profile fetch failed after retries — do not block the app. */
  | "unavailable";

const MAX_WAIT_MS = 12_000;
const POLL_MS = 250;

/**
 * Resolves whether the signed-in user has completed server-backed onboarding.
 * Waits for `x-kairo-user-id` (bootstrap) before calling the API.
 */
export function useMeProfileOnboardingGate() {
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const clerkUserId = user?.id ?? null;
  const [gate, setGate] = useState<MeProfileOnboardingGate>("unknown");

  const runCheck = useCallback(async () => {
    if (!isLoaded) {
      setGate("unknown");
      return;
    }
    if (!isSignedIn) {
      setGate("ready");
      return;
    }
    setGate("checking");
    const started = Date.now();
    while (Date.now() - started < MAX_WAIT_MS) {
      const uid = resolveActingUserId();
      if (uid) {
        try {
          const api = createKairoApiFromEnv();
          const p = await api.getMyProfile();
          setGate(p.onboardingCompleted ? "ready" : "needs_onboarding");
          return;
        } catch (e) {
          if (e instanceof KairoApiError && e.httpStatus === 401) {
            await new Promise((r) => setTimeout(r, POLL_MS));
            continue;
          }
          setGate("unavailable");
          return;
        }
      }
      await new Promise((r) => setTimeout(r, POLL_MS));
    }
    setGate("unavailable");
  }, [isLoaded, isSignedIn]);

  useEffect(() => {
    void runCheck();
  }, [runCheck, clerkUserId]);

  return { gate, recheck: runCheck };
}
