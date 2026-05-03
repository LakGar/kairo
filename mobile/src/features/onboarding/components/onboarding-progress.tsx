import { StyleSheet, Text, View } from "react-native";

import { onboardingColors } from "../onboarding-tokens";

type Props = {
  currentIndex: number;
  total: number;
};

export function OnboardingProgress({ currentIndex, total }: Props) {
  return (
    <View style={styles.wrap} accessibilityRole="progressbar">
      <View style={styles.track}>
        {Array.from({ length: total }).map((_, i) => {
          const done = i <= currentIndex;
          return (
            <View
              key={i}
              style={[styles.segment, done && styles.segmentActive]}
            />
          );
        })}
      </View>
      <Text style={styles.caption}>
        Step {currentIndex + 1} of {total}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 8,
    minWidth: 120,
    alignItems: "flex-end",
  },
  track: {
    flexDirection: "row",
    gap: 4,
    justifyContent: "flex-end",
  },
  segment: {
    width: 22,
    height: 4,
    borderRadius: 2,
    backgroundColor: onboardingColors.surfaceStrong,
  },
  segmentActive: {
    backgroundColor: onboardingColors.accent,
  },
  caption: {
    fontSize: 11,
    color: onboardingColors.textMuted,
    fontFamily: "Inter_500Medium",
  },
});
