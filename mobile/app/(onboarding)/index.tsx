import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";
import { SpaceGrotesk_700Bold, useFonts } from "@expo-google-fonts/space-grotesk";
import { ActivityIndicator, StyleSheet, View } from "react-native";

import { OnboardingShell } from "@/src/features/onboarding/components/onboarding-shell";
import { OnboardingProvider } from "@/src/features/onboarding/hooks/use-onboarding-flow";
import { onboardingColors } from "@/src/features/onboarding/onboarding-tokens";

export default function OnboardingScreen() {
  const [fontsLoaded] = useFonts({
    SpaceGrotesk_700Bold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  if (!fontsLoaded) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={onboardingColors.accent} />
      </View>
    );
  }

  return (
    <OnboardingProvider>
      <OnboardingShell />
    </OnboardingProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: onboardingColors.background,
  },
});
