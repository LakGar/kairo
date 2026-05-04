import { useAuth } from "@clerk/expo";
import { Redirect, Stack } from "expo-router";

import { useBootstrapKairoUser } from "@/src/features/auth/use-bootstrap-kairo-user";

/**
 * Signed-in shell: Stack with `(home)` (JS Tabs + floating blur bar for Home / Discover / Chat),
 * plus `settings` (avatar only), `profile` redirect, `create`, and `events`.
 */
export default function TabsStackLayout() {
  const { isSignedIn, isLoaded } = useAuth();
  useBootstrapKairoUser();

  if (!isLoaded) {
    return null;
  }

  if (!isSignedIn) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(home)" />
      <Stack.Screen name="settings" />
      <Stack.Screen name="profile" />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="create" />
      <Stack.Screen name="events" />
      <Stack.Screen
        name="proof-capture"
        options={{ headerShown: false, presentation: "modal" }}
      />
      <Stack.Screen
        name="personal-commit-onboarding"
        options={{ presentation: "fullScreenModal", headerShown: false }}
      />
    </Stack>
  );
}
