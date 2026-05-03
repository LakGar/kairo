import { StyleSheet, View } from "react-native";

import { onboardingColors } from "../onboarding-tokens";

type Props = {
  currentIndex: number;
  total: number;
};

/** Wide active pill + circular dots (carousel-style). */
export function OnboardingWelcomeDots({ currentIndex, total }: Props) {
  return (
    <View style={styles.row} accessibilityRole="progressbar">
      {Array.from({ length: total }).map((_, i) => {
        const active = i === currentIndex;
        return active ? (
          <View key={i} style={styles.pill} />
        ) : (
          <View key={i} style={styles.dot} />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginTop: 22,
    marginBottom: 12,
  },
  pill: {
    width: 44,
    height: 8,
    borderRadius: 4,
    backgroundColor: onboardingColors.white,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.28)",
  },
});
