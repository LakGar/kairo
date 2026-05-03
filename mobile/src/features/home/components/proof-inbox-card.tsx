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
        <View style={{ flex: 1, minWidth: 0 }}>
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
            <View style={styles.bullet} />
            <Text style={styles.taskText}>{t.label}</Text>
          </View>
        ))}
      </View>
      <Pressable
        onPress={onReview}
        style={({ pressed }) => [styles.btn, pressed && styles.pressed]}
      >
        <Text style={styles.btnLabel}>Review</Text>
        <Ionicons name="arrow-forward" size={18} color={HomeColors.textPrimary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 18,
    backgroundColor: HomeColors.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: HomeColors.border,
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
    backgroundColor: HomeColors.cardLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: HomeColors.border,
  },
  badgeText: {
    color: HomeColors.textPrimary,
    fontSize: 12,
    fontWeight: "700",
  },
  list: {
    gap: 10,
  },
  taskRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.35)",
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
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: HomeColors.border,
    backgroundColor: "transparent",
  },
  btnLabel: {
    color: HomeColors.textPrimary,
    fontSize: 15,
    fontWeight: "800",
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
});
