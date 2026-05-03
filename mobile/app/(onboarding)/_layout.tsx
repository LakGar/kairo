import { useAuth } from "@clerk/expo";
import { Redirect, Stack } from "expo-router";

export default function OnboardingLayout() {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) {
    return null;
  }

  // In __DEV__, allow unsigned access so onboarding UI can be designed without signing in.
  // Production builds still require Clerk before showing this stack.
  if (!isSignedIn && !__DEV__) {
    return <Redirect href="/(auth)/sign-in" />;
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
