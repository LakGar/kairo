import { StyleSheet, Text, View } from "react-native";

import type { MockActivity } from "@/src/features/home/home.mock";
import { HomeColors } from "@/src/features/home/home-tokens";

type Props = {
  items: MockActivity[];
};

export function RecentActivity({ items }: Props) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Recent activity</Text>
      <View style={styles.card}>
        {items.map((item, index) => (
          <View
            key={item.id}
            style={[styles.row, index < items.length - 1 && styles.rowBorder]}
          >
            <View style={styles.dot} />
            <Text style={styles.text}>{item.text}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 12,
    marginBottom: 8,
  },
  sectionTitle: {
    color: HomeColors.textPrimary,
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: -0.3,
    paddingHorizontal: 2,
  },
  card: {
    borderRadius: 16,
    backgroundColor: HomeColors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: HomeColors.surfaceStrong,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: HomeColors.surfaceStrong,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
    backgroundColor: HomeColors.accent,
    opacity: 0.85,
  },
  text: {
    flex: 1,
    color: HomeColors.textSecondary,
    fontSize: 15,
    fontWeight: "600",
    lineHeight: 22,
  },
});
