import { useAuth } from "@clerk/expo";
import type { Href } from "expo-router";
import { Redirect, Stack } from "expo-router";
import { ActivityIndicator, StyleSheet, View } from "react-native";

import { useBootstrapKairoUser } from "@/src/features/auth/use-bootstrap-kairo-user";
import { useMeProfileOnboardingGate } from "@/src/features/auth/use-me-profile-onboarding-gate";

/**
 * Signed-in shell: Stack with `(home)` (JS Tabs + floating blur bar for Home / Discover / Chat),
 * plus `settings` (avatar only), `profile` redirect, `create`, and `events`.
 */
export default function TabsStackLayout() {
  const { isSignedIn, isLoaded } = useAuth();
  useBootstrapKairoUser();
  const { gate } = useMeProfileOnboardingGate();

  if (!isLoaded) {
    return null;
  }

  if (!isSignedIn) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  if (gate === "unknown" || gate === "checking") {
    return (
      <View style={styles.gateLoading}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (gate === "needs_onboarding") {
    return <Redirect href={"/(onboarding)" as Href} />;
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

const styles = StyleSheet.create({
  gateLoading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#000",
  },
});
