import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { HomeColors } from "@/src/features/home/home-tokens";

type Props = {
  streakDays: number;
  streakTrendLabel: string;
  weeklyRank: number | null;
  rankTrendLabel: string;
};

export function StreakRankRow({
  streakDays,
  streakTrendLabel,
  weeklyRank,
  rankTrendLabel,
}: Props) {
  return (
    <View style={styles.row}>
      <View style={[styles.card, styles.flex]}>
        <View style={styles.iconRow}>
          <Ionicons name="flame" size={18} color={HomeColors.textMuted} />
          <Text style={styles.cardTitle}>Streak</Text>
        </View>
        <Text style={styles.big}>{streakDays}-day</Text>
        <Text style={styles.trend}>{streakTrendLabel}</Text>
      </View>
      <View style={[styles.card, styles.flex]}>
        <View style={styles.iconRow}>
          <Ionicons name="ribbon-outline" size={18} color={HomeColors.textMuted} />
          <Text style={styles.cardTitle}>Weekly rank</Text>
        </View>
        <Text style={styles.big}>{weeklyRank == null ? "—" : `#${weeklyRank}`}</Text>
        <Text style={styles.trend}>{rankTrendLabel}</Text>
        <Text style={styles.micro}>Among friends</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: 12,
  },
  flex: {
    flex: 1,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    backgroundColor: HomeColors.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: HomeColors.border,
    gap: 6,
  },
  iconRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 2,
  },
  cardTitle: {
    color: HomeColors.textMuted,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  big: {
    color: HomeColors.textPrimary,
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: -0.6,
  },
  trend: {
    color: HomeColors.textSecondary,
    fontSize: 13,
    fontWeight: "600",
    marginTop: 2,
  },
  micro: {
    color: HomeColors.textMuted,
    fontSize: 11,
    fontWeight: "500",
    marginTop: 4,
  },
});
