import { useEffect, useRef } from "react";

import type { MeProfileOnboardingGate } from "@/src/features/auth/use-me-profile-onboarding-gate";

import { registerPushTokenWithBackend } from "./register-push-token";

/**
 * One silent registration attempt after sign-in and onboarding gate is ready.
 * Does not prompt for permission (`requestPermission: false`).
 */
export function useRegisterPushTokenSession(
  isSignedIn: boolean,
  gate: MeProfileOnboardingGate,
) {
  const attempted = useRef(false);

  useEffect(() => {
    if (!isSignedIn || gate !== "ready") return;
    if (attempted.current) return;
    attempted.current = true;
    void registerPushTokenWithBackend({ requestPermission: false });
  }, [isSignedIn, gate]);
}
