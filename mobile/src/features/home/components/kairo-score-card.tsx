import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

import type { HomePalette } from "@/src/features/home/home-tokens";
import { useHomeColors } from "@/src/features/home/home-theme";

type Props = {
  score: number;
  tierLabel: string;
  trend7d: number;
  streakDays: number;
};

export function KairoScoreCard({ score, tierLabel, trend7d, streakDays }: Props) {
  const c = useHomeColors();
  const safeScore = Math.max(0, Math.min(100, Math.round(Number.isFinite(score) ? score : 0)));
  const safeTrend = Math.round(Number.isFinite(trend7d) ? trend7d : 0);
  const safeStreak = Math.max(0, Math.round(Number.isFinite(streakDays) ? streakDays : 0));
  const trendStr = safeTrend >= 0 ? `+${safeTrend}` : `${safeTrend}`;
  const trendColor = safeTrend >= 0 ? c.success : c.textSecondary;
  const styles = useMemo(() => makeStyles(c), [c]);

  return (
    <View style={styles.card}>
      <Text style={styles.eyebrow}>Kairo Score</Text>
      <View style={styles.scoreRow}>
        <Text style={styles.scoreNum}>{safeScore}</Text>
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
          <Text style={styles.metricValue}>{safeStreak} days</Text>
        </View>
      </View>
      <Text style={styles.footnote}>
        Based on completed commitments, proof, and verifications.
      </Text>
    </View>
  );
}

function makeStyles(c: HomePalette) {
  return StyleSheet.create({
    card: {
      borderRadius: 16,
      padding: 18,
      backgroundColor: c.card,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
      gap: 8,
    },
    eyebrow: {
      color: c.textMuted,
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
      color: c.textPrimary,
      fontSize: 44,
      fontWeight: "800",
      letterSpacing: -1.5,
    },
    tierPill: {
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 999,
      backgroundColor: c.pillBackground,
    },
    tierText: {
      color: c.pillText,
      fontSize: 12,
      fontWeight: "700",
    },
    metrics: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 8,
      paddingTop: 12,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: c.border,
    },
    metric: {
      flex: 1,
    },
    metricLabel: {
      color: c.textMuted,
      fontSize: 11,
      fontWeight: "600",
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    metricValue: {
      color: c.textPrimary,
      fontSize: 17,
      fontWeight: "700",
      marginTop: 4,
    },
    metricDivider: {
      width: StyleSheet.hairlineWidth,
      height: 32,
      backgroundColor: c.border,
      marginHorizontal: 14,
    },
    footnote: {
      color: c.textMuted,
      fontSize: 12,
      lineHeight: 17,
      marginTop: 4,
    },
  });
}
