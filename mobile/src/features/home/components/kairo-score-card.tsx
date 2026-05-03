import { LinearGradient } from "expo-linear-gradient";
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
  const trendColor = trend7d >= 0 ? HomeColors.success : HomeColors.danger;

  return (
    <LinearGradient
      colors={["rgba(255,106,42,0.22)", "rgba(15,23,42,0.95)", HomeColors.bg]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradientWrap}
    >
      <View style={styles.inner}>
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
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradientWrap: {
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: HomeColors.surfaceStrong,
  },
  inner: {
    padding: 20,
    gap: 10,
  },
  eyebrow: {
    color: HomeColors.textMuted,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  scoreRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  scoreNum: {
    color: HomeColors.white,
    fontSize: 52,
    fontWeight: "800",
    letterSpacing: -2,
  },
  tierPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: HomeColors.surfaceStrong,
  },
  tierText: {
    color: HomeColors.textPrimary,
    fontSize: 13,
    fontWeight: "700",
  },
  metrics: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  metric: {
    flex: 1,
  },
  metricLabel: {
    color: HomeColors.textMuted,
    fontSize: 12,
    fontWeight: "600",
  },
  metricValue: {
    color: HomeColors.textPrimary,
    fontSize: 18,
    fontWeight: "700",
    marginTop: 2,
  },
  metricDivider: {
    width: StyleSheet.hairlineWidth,
    height: 36,
    backgroundColor: HomeColors.surfaceStrong,
    marginHorizontal: 12,
  },
  footnote: {
    color: HomeColors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },
});
