import { Pressable, StyleSheet, Text, View } from "react-native";

import { onboardingColors } from "../onboarding-tokens";

type Props = {
  primaryLabel: string;
  onPrimary: () => void;
  primaryDisabled?: boolean;
  secondaryHint?: string;
};

export function OnboardingNavigation({
  primaryLabel,
  onPrimary,
  primaryDisabled,
  secondaryHint,
}: Props) {
  return (
    <View style={styles.wrap}>
      {secondaryHint ? (
        <Text style={styles.hint}>{secondaryHint}</Text>
      ) : null}
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
});
