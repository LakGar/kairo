import { StyleSheet, Text, View } from "react-native";

import { HomeColors } from "@/src/features/home/home-tokens";

export function ChatEmptyState() {
  return (
    <View style={styles.wrap} accessibilityRole="text">
      <Text style={styles.title}>No chats found</Text>
      <Text style={styles.subtitle}>Try another search or category.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingVertical: 48,
    paddingHorizontal: 24,
    alignItems: "center",
  },
  title: {
    color: HomeColors.textPrimary,
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: -0.3,
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    color: HomeColors.textMuted,
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
    maxWidth: 280,
  },
});
