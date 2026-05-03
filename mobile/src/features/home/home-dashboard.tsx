import { Ionicons } from "@expo/vector-icons";
import { useUser } from "@clerk/expo";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import type { ComponentProps } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { CommitmentsSection } from "@/src/features/home/components/commitments-section";
import { InvitesCard } from "@/src/features/home/components/invites-card";
import { KairoScoreCard } from "@/src/features/home/components/kairo-score-card";
import { NextActionCard } from "@/src/features/home/components/next-action-card";
import { ProofInboxCard } from "@/src/features/home/components/proof-inbox-card";
import { QuickActions } from "@/src/features/home/components/quick-actions";
import { RecentActivity } from "@/src/features/home/components/recent-activity";
import { StreakRankRow } from "@/src/features/home/components/streak-rank-row";
import {
  MOCK_ACTIVITY,
  MOCK_COMMITMENTS,
  MOCK_HOME_HEADER,
  MOCK_INVITES,
  MOCK_KAIRO_SCORE,
  MOCK_NEXT_ACTION,
  MOCK_PROOF_INBOX,
  MOCK_STREAK_RANK,
  scoreTierLabel,
} from "@/src/features/home/home.mock";
import { HomeColors } from "@/src/features/home/home-tokens";

type Ion = ComponentProps<typeof Ionicons>["name"];

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

  const quickActions: {
    key: string;
    label: string;
    icon: Ion;
    onPress: () => void;
  }[] = [
    {
      key: "create",
      label: "Create Event",
      icon: "add-circle-outline",
      onPress: () => {
        router.push("/(tabs)/create");
      },
    },
    {
      key: "join",
      label: "Join Event",
      icon: "enter-outline",
      onPress: () => {
        router.push("/(tabs)/events");
      },
    },
    {
      key: "proof",
      label: "Submit Proof",
      icon: "camera-outline",
      onPress: () => {
        // TODO: deep-link to proof flow when home is wired to real tasks
        console.log("[home] Submit Proof — TODO wire to proof inbox / event");
      },
    },
    {
      key: "team",
      label: "Create Team",
      icon: "people-outline",
      onPress: () => {
        // TODO: open create team on selected event when context exists
        console.log("[home] Create Team — TODO wire from event detail");
      },
    },
  ];

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={[
        styles.scroll,
        { paddingTop: contentPaddingTop, paddingBottom: contentPaddingBottom },
      ]}
    >
      <View style={styles.greetBlock}>
        <View style={styles.greetTop}>
          <View style={styles.greetTextCol}>
            <Text style={styles.greetHi}>Hey {greetingName}</Text>
            <Text style={styles.greetLine}>
              You have {MOCK_HOME_HEADER.actionCountToday} actions today
            </Text>
          </View>
          <Pressable
            onPress={() => router.push("/(tabs)/settings")}
            style={({ pressed }) => [styles.avatarBtn, pressed && { opacity: 0.85 }]}
            accessibilityLabel="Open settings"
          >
            {user?.imageUrl ? (
              <Image source={{ uri: user.imageUrl }} style={styles.avatar} contentFit="cover" />
            ) : (
              <View style={styles.avatarFallback}>
                <Ionicons name="person" size={18} color={HomeColors.textMuted} />
              </View>
            )}
          </Pressable>
        </View>
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
            // TODO: navigate to proof capture when task pipeline exists
            console.log("[home] Submit proof for", MOCK_NEXT_ACTION.eventTitle);
          }}
          onViewEvent={() => {
            // TODO: replace placeholder id with real event id from API
            router.push(`/(tabs)/events/${MOCK_NEXT_ACTION.eventIdPlaceholder}`);
          }}
        />
      </View>

      <CommitmentsSection
        commitments={MOCK_COMMITMENTS}
        onOpenCommitment={(id) => {
          // TODO: open commitment / event when API-backed
          console.log("[home] Open commitment", id);
        }}
      />

      <View style={styles.block}>
        <ProofInboxCard
          pendingCount={MOCK_PROOF_INBOX.pendingCount}
          tasks={MOCK_PROOF_INBOX.tasks}
          onReview={() => {
            // TODO: navigate to proof inbox screen
            console.log("[home] Review proof inbox");
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

      <View style={styles.block}>
        <InvitesCard
          invites={MOCK_INVITES}
          onAccept={(id) => {
            console.log("[home] Accept invite", id);
          }}
          onDecline={(id) => {
            console.log("[home] Decline invite", id);
          }}
        />
      </View>

      <View style={styles.block}>
        <QuickActions actions={quickActions} />
      </View>

      <RecentActivity items={MOCK_ACTIVITY} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: 16,
    gap: 22,
  },
  greetBlock: {
    marginBottom: 4,
  },
  greetTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  greetTextCol: {
    flex: 1,
    minWidth: 0,
  },
  greetHi: {
    color: HomeColors.textPrimary,
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.8,
  },
  greetLine: {
    marginTop: 6,
    color: HomeColors.textSecondary,
    fontSize: 15,
    fontWeight: "600",
  },
  avatarBtn: {
    borderRadius: 22,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: HomeColors.surfaceStrong,
  },
  avatar: {
    width: 44,
    height: 44,
  },
  avatarFallback: {
    width: 44,
    height: 44,
    backgroundColor: HomeColors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  block: {
    gap: 12,
  },
  blockTitle: {
    color: HomeColors.textPrimary,
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: -0.4,
    marginBottom: -4,
  },
});
