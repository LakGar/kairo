import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import type { Href } from "expo-router";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { FeatureEmptyState } from "@/src/components/feature-empty-state";
import { createKairoApiFromEnv } from "@/src/api";
import type { ApiNotificationItem } from "@/src/api/types";
import { KairoApiError } from "@/src/api/types";
import { buildEventDetailFocusHref } from "@/src/features/home/event-proof-nav";

const BG = "#000000";
const CARD_LINE = "rgba(255,255,255,0.08)";
const MUTED = "rgba(255,255,255,0.45)";
const LABEL = "rgba(255,255,255,0.92)";

const androidBlur =
  Platform.OS === "android"
    ? { experimentalBlurMethod: "dimezisBlurView" as const }
    : {};

function formatRelativeTime(iso: string): string {
  const d = new Date(iso);
  const diffMs = Date.now() - d.getTime();
  if (Number.isNaN(diffMs)) return "";
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

type Pill = "Proof" | "Result" | "Event" | "Score";

function typePill(type: string): Pill {
  if (type === "REVIEW_PROOF" || type.startsWith("PROOF_")) return "Proof";
  if (
    type === "TEAM_RESULT_REVIEW" ||
    type === "MATCH_TEAM_RESULT_SUBMITTED" ||
    type === "MATCH_TEAM_RESULT_CONFIRMED" ||
    type === "MATCH_TEAM_RESULT_DISPUTED" ||
    type === "MATCH_RESULT_CONFIRMED" ||
    type === "MATCH_WINNER_MARKED"
  ) {
    return "Result";
  }
  if (type.startsWith("STAKE_")) return "Score";
  if (type.startsWith("EVENT_") || type.startsWith("MATCH_CREATED")) return "Event";
  if (type.startsWith("MATCH_")) return "Result";
  if (type.startsWith("TEAM_")) return "Event";
  return "Event";
}

function navigateFromNotification(router: ReturnType<typeof useRouter>, item: ApiNotificationItem) {
  const eventId = item.eventId?.trim();
  if (!eventId) {
    // TODO: deep links without event context (e.g. team-only)
    return;
  }
  const f = item.focus;
  if (f === "proof" || f === "organizer" || f === "result") {
    router.push(
      buildEventDetailFocusHref(eventId, {
        focus: f,
        matchId: item.matchId ?? undefined,
        proofSubmissionId: item.proofSubmissionId ?? undefined,
      }),
    );
    return;
  }
  router.push(`/(tabs)/events/${encodeURIComponent(eventId)}` as Href);
}

function NotificationCard({
  item,
  onNavigate,
}: {
  item: ApiNotificationItem;
  onNavigate: (item: ApiNotificationItem) => void;
}) {
  const pill = typePill(item.type);
  const pillBg =
    pill === "Proof"
      ? "rgba(59,130,246,0.22)"
      : pill === "Result"
        ? "rgba(245,158,11,0.22)"
        : pill === "Score"
          ? "rgba(16,185,129,0.22)"
          : "rgba(255,255,255,0.12)";
  const showPrimaryCta = item.readAt === null && Boolean(item.actionLabel?.trim());
  const showGhostEventLink = Boolean(item.eventId?.trim()) && !showPrimaryCta;

  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={[styles.pill, { backgroundColor: pillBg }]}>
          <Text style={styles.pillText}>{pill}</Text>
        </View>
        <Text style={styles.time}>{formatRelativeTime(item.createdAt)}</Text>
      </View>
      <Text style={styles.cardTitle} numberOfLines={2}>
        {item.title}
      </Text>
      <Text style={styles.cardBody} numberOfLines={4}>
        {item.body}
      </Text>
      {showPrimaryCta && item.actionLabel ? (
        <Pressable
          onPress={() => onNavigate(item)}
          style={({ pressed }) => [styles.cta, pressed && { opacity: 0.85 }]}
          accessibilityRole="button"
          accessibilityLabel={item.actionLabel}
        >
          <Text style={styles.ctaText}>{item.actionLabel}</Text>
          <Ionicons name="chevron-forward" size={16} color="#000" />
        </Pressable>
      ) : null}
      {showGhostEventLink ? (
        <Pressable
          onPress={() => onNavigate(item)}
          style={({ pressed }) => [styles.ghostLinkWrap, pressed && { opacity: 0.8 }]}
          accessibilityRole="button"
          accessibilityLabel="View Event"
        >
          <Text style={styles.ghostLink}>View Event</Text>
          <Ionicons name="chevron-forward" size={14} color={MUTED} />
        </Pressable>
      ) : null}
    </View>
  );
}

export default function NotificationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<ApiNotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const api = createKairoApiFromEnv();
      const data = await api.getMyNotifications();
      setItems(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch (e) {
      const msg = e instanceof KairoApiError ? e.message : "Could not load notifications.";
      setError(msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    void load();
  }, [load]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    void load();
  }, [load]);

  const headerPad = insets.top + 52;
  const bottomPad = Math.max(insets.bottom, 16) + 32;

  const subtitle = useMemo(
    () =>
      unreadCount > 0
        ? `${unreadCount} action${unreadCount === 1 ? "" : "s"} need your attention`
        : "Proof, results, and event updates",
    [unreadCount],
  );

  const onNavigate = useCallback(
    (item: ApiNotificationItem) => {
      navigateFromNotification(router, item);
    },
    [router],
  );

  return (
    <View style={styles.root}>
      {loading ? (
        <View style={[styles.centered, { paddingTop: headerPad + 40 }]}>
          <ActivityIndicator size="large" color="#fff" />
        </View>
      ) : error ? (
        <View style={[styles.centered, styles.errorBlock, { paddingTop: headerPad + 24, paddingHorizontal: 24 }]}>
          <Text style={styles.errorTitle}>Something went wrong</Text>
          <Text style={styles.errorBody}>{error}</Text>
          <Pressable
            onPress={() => {
              setLoading(true);
              void load();
            }}
            style={({ pressed }) => [styles.retryBtn, pressed && { opacity: 0.9 }]}
            accessibilityRole="button"
            accessibilityLabel="Retry"
          >
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(it) => it.id}
          contentInsetAdjustmentBehavior="never"
          contentContainerStyle={[
            styles.listContent,
            { paddingTop: headerPad, paddingBottom: bottomPad },
            items.length === 0 && styles.listEmptyGrow,
          ]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />
          }
          renderItem={({ item }) => (
            <NotificationCard item={item} onNavigate={onNavigate} />
          )}
          ItemSeparatorComponent={() => <View style={styles.sep} />}
          ListEmptyComponent={
            <FeatureEmptyState
              colors={{
                textPrimary: LABEL,
                textMuted: MUTED,
                icon: MUTED,
              }}
              icon="notifications-off-outline"
              title="No notifications yet"
              subtitle="You're all caught up."
              compact
            />
          }
        />
      )}

      <View
        style={[styles.headerShell, { paddingTop: insets.top + 4 }]}
        pointerEvents="box-none"
      >
        <BlurView
          pointerEvents="none"
          tint="dark"
          intensity={22}
          style={StyleSheet.absoluteFill}
          {...androidBlur}
        />
        <View style={styles.headerRow}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </Pressable>
          <View style={styles.headerTitleCol}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              Notifications
            </Text>
            <Text style={styles.headerSubtitle} numberOfLines={2}>
              {subtitle}
            </Text>
          </View>
          <View style={styles.headerRightSpacer} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: BG,
  },
  listContent: {
    paddingHorizontal: 16,
  },
  listEmptyGrow: {
    flexGrow: 1,
    justifyContent: "center",
    minHeight: 360,
  },
  sep: {
    height: 12,
  },
  card: {
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: CARD_LINE,
    backgroundColor: "rgba(255,255,255,0.04)",
    padding: 14,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  pillText: {
    fontSize: 11,
    fontWeight: "700",
    color: LABEL,
    letterSpacing: 0.3,
  },
  time: {
    fontSize: 12,
    color: MUTED,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: LABEL,
    lineHeight: 21,
  },
  cardBody: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 20,
    color: MUTED,
  },
  cta: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    alignSelf: "flex-start",
    backgroundColor: "#fff",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
  },
  ctaText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#000",
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-start",
  },
  errorBlock: {
    alignItems: "stretch",
  },
  errorTitle: {
    color: LABEL,
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },
  errorBody: {
    marginTop: 8,
    color: MUTED,
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  retryBtn: {
    marginTop: 20,
    alignSelf: "center",
    backgroundColor: "#fff",
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: 999,
  },
  retryText: {
    color: "#000",
    fontSize: 15,
    fontWeight: "700",
  },
  headerShell: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    overflow: "hidden",
    minHeight: 48,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 8,
    paddingBottom: 10,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitleCol: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 4,
  },
  headerTitle: {
    color: LABEL,
    fontSize: 17,
    fontWeight: "700",
  },
  headerSubtitle: {
    marginTop: 2,
    color: MUTED,
    fontSize: 12,
    fontWeight: "500",
    textAlign: "center",
    lineHeight: 16,
  },
  headerRightSpacer: {
    width: 40,
  },
  ghostLinkWrap: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
  },
  ghostLink: {
    fontSize: 14,
    fontWeight: "600",
    color: LABEL,
  },
});
