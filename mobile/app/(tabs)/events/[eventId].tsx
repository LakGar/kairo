import { useUser } from "@clerk/expo";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";

import { pickSearchParam } from "@/src/features/home/event-proof-nav";

import { getLinkedKairoUserId, type ApiEventPublic, type ApiUserSnippet } from "@/src/api";
import {
  categoryIconForActivity,
  formatEventEntryFeeLine,
  gradientColorsForEvent,
  heroImageUrlForEvent,
} from "@/src/features/events/event-detail-visuals";
import { EventHostDashboardSection } from "@/src/features/events/event-host-dashboard-section";
import { EventJoinSection } from "@/src/features/events/event-join-section";
import { EventOrganizerSection } from "@/src/features/events/event-organizer-section";
import { EventProofSubmitSection } from "@/src/features/events/event-proof-submit-section";
import { EventTeamAgreementResultsSection } from "@/src/features/events/event-team-agreement-results-section";
import { EventTeamsSection } from "@/src/features/events/event-teams-section";
import { formatEventDetailWhenLine } from "@/src/features/events/format-event-range";
import { useEventDetail } from "@/src/features/events/use-event-detail";
import { useEventTeams } from "@/src/features/events/use-event-teams";
import { HomeColors } from "@/src/features/home/home-tokens";

const HERO_RADIUS = 22;
const HERO_HEIGHT = 300;

function MetaRow({ icon, label }: { icon: keyof typeof Ionicons.glyphMap; label: string }) {
  return (
    <View style={styles.metaRow}>
      <Ionicons name={icon} size={20} color={HomeColors.textMuted} style={styles.metaIcon} />
      <Text style={styles.metaText}>{label}</Text>
    </View>
  );
}

const GOING_STACK_MAX = 6;

function GoingAvatars({ event }: { event: ApiEventPublic }) {
  const total = event._count.participants;
  const preview = event.participants ?? [];

  const stackUsers = useMemo(() => {
    const seen = new Set<string>();
    const out: ApiUserSnippet[] = [];
    for (const row of preview) {
      const id = row.user.id;
      if (seen.has(id)) continue;
      seen.add(id);
      out.push(row.user);
      if (out.length >= GOING_STACK_MAX) break;
    }
    if (out.length === 0 && total > 0 && event.organizer) {
      out.push(event.organizer);
    }
    return out;
  }, [preview, total, event.organizer]);

  const overflow = Math.max(0, total - stackUsers.length);

  const label =
    total === 0
      ? "Be the first to RSVP"
      : `${total} ${total === 1 ? "person" : "people"} going`;

  const roleHint = useMemo(() => {
    if (preview.length === 0) return null;
    const counts: Record<string, number> = {};
    for (const row of preview) {
      const r = row.role;
      counts[r] = (counts[r] ?? 0) + 1;
    }
    const parts: string[] = [];
    if (counts.PLAYER) parts.push(`${counts.PLAYER} player${counts.PLAYER === 1 ? "" : "s"}`);
    if (counts.WATCHER) parts.push(`${counts.WATCHER} watcher${counts.WATCHER === 1 ? "" : "s"}`);
    if (counts.VOLUNTEER)
      parts.push(`${counts.VOLUNTEER} volunteer${counts.VOLUNTEER === 1 ? "" : "s"}`);
    if (counts.ORGANIZER) parts.push("host");
    if (parts.length === 0) return null;
    return parts.join(" · ");
  }, [preview]);

  return (
    <View style={styles.goingBlock}>
      <View style={styles.avatarStack}>
        {stackUsers.map((u, index) => (
          <View
            key={u.id}
            style={[
              styles.avatarRing,
              index > 0 && styles.avatarRingOverlap,
              { zIndex: stackUsers.length - index },
            ]}
          >
            {u.profile?.avatarUrl ? (
              <Image
                source={{ uri: u.profile.avatarUrl }}
                style={styles.avatarImg}
                contentFit="cover"
              />
            ) : (
              <View style={[styles.avatarImg, styles.avatarPlaceholderRing]}>
                <Ionicons name="person" size={18} color={HomeColors.textMuted} />
              </View>
            )}
          </View>
        ))}
        {overflow > 0 ? (
          <View style={[styles.moreGoingChip, stackUsers.length > 0 && styles.moreGoingChipOverlap]}>
            <Text style={styles.moreGoingChipText}>+{overflow}</Text>
          </View>
        ) : null}
      </View>
      <View style={styles.goingTextCol}>
        <Text style={styles.goingLabel}>{label}</Text>
        {roleHint ? (
          <Text style={styles.goingSubLabel} numberOfLines={2}>
            In this group: {roleHint}
            {preview.length < total ? " (sample)" : ""}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

function ProofFocusBanner({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) {
  return (
    <View style={styles.focusBanner}>
      <Ionicons name={icon} size={18} color={HomeColors.textPrimary} />
      <Text style={styles.focusBannerText}>{text}</Text>
    </View>
  );
}

export default function EventDetailScreen() {
  const { user } = useUser();
  const linkedUserId = getLinkedKairoUserId(user);
  const params = useLocalSearchParams();
  const eventId = pickSearchParam(params.eventId as string | string[] | undefined);
  const focus = pickSearchParam(params.focus as string | string[] | undefined);
  const focusMatchId = pickSearchParam(params.matchId as string | string[] | undefined);
  // TODO: use proofSubmissionId to highlight a specific proof row when UI supports it.
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const didAutoScrollToFocus = useRef(false);
  /** Y of lower sheet top within padded scroll `inner` (for RSVP scroll). */
  const [lowerPanelTopY, setLowerPanelTopY] = useState(0);
  /** Y of join block within lower sheet. */
  const [joinWithinLowerY, setJoinWithinLowerY] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);
  /** Y of proof-related blocks within `lowerPanel` (for Home deep links). */
  const [focusSectionYs, setFocusSectionYs] = useState({ organizer: 0, proof: 0, result: 0 });

  const { event, loading, error, reload } = useEventDetail(eventId);
  const {
    teams,
    loading: teamsLoading,
    error: teamsError,
    refresh: refreshTeams,
  } = useEventTeams(eventId);

  useEffect(() => {
    didAutoScrollToFocus.current = false;
  }, [eventId, focus]);

  useEffect(() => {
    if (!event || loading) return;
    if (focus !== "organizer" && focus !== "proof" && focus !== "result") return;
    if (didAutoScrollToFocus.current) return;
    const relY =
      focus === "organizer"
        ? focusSectionYs.organizer
        : focus === "proof"
          ? focusSectionYs.proof
          : focusSectionYs.result;
    if (relY <= 0) return;
    const y = lowerPanelTopY + relY - 20;
    if (y < 12) return;
    didAutoScrollToFocus.current = true;
    const timer = setTimeout(() => {
      scrollRef.current?.scrollTo({ y: Math.max(0, y), animated: true });
    }, 280);
    return () => clearTimeout(timer);
  }, [
    event,
    loading,
    focus,
    lowerPanelTopY,
    focusSectionYs.organizer,
    focusSectionYs.proof,
    focusSectionYs.result,
  ]);

  const scrollToParticipate = useCallback(() => {
    const joinAbsY = lowerPanelTopY + joinWithinLowerY;
    if (joinAbsY > 40) {
      scrollRef.current?.scrollTo({
        y: Math.max(0, joinAbsY - 12),
        animated: true,
      });
    } else if (contentHeight > 0) {
      scrollRef.current?.scrollTo({
        y: Math.max(0, contentHeight - 360),
        animated: true,
      });
    } else {
      scrollRef.current?.scrollToEnd({ animated: true });
    }
  }, [lowerPanelTopY, joinWithinLowerY, contentHeight]);

  const onShare = useCallback(async (e: ApiEventPublic) => {
    const loc = [e.locationName, e.city, e.state, e.country].filter(Boolean).join(", ");
    try {
      await Share.share({
        title: e.title,
        message: loc ? `${e.title}\n${loc}` : e.title,
      });
    } catch {
      /* user dismissed */
    }
  }, []);

  const headerTopPad = insets.top + 6;

  if (loading && !event) {
    return (
      <View style={[styles.fill, { backgroundColor: HomeColors.bg }]}>
        <StatusBar barStyle="light-content" />
        <ActivityIndicator size="large" color={HomeColors.textMuted} style={styles.loader} />
      </View>
    );
  }

  if (error && !event) {
    return (
      <View style={[styles.fill, { backgroundColor: HomeColors.bg }]}>
        <StatusBar barStyle="light-content" />
        <View style={[styles.errorHeader, { paddingTop: headerTopPad }]}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
            style={({ pressed }) => pressed && styles.iconPressed}
            accessibilityLabel="Go back"
          >
            <Ionicons name="chevron-back" size={28} color={HomeColors.textPrimary} />
          </Pressable>
        </View>
        <View style={styles.errorBody}>
          <Text style={styles.errorTitle}>{error.message}</Text>
          <Pressable style={styles.retryBtn} onPress={() => void reload()}>
            <Text style={styles.retryLabel}>Try again</Text>
          </Pressable>
          <Pressable onPress={() => router.back()}>
            <Text style={styles.linkBack}>Go back</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  if (!event) {
    return null;
  }

  const location = [event.locationName, event.address, event.city, event.state, event.country]
    .filter(Boolean)
    .join(", ");

  const [gTop, gBottom] = gradientColorsForEvent(event.id);
  const heroUri = heroImageUrlForEvent(event);
  const categoryIcon = categoryIconForActivity(event.activityType) as keyof typeof Ionicons.glyphMap;

  const joinOpen =
    (event.status === "PUBLISHED" || event.status === "LIVE") &&
    (event.allowSoloPlayers || event.allowWatchers || event.allowVolunteers);

  const ctaLabel =
    event.status === "CANCELLED"
      ? "Closed"
      : event.status === "DRAFT"
        ? "Hosting"
        : joinOpen
          ? "RSVP"
          : "View event";

  return (
    <View style={styles.fill}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={[gTop, gBottom]}
        locations={[0, 1]}
        style={StyleSheet.absoluteFillObject}
      />

      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={(_, h) => setContentHeight(h)}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
      >
        <View style={styles.inner}>
          <View style={{ height: headerTopPad + 44 }} />

          {heroUri ? (
            <Image
              source={{ uri: heroUri }}
              style={styles.hero}
              contentFit="cover"
              transition={200}
            />
          ) : (
            <View style={styles.hero} />
          )}

          <View style={styles.titleRow}>
            <Text style={styles.title} numberOfLines={3}>
              {event.title}
            </Text>
            <View style={styles.categoryPill}>
              <Ionicons name={categoryIcon} size={16} color={HomeColors.black} />
              <Text style={styles.categoryPillText}>{event.activityType}</Text>
            </View>
          </View>

          <View style={styles.metaBlock}>
            {location ? (
              <MetaRow icon="location-outline" label={location} />
            ) : (
              <MetaRow icon="location-outline" label="Location TBA" />
            )}
            <MetaRow
              icon="calendar-outline"
              label={formatEventDetailWhenLine(event.startsAt)}
            />
            <MetaRow icon="pricetag-outline" label={formatEventEntryFeeLine(event)} />
          </View>

          <GoingAvatars event={event} />

          <Text style={styles.description}>
            {event.description?.trim() || "Details from the host will appear here soon."}
          </Text>

          <View
            style={styles.lowerPanel}
            onLayout={(e) => {
              const y = e.nativeEvent.layout.y;
              setLowerPanelTopY(y);
            }}
          >
            <View
              onLayout={(e) => {
                const y = e.nativeEvent.layout.y;
                setFocusSectionYs((s) => ({ ...s, organizer: y }));
              }}
            >
              {focus === "organizer" ? (
                <ProofFocusBanner icon="clipboard-outline" text="Review pending proof below." />
              ) : null}
              <EventHostDashboardSection event={event} onSaved={() => void reload()} />
              <EventOrganizerSection
                event={event}
                teams={teams}
                onEventChanged={() => void reload()}
              />
            </View>

            <View
              onLayout={(e) => {
                const y = e.nativeEvent.layout.y;
                setJoinWithinLowerY(y);
              }}
            >
              <EventJoinSection event={event} onJoined={() => void reload()} />
            </View>

            <EventTeamsSection
              event={event}
              teams={teams}
              teamsLoading={teamsLoading}
              teamsError={teamsError}
              onTeamsChanged={() => void refreshTeams()}
              onEventChanged={() => void reload()}
            />

            <View
              onLayout={(e) => {
                const y = e.nativeEvent.layout.y;
                setFocusSectionYs((s) => ({ ...s, result: y }));
              }}
            >
              {focus === "result" ? (
                <ProofFocusBanner
                  icon="trophy-outline"
                  text="Review the submitted match result below."
                />
              ) : null}
              <EventTeamAgreementResultsSection
                eventId={event.id}
                teams={teams}
                linkedUserId={linkedUserId}
                highlightMatchId={focusMatchId?.trim() || null}
                onChanged={() => {
                  void refreshTeams();
                  void reload();
                }}
              />
            </View>

            <View
              onLayout={(e) => {
                const y = e.nativeEvent.layout.y;
                setFocusSectionYs((s) => ({ ...s, proof: y }));
              }}
            >
              {focus === "proof" ? (
                <ProofFocusBanner icon="camera-outline" text="Submit proof below." />
              ) : null}
              <EventProofSubmitSection event={event} onSubmitted={() => void reload()} />
            </View>
          </View>
        </View>
      </ScrollView>

      <View
        pointerEvents="box-none"
        style={[styles.topBar, { paddingTop: headerTopPad }]}
      >
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          style={({ pressed }) => [styles.iconBtn, pressed && styles.iconPressed]}
          accessibilityLabel="Back"
        >
          <Ionicons name="chevron-back" size={28} color={HomeColors.white} />
        </Pressable>
        <View style={styles.topBarRight}>
          <Pressable
            onPress={() =>
              Alert.alert(
                event.title,
                "More actions will be available in a future update.",
                [{ text: "OK", style: "default" }],
              )
            }
            hitSlop={12}
            style={({ pressed }) => [styles.iconBtn, pressed && styles.iconPressed]}
            accessibilityLabel="More options"
          >
            <Ionicons name="ellipsis-horizontal" size={22} color={HomeColors.white} />
          </Pressable>
          <Pressable
            onPress={() => void onShare(event)}
            hitSlop={12}
            style={({ pressed }) => [styles.iconBtn, pressed && styles.iconPressed]}
            accessibilityLabel="Share"
          >
            <Ionicons name="share-outline" size={22} color={HomeColors.white} />
          </Pressable>
        </View>
      </View>

      <View
        style={[
          styles.ctaDock,
          {
            paddingBottom: insets.bottom + 14,
            paddingTop: 12,
          },
        ]}
      >
        <Pressable
          onPress={scrollToParticipate}
          style={({ pressed }) => [styles.ctaBtn, pressed && styles.ctaPressed]}
          accessibilityLabel={ctaLabel}
        >
          <Text style={styles.ctaBtnText}>{ctaLabel}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  inner: {
    paddingHorizontal: 20,
  },
  loader: {
    marginTop: "40%",
  },
  hero: {
    width: "100%",
    height: HERO_HEIGHT,
    borderRadius: HERO_RADIUS,
    marginBottom: 22,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 18,
  },
  title: {
    flex: 1,
    color: HomeColors.white,
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.7,
    lineHeight: 34,
    minWidth: 0,
  },
  categoryPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
    backgroundColor: HomeColors.white,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    flexShrink: 0,
  },
  categoryPillText: {
    color: HomeColors.black,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: -0.2,
    textTransform: "capitalize",
    maxWidth: 120,
  },
  metaBlock: {
    gap: 14,
    marginBottom: 22,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  metaIcon: {
    marginTop: 1,
  },
  metaText: {
    flex: 1,
    color: HomeColors.textSecondary,
    fontSize: 15,
    lineHeight: 22,
    letterSpacing: -0.1,
  },
  goingBlock: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 22,
  },
  goingTextCol: {
    flex: 1,
    minWidth: 0,
  },
  avatarStack: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarRing: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "rgba(15,23,42,0.95)",
    overflow: "hidden",
  },
  avatarRingOverlap: {
    marginLeft: -12,
  },
  avatarPlaceholderRing: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: HomeColors.surface,
  },
  moreGoingChip: {
    marginLeft: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  moreGoingChipOverlap: {
    marginLeft: 4,
  },
  moreGoingChipText: {
    color: HomeColors.textSecondary,
    fontSize: 13,
    fontWeight: "700",
  },
  avatarImg: {
    width: "100%",
    height: "100%",
  },
  goingLabel: {
    color: HomeColors.textSecondary,
    fontSize: 15,
    fontWeight: "600",
    letterSpacing: -0.2,
  },
  goingSubLabel: {
    marginTop: 4,
    color: HomeColors.textMuted,
    fontSize: 13,
    fontWeight: "500",
    lineHeight: 18,
  },
  description: {
    color: HomeColors.textSecondary,
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: -0.1,
    marginBottom: 28,
  },
  lowerPanel: {
    marginHorizontal: -20,
    paddingHorizontal: 0,
    paddingTop: 8,
    paddingBottom: 24,
    backgroundColor: HomeColors.card,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: HomeColors.border,
    overflow: "hidden",
  },
  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    zIndex: 20,
  },
  topBarRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconBtn: {
    padding: 8,
  },
  iconPressed: {
    opacity: 0.65,
  },
  ctaDock: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    backgroundColor: "rgba(11,15,20,0.94)",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: HomeColors.border,
  },
  ctaBtn: {
    backgroundColor: HomeColors.white,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaPressed: {
    opacity: 0.92,
  },
  ctaBtnText: {
    color: HomeColors.black,
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: 0.6,
  },
  errorHeader: {
    flexDirection: "row",
    paddingHorizontal: 12,
  },
  errorBody: {
    paddingHorizontal: 24,
    paddingTop: 24,
    gap: 16,
    alignItems: "center",
  },
  errorTitle: {
    color: HomeColors.textSecondary,
    fontSize: 16,
    textAlign: "center",
    lineHeight: 22,
  },
  retryBtn: {
    backgroundColor: HomeColors.white,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  retryLabel: {
    color: HomeColors.black,
    fontWeight: "700",
  },
  linkBack: {
    color: HomeColors.textMuted,
    fontSize: 15,
    textDecorationLine: "underline",
  },
  focusBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: HomeColors.border,
  },
  focusBannerText: {
    flex: 1,
    color: HomeColors.textPrimary,
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20,
  },
});
