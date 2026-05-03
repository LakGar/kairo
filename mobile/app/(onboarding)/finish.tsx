import { Redirect } from "expo-router";

/**
 * Legacy route: onboarding is a single flow in `index.tsx`.
 * Deep links to `/(onboarding)/finish` land back on the main onboarding entry.
 */
export default function OnboardingFinishRedirect() {
  return <Redirect href="/(onboarding)" />;
}
