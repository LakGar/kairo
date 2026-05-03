import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { HomeColors } from "@/src/features/home/home-tokens";

type Action = {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
};

type Props = {
  actions: Action[];
};

export function QuickActions({ actions }: Props) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Quick actions</Text>
      <View style={styles.grid}>
        {actions.map((a) => (
          <Pressable
            key={a.key}
            onPress={a.onPress}
            style={({ pressed }) => [styles.cell, pressed && styles.pressed]}
          >
            <View style={styles.circle}>
              <Ionicons name={a.icon} size={22} color={HomeColors.accent} />
            </View>
            <Text style={styles.label}>{a.label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 12,
  },
  sectionTitle: {
    color: HomeColors.textPrimary,
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: -0.3,
    paddingHorizontal: 2,
  },
  grid: {
    flexDirection: "row",
    gap: 10,
  },
  cell: {
    flex: 1,
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
    minWidth: 0,
  },
  circle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: HomeColors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: HomeColors.surfaceStrong,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    color: HomeColors.textSecondary,
    fontSize: 11,
    fontWeight: "700",
    textAlign: "center",
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.97 }],
  },
});
