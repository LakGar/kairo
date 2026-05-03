import { Pressable, StyleSheet, Text, View } from "react-native";

import { HomeColors } from "@/src/features/home/home-tokens";

type Props = {
  headline: string;
  lines: readonly string[];
  onReviewPress: () => void;
};

export function ChatPriorityCard({ headline, lines, onReviewPress }: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.headline}>{headline}</Text>
      {lines.map((line) => (
        <Text key={line} style={styles.line} numberOfLines={1}>
          {line}
        </Text>
      ))}
      <Pressable
        onPress={onReviewPress}
        style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
        accessibilityRole="button"
        accessibilityLabel="Review proof threads"
      >
        <Text style={styles.buttonLabel}>Review</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: HomeColors.card,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: HomeColors.border,
    padding: 18,
    marginBottom: 20,
    gap: 6,
  },
  headline: {
    color: HomeColors.textPrimary,
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: -0.3,
    marginBottom: 2,
  },
  line: {
    color: HomeColors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: -0.1,
  },
  button: {
    alignSelf: "flex-start",
    marginTop: 12,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: HomeColors.white,
  },
  buttonPressed: {
    opacity: 0.9,
  },
  buttonLabel: {
    color: HomeColors.black,
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
});
