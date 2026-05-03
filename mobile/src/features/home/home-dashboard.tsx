import { useUser } from "@clerk/expo";
import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { CommitmentList } from "@/src/features/home/components/commitment-list";
import { KairoScoreCard } from "@/src/features/home/components/kairo-score-card";
import { NextActionCard } from "@/src/features/home/components/next-action-card";
import { ProofInboxCard } from "@/src/features/home/components/proof-inbox-card";
import { RecentActivity } from "@/src/features/home/components/recent-activity";
import { StreakRankRow } from "@/src/features/home/components/streak-rank-row";
import {
  MOCK_ACTIVITY,
  MOCK_COMMITMENTS,
  MOCK_HOME_HEADER,
  MOCK_KAIRO_SCORE,
  MOCK_NEXT_ACTION,
  MOCK_PROOF_INBOX,
  MOCK_STREAK_RANK,
  scoreTierLabel,
} from "@/src/features/home/home.mock";
import type { MockCommitment } from "@/src/features/home/home.mock";
import { HomeColors } from "@/src/features/home/home-tokens";

const H_PAD = 20;

type HomeDashboardProps = {
  contentPaddingTop: number;
  contentPaddingBottom: number;
};

export function HomeDashboard({
  contentPaddingTop,
  contentPaddingBottom,
}: HomeDashboardProps) {
  const router = useRouter();
  const { user } = useUser();
  const greetingName =
    user?.firstName?.trim() ||
    user?.username?.trim() ||
    user?.primaryEmailAddress?.emailAddress?.split("@")[0] ||
    "there";

  const tier = scoreTierLabel(MOCK_KAIRO_SCORE.score);

  const onCommitmentPress = (item: MockCommitment) => {
    // TODO: replace `eventIdPlaceholder` with real id from API; detail may 404 for mock ids.
    console.log("Commitment pressed", item.id);
    router.push(`/(tabs)/events/${item.eventIdPlaceholder}`);
  };

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={[
        styles.scroll,
        {
          paddingTop: contentPaddingTop,
          paddingBottom: contentPaddingBottom,
        },
      ]}
    >
      <View style={styles.greetBlock}>
        <Text style={styles.greetHi}>Hey {greetingName}</Text>
        <Text style={styles.greetLine}>
          You have {MOCK_HOME_HEADER.actionCountToday} actions today
        </Text>
      </View>

      <KairoScoreCard
        score={MOCK_KAIRO_SCORE.score}
        tierLabel={tier}
        trend7d={MOCK_KAIRO_SCORE.trend7d}
        streakDays={MOCK_KAIRO_SCORE.streakDays}
      />

      <View style={styles.block}>
        <Text style={styles.blockTitle}>{"Today's next action"}</Text>
        <NextActionCard
          action={MOCK_NEXT_ACTION}
          onSubmitProof={() => {
            // TODO: navigate to proof flow / camera when route exists
            console.log("Submit proof pressed");
          }}
          onViewEvent={() => {
            // TODO: use real event id from API
            router.push(`/(tabs)/events/${MOCK_NEXT_ACTION.eventIdPlaceholder}`);
          }}
        />
      </View>

      <CommitmentList commitments={MOCK_COMMITMENTS} onOpenCommitment={onCommitmentPress} />

      <View style={styles.block}>
        <ProofInboxCard
          pendingCount={MOCK_PROOF_INBOX.pendingCount}
          tasks={MOCK_PROOF_INBOX.tasks}
          onReview={() => {
            // TODO: navigate to dedicated proof inbox when route exists
            console.log("Review proof inbox pressed");
          }}
        />
      </View>

      <View style={styles.block}>
        <StreakRankRow
          streakDays={MOCK_STREAK_RANK.streakDays}
          streakTrendLabel={MOCK_STREAK_RANK.streakTrendLabel}
          weeklyRank={MOCK_STREAK_RANK.weeklyRank}
          rankTrendLabel={MOCK_STREAK_RANK.rankTrendLabel}
        />
      </View>

      <RecentActivity items={MOCK_ACTIVITY} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: H_PAD,
    gap: 20,
  },
  greetBlock: {
    marginBottom: 2,
    gap: 6,
  },
  greetHi: {
    color: HomeColors.textPrimary,
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: -0.7,
  },
  greetLine: {
    color: HomeColors.textSecondary,
    fontSize: 15,
    fontWeight: "600",
  },
  block: {
    gap: 10,
  },
  blockTitle: {
    color: HomeColors.textPrimary,
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: -0.4,
    marginBottom: -2,
  },
});
