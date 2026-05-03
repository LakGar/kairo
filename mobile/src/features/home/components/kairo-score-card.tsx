import { StyleSheet, Text, View } from "react-native";

import { HomeColors } from "@/src/features/home/home-tokens";

type Props = {
  score: number;
  tierLabel: string;
  trend7d: number;
  streakDays: number;
};

export function KairoScoreCard({ score, tierLabel, trend7d, streakDays }: Props) {
  const trendStr = trend7d >= 0 ? `+${trend7d}` : `${trend7d}`;
  const trendColor = trend7d >= 0 ? HomeColors.success : HomeColors.textSecondary;

  return (
    <View style={styles.card}>
      <Text style={styles.eyebrow}>Kairo Score</Text>
      <View style={styles.scoreRow}>
        <Text style={styles.scoreNum}>{score}</Text>
        <View style={styles.tierPill}>
          <Text style={styles.tierText}>{tierLabel}</Text>
        </View>
      </View>
      <View style={styles.metrics}>
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>7-day</Text>
          <Text style={[styles.metricValue, { color: trendColor }]}>{trendStr}</Text>
        </View>
        <View style={styles.metricDivider} />
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>Streak</Text>
          <Text style={styles.metricValue}>{streakDays} days</Text>
        </View>
      </View>
      <Text style={styles.footnote}>
        Based on completed commitments, proof, and verifications.
      </Text>
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
    gap: 8,
  },
  eyebrow: {
    color: HomeColors.textMuted,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.1,
    textTransform: "uppercase",
  },
  scoreRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 2,
  },
  scoreNum: {
    color: HomeColors.white,
    fontSize: 44,
    fontWeight: "800",
    letterSpacing: -1.5,
  },
  tierPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: HomeColors.pillBackground,
  },
  tierText: {
    color: HomeColors.pillText,
    fontSize: 12,
    fontWeight: "700",
  },
  metrics: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: HomeColors.border,
  },
  metric: {
    flex: 1,
  },
  metricLabel: {
    color: HomeColors.textMuted,
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  metricValue: {
    color: HomeColors.textPrimary,
    fontSize: 17,
    fontWeight: "700",
    marginTop: 4,
  },
  metricDivider: {
    width: StyleSheet.hairlineWidth,
    height: 32,
    backgroundColor: HomeColors.border,
    marginHorizontal: 14,
  },
  footnote: {
    color: HomeColors.textMuted,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 4,
  },
});
