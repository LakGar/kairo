import { StyleSheet, Text, View } from "react-native";

import { onboardingColors } from "../onboarding-tokens";

type Props = {
  title: string;
  body: string;
};

export function OnboardingReviewCard({ title, body }: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{body}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    backgroundColor: onboardingColors.surface,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    gap: 6,
  },
  title: {
    color: onboardingColors.textMuted,
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  body: {
    color: onboardingColors.textPrimary,
    fontSize: 15,
    fontFamily: "Inter_500Medium",
    lineHeight: 22,
  },
});
