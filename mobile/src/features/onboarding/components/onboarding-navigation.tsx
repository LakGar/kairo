import { LinearGradient } from "expo-linear-gradient";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { onboardingColors } from "../onboarding-tokens";

type Props = {
  primaryLabel: string;
  onPrimary: () => void;
  primaryDisabled?: boolean;
  secondaryHint?: string;
  /** Soft gradient pill (welcome step); default is solid light pill from tokens. */
  primaryVisual?: "default" | "gradientPill";
};

export function OnboardingNavigation({
  primaryLabel,
  onPrimary,
  primaryDisabled,
  secondaryHint,
  primaryVisual = "default",
}: Props) {
  const gradient = primaryVisual === "gradientPill";

  return (
    <View style={styles.wrap}>
      {secondaryHint ? (
        <Text style={styles.hint}>{secondaryHint}</Text>
      ) : null}
      {gradient ? (
        <Pressable
          onPress={onPrimary}
          disabled={primaryDisabled}
          style={({ pressed }) => [
            styles.gradientOuter,
            pressed && !primaryDisabled && styles.primaryPressed,
            primaryDisabled && styles.primaryDisabled,
          ]}
        >
          <LinearGradient
            colors={["#BAE6FD", "#38BDF8", "#0284C7"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradientInner}
          >
            <Text style={styles.gradientText}>{primaryLabel}</Text>
          </LinearGradient>
        </Pressable>
      ) : (
        <Pressable
          onPress={onPrimary}
          disabled={primaryDisabled}
          style={({ pressed }) => [
            styles.primary,
            pressed && !primaryDisabled && styles.primaryPressed,
            primaryDisabled && styles.primaryDisabled,
          ]}
        >
          <Text style={styles.primaryText}>{primaryLabel}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 12,
  },
  hint: {
    textAlign: "center",
    color: onboardingColors.textMuted,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
  },
  primary: {
    width: "100%",
    height: 54,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: onboardingColors.white,
  },
  primaryPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
  primaryDisabled: {
    opacity: 0.45,
  },
  primaryText: {
    color: onboardingColors.background,
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
  gradientOuter: {
    width: "100%",
    borderRadius: 999,
    overflow: "hidden",
    shadowColor: "#38BDF8",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 6,
  },
  gradientInner: {
    height: 56,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  gradientText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
});
