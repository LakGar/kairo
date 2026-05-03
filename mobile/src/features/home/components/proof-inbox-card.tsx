import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { MockProofTask } from "@/src/features/home/home.mock";
import { HomeColors } from "@/src/features/home/home-tokens";

type Props = {
  pendingCount: number;
  tasks: MockProofTask[];
  onReview: () => void;
};

export function ProofInboxCard({ pendingCount, tasks, onReview }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.top}>
        <View>
          <Text style={styles.title}>Proof inbox</Text>
          <Text style={styles.sub}>Team & event verifications</Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{pendingCount} pending</Text>
        </View>
      </View>
      <View style={styles.list}>
        {tasks.map((t) => (
          <View key={t.id} style={styles.taskRow}>
            <Ionicons name="ellipse" size={6} color={HomeColors.accent} />
            <Text style={styles.taskText}>{t.label}</Text>
          </View>
        ))}
      </View>
      <Pressable
        onPress={onReview}
        style={({ pressed }) => [styles.btn, pressed && styles.pressed]}
      >
        <Text style={styles.btnLabel}>Review</Text>
        <Ionicons name="arrow-forward" size={18} color={HomeColors.bg} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    padding: 18,
    backgroundColor: HomeColors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: HomeColors.surfaceStrong,
    gap: 14,
  },
  top: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  title: {
    color: HomeColors.textPrimary,
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  sub: {
    color: HomeColors.textMuted,
    fontSize: 13,
    marginTop: 4,
    fontWeight: "500",
  },
  badge: {
    backgroundColor: "rgba(255,106,42,0.2)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  badgeText: {
    color: HomeColors.accent,
    fontSize: 12,
    fontWeight: "800",
  },
  list: {
    gap: 10,
  },
  taskRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  taskText: {
    flex: 1,
    color: HomeColors.textSecondary,
    fontSize: 15,
    fontWeight: "600",
    lineHeight: 21,
  },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: HomeColors.accent,
    paddingVertical: 14,
    borderRadius: 14,
  },
  btnLabel: {
    color: HomeColors.bg,
    fontSize: 15,
    fontWeight: "800",
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
});
