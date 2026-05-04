import { useAuth } from "@clerk/expo";
import type { Href } from "expo-router";
import { Redirect, Stack } from "expo-router";
import { ActivityIndicator, StyleSheet, View } from "react-native";

import { useMeProfileOnboardingGate } from "@/src/features/auth/use-me-profile-onboarding-gate";

export default function OnboardingLayout() {
  const { isSignedIn, isLoaded } = useAuth();
  const { gate } = useMeProfileOnboardingGate();

  if (!isLoaded) {
    return null;
  }

  // In __DEV__, allow unsigned access so onboarding UI can be designed without signing in.
  // Production builds still require Clerk before showing this stack.
  if (!isSignedIn && !__DEV__) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  if (isSignedIn && (gate === "unknown" || gate === "checking")) {
    return (
      <View style={styles.gateLoading}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (isSignedIn && gate === "ready") {
    return <Redirect href={"/(tabs)/(home)/dashboard" as Href} />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
      }}
    />
  );
}

const styles = StyleSheet.create({
  gateLoading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F5F5F7",
  },
});
