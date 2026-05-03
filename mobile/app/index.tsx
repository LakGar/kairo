import { Redirect } from "expo-router";

/**
 * Explicit `/` entry so the app opens on onboarding while that UI is in focus.
 * (The former marketing splash lives at `/(auth)/landing`.)
 */
export default function RootIndex() {
  return <Redirect href="/(onboarding)" />;
}
