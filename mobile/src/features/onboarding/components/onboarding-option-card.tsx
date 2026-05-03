import { Pressable, StyleSheet, Text, View } from "react-native";

import { onboardingColors } from "../onboarding-tokens";

type Props = {
  label: string;
  description?: string;
  selected: boolean;
  onPress: () => void;
};

export function OnboardingOptionCard({
  label,
  description,
  selected,
  onPress,
}: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        selected && styles.cardSelected,
        pressed && styles.cardPressed,
      ]}
    >
      <View style={styles.row}>
        <View style={[styles.dot, selected && styles.dotSelected]} />
        <View style={styles.textCol}>
          <Text style={styles.label}>{label}</Text>
          {description ? (
            <Text style={styles.description}>{description}</Text>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: onboardingColors.surface,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  cardSelected: {
    borderColor: "rgba(255,106,42,0.45)",
    backgroundColor: "rgba(255,106,42,0.1)",
  },
  cardPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.995 }],
  },
  row: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 5,
    backgroundColor: onboardingColors.surfaceStrong,
  },
  dotSelected: {
    backgroundColor: onboardingColors.accent,
  },
  textCol: {
    flex: 1,
    gap: 4,
  },
  label: {
    color: onboardingColors.textPrimary,
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    lineHeight: 22,
  },
  description: {
    color: onboardingColors.textSecondary,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
  },
});
