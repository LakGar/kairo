import { useUser } from "@clerk/expo";
import { useFocusEffect, useRouter, type Href } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { FeatureEmptyState } from "@/src/components/feature-empty-state";
import { CommitmentList } from "@/src/features/home/components/commitment-list";
import { KairoScoreCard } from "@/src/features/home/components/kairo-score-card";
import { NextActionCard } from "@/src/features/home/components/next-action-card";
import { ProofInboxCard } from "@/src/features/home/components/proof-inbox-card";
import { RecentActivity } from "@/src/features/home/components/recent-activity";
import { StreakRankRow } from "@/src/features/home/components/streak-rank-row";
import { buildEventDetailFocusHref } from "@/src/features/home/event-proof-nav";
import { getMyEventsHome } from "@/src/features/home/get-my-events-home";
import type { MockCommitment, MockProofTask } from "@/src/features/home/home.mock";
import type { HomePalette } from "@/src/features/home/home-tokens";
import { useHomeColors } from "@/src/features/home/home-theme";
import {
  activityToMock,
  homeActionToMockNextAction,
  mergeMeHomeToCommitments,
  proofInboxToMockTasks,
} from "@/src/features/home/me-home-map";
import { loadPersonalCommitment } from "@/src/features/personal-commitment/personal-commitment-store";
import { personalCommitmentToMockRow } from "@/src/features/personal-commitment/personal-commitment-to-mock";
import {
  getLinkedKairoUserId,
  KairoApiConfigurationError,
  KairoApiError,
  type ApiMeEventsPayload,
} from "@/src/api";

const H_PAD = 20;

type HomeDashboardProps = {
  contentPaddingTop: number;
  contentPaddingBottom: number;
  onRequestPersonalCommitmentFlow?: () => void;
};

type HomeError = { message: string; code?: string };

export function HomeDashboard({
  contentPaddingTop,
  contentPaddingBottom,
  onRequestPersonalCommitmentFlow,
}: HomeDashboardProps) {
  const router = useRouter();
  const { user } = useUser();
  const colors = useHomeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [personalRows, setPersonalRows] = useState<MockCommitment[]>([]);
  const [homeData, setHomeData] = useState<ApiMeEventsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<HomeError | null>(null);

  const reloadPersonal = useCallback(() => {
    void loadPersonalCommitment().then((p) => {
      setPersonalRows(p ? [personalCommitmentToMockRow(p)] : []);
    });
  }, []);

  const loadHome = useCallback(
    async (mode: "initial" | "refresh") => {
      if (mode === "initial") setLoading(true);
      else setRefreshing(true);
      setError(null);
      try {
        const payload = await getMyEventsHome(getLinkedKairoUserId(user));
        setHomeData(payload);
      } catch (e) {
        if (e instanceof KairoApiConfigurationError) {
          setError({
            message:
              "Missing API configuration. Set EXPO_PUBLIC_API_URL (and sign in so bootstrap can set your user id, or set EXPO_PUBLIC_KAIRO_DEV_USER_ID).",
            code: "CONFIG",
          });
        } else if (e instanceof KairoApiError) {
          setError({ message: e.message, code: e.code });
        } else {
          setError({
            message: e instanceof Error ? e.message : "Could not load your dashboard.",
          });
        }
        setHomeData(null);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [user],
  );

  useFocusEffect(
    useCallback(() => {
      reloadPersonal();
    }, [reloadPersonal]),
  );

  useEffect(() => {
    void loadHome("initial");
  }, [loadHome]);

  const apiCommitments = useMemo(
    () => (homeData ? mergeMeHomeToCommitments(homeData) : []),
    [homeData],
  );

  const commitments = useMemo(
    () => [...personalRows, ...apiCommitments],
    [personalRows, apiCommitments],
  );

  const greetingName =
    user?.firstName?.trim() ||
    user?.username?.trim() ||
    user?.primaryEmailAddress?.emailAddress?.split("@")[0] ||
    "there";

  const onCommitmentPress = (item: MockCommitment) => {
    if (item.eventIdPlaceholder === "personal") {
      Alert.alert(
        "Personal commitment",
        "Proof check-ins for personal commitments will tie into your score soon. Keep showing up.",
      );
      return;
    }
    router.push(`/(tabs)/events/${item.eventIdPlaceholder}` as Href);
  };

  const nextActionMock =
    homeData && homeData.actions.length > 0
      ? homeActionToMockNextAction(homeData.actions[0], apiCommitments)
      : null;

  const proofTasks = homeData ? proofInboxToMockTasks(homeData.proofInbox) : [];
  const activityItems = homeData ? activityToMock(homeData.recentActivity) : [];

  const stats = homeData?.stats;

  const firstProofInboxWithEvent = useMemo(
    () => homeData?.proofInbox.find((p) => p.eventId?.trim()),
    [homeData],
  );

  const navigateToProofOnEvent = useCallback(
    (
      eventId: string,
      focus: "proof" | "organizer" | "result",
      opts?: { proofSubmissionId?: string; matchId?: string },
    ) => {
      const id = eventId.trim();
      if (!id) {
        if (__DEV__) console.log("[Home] proof navigation skipped: missing eventId");
        return;
      }
      router.push(
        buildEventDetailFocusHref(id, {
          focus,
          proofSubmissionId: opts?.proofSubmissionId,
          matchId: opts?.matchId,
        }),
      );
    },
    [router],
  );

  const onProofInboxTaskPress = useCallback(
    (task: MockProofTask) => {
      if (!task.eventId?.trim()) {
        if (__DEV__) console.log("[Home] proof inbox row missing eventId", task.id);
        return;
      }
      navigateToProofOnEvent(task.eventId, task.focusTarget ?? "organizer", {
        proofSubmissionId: task.proofSubmissionId,
        matchId: task.matchId,
      });
    },
    [navigateToProofOnEvent],
  );

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => void loadHome("refresh")}
          tintColor={colors.accent}
        />
      }
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
        <Text style={styles.greetLine}>Your accountability snapshot — proof, events, and score in one place.</Text>
      </View>

      {error ? (
        <FeatureEmptyState
          icon="cloud-offline-outline"
          title="Could not load dashboard"
          subtitle={error.message}
          compact
          primaryAction={{
            label: "Retry",
            onPress: () => void loadHome("refresh"),
          }}
        />
      ) : null}

      {loading && !homeData ? (
        <View style={styles.loadingBlock}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={styles.loadingText}>Loading your commitments…</Text>
        </View>
      ) : null}

      {!error && stats ? (
        <KairoScoreCard
          score={stats.kairoScore}
          tierLabel={stats.scoreLabel}
          trend7d={stats.sevenDayTrend}
          streakDays={stats.streakDays}
        />
      ) : null}
      {!error && !loading && !stats ? (
        <FeatureEmptyState
          icon="stats-chart-outline"
          title="Kairo Score"
          subtitle="Sign in and connect to the API to see your score estimate."
          compact
        />
      ) : null}

      {!error && stats ? (
        <StreakRankRow
          streakDays={stats.streakDays}
          streakTrendLabel={stats.sevenDayTrend >= 0 ? "On track" : "Catch up"}
          weeklyRank={stats.weeklyRank}
          rankTrendLabel={stats.weeklyRank == null ? "Unranked (MVP)" : "This week"}
        />
      ) : null}

      <View style={styles.block}>
        <Text style={styles.blockTitle}>{"Today's next action"}</Text>
        {nextActionMock ? (
          <NextActionCard
            action={nextActionMock}
            onSubmitProof={() => {
              const eid = nextActionMock.eventIdPlaceholder?.trim();
              if (!eid) {
                if (__DEV__) console.log("[Home] next action missing eventId for proof navigation");
                return;
              }
              if (nextActionMock.apiActionType === "TEAM_RESULT_REVIEW") {
                navigateToProofOnEvent(eid, "result", {
                  matchId: nextActionMock.matchId,
                });
                return;
              }
              const focus =
                nextActionMock.apiActionType === "REVIEW_PROOF" ? "organizer" : "proof";
              navigateToProofOnEvent(eid, focus, {
                proofSubmissionId: nextActionMock.proofSubmissionId,
                matchId: nextActionMock.matchId,
              });
            }}
            onViewEvent={() => {
              if (nextActionMock.eventIdPlaceholder) {
                router.push(`/(tabs)/events/${nextActionMock.eventIdPlaceholder}` as Href);
              }
            }}
          />
        ) : (
          <FeatureEmptyState
            icon="flash-outline"
            title="Nothing due right now"
            subtitle="Join a challenge on Discover — your next proof or RSVP will surface here."
            compact
            primaryAction={{
              label: "Open Discover",
              onPress: () => router.push("/(tabs)/(home)/index" as Href),
            }}
          />
        )}
      </View>

      {homeData ? (
        <ProofInboxCard
          pendingCount={homeData.proofInbox.length}
          tasks={proofTasks}
          reviewDisabled={!firstProofInboxWithEvent?.eventId}
          onTaskPress={onProofInboxTaskPress}
          onReview={() => {
            if (firstProofInboxWithEvent?.eventId) {
              navigateToProofOnEvent(firstProofInboxWithEvent.eventId, "organizer", {
                proofSubmissionId: firstProofInboxWithEvent.proofSubmissionId,
                matchId: firstProofInboxWithEvent.matchId,
              });
            } else {
              router.push("/(tabs)/(home)/index" as Href);
            }
          }}
        />
      ) : null}

      {homeData && activityItems.length > 0 ? (
        <RecentActivity items={activityItems} />
      ) : homeData && activityItems.length === 0 ? (
        <FeatureEmptyState
          icon="time-outline"
          title="Recent activity"
          subtitle="No recent activity yet — create or join an event to get started."
          compact
        />
      ) : null}

      <CommitmentList
        commitments={commitments}
        onOpenCommitment={onCommitmentPress}
        onCreatePersonalCommitment={onRequestPersonalCommitmentFlow}
      />
    </ScrollView>
  );
}

function makeStyles(c: HomePalette) {
  return StyleSheet.create({
    scroll: {
      paddingHorizontal: H_PAD,
      gap: 20,
    },
    greetBlock: {
      marginBottom: 2,
      gap: 6,
    },
    greetHi: {
      color: c.textPrimary,
      fontSize: 26,
      fontWeight: "800",
      letterSpacing: -0.7,
    },
    greetLine: {
      color: c.textSecondary,
      fontSize: 15,
      fontWeight: "600",
    },
    block: {
      gap: 10,
    },
    blockTitle: {
      color: c.textPrimary,
      fontSize: 18,
      fontWeight: "800",
      letterSpacing: -0.4,
      marginBottom: -2,
    },
    loadingBlock: {
      alignItems: "center",
      gap: 12,
      paddingVertical: 24,
    },
    loadingText: {
      color: c.textMuted,
      fontSize: 14,
      fontWeight: "600",
    },
  });
}
