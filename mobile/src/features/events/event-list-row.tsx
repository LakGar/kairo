import { Pressable, StyleSheet, View, Platform } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useThemeColor } from "@/hooks/use-theme-color";
import { useUIPalette } from "@/hooks/use-ui-palette";
import { useHomeColors } from "@/src/features/home/home-theme";
import type { ApiEventPublic, ApiHomeEventSummary } from "@/src/api";

import { formatEventStartsAt } from "./format-event-range";

export type EventListRowEvent = ApiEventPublic | ApiHomeEventSummary;

function listParticipantCount(e: EventListRowEvent): number {
  if ("participantCount" in e && typeof e.participantCount === "number") {
    return e.participantCount;
  }
  if ("_count" in e && e._count?.participants != null) {
    return e._count.participants;
  }
  return 0;
}

type Props = {
  event: EventListRowEvent;
  onPress: () => void;
  /** Match Home / Discover dark feed when the app color scheme is still “light”. */
  appearance?: "default" | "feedDark";
};

function statusColors(
  status: string,
  ui: ReturnType<typeof useUIPalette>,
  tint: string,
  mutedFg: string,
  feedDark: boolean,
  dangerColor: string,
): { bg: string; fg: string; label: string } {
  const s = status.replaceAll("_", " ");
  const track = feedDark ? "rgba(255,255,255,0.12)" : ui.segmentTrack;
  const danger = feedDark ? dangerColor : ui.danger;
  switch (status) {
    case "PUBLISHED":
      return { bg: `${tint}22`, fg: tint, label: s };
    case "LIVE":
      return { bg: "rgba(46, 125, 50, 0.2)", fg: "#2E7D32", label: s };
    case "DRAFT":
      return { bg: track, fg: mutedFg, label: s };
    case "CANCELLED":
      return { bg: `${danger}33`, fg: danger, label: s };
    default:
      return { bg: track, fg: tint, label: s };
  }
}

export function EventListRow({ event, onPress, appearance = "default" }: Props) {
  const ui = useUIPalette();
  const home = useHomeColors();
  const feedDark = appearance === "feedDark";
  const themeTint = useThemeColor({}, "tint");
  const themeText = useThemeColor({}, "text");
  const themeIcon = useThemeColor({}, "icon");
  /** Neutral chrome on dark feed (no saturated accent). */
  const tint = feedDark ? "#D4D4D8" : themeTint;
  const mutedFg = feedDark ? home.textMuted : themeIcon;
  const meta = [
    event.activityType,
    event.city ?? event.locationName,
    `${listParticipantCount(event)} joined`,
  ]
    .filter(Boolean)
    .join(" · ");

  const pill = statusColors(event.status, ui, tint, mutedFg, feedDark, home.danger);

  const cardBg = feedDark ? home.card : ui.card;
  const cardBr = feedDark ? home.border : ui.cardBorder;
  const fg = feedDark ? home.textPrimary : themeText;
  const fgMuted = feedDark ? home.textMuted : themeIcon;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: cardBg,
          borderColor: cardBr,
          opacity: pressed ? 0.92 : 1,
        },
        Platform.select({
          ios: {
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.06,
            shadowRadius: 8,
          },
          android: { elevation: 2 },
          default: {},
        }),
      ]}
    >
      <View style={styles.topRow}>
        <ThemedText
          type="subtitle"
          numberOfLines={2}
          style={styles.title}
          lightColor={feedDark ? fg : undefined}
          darkColor={feedDark ? fg : undefined}
        >
          {event.title}
        </ThemedText>
        <View style={[styles.pill, { backgroundColor: pill.bg }]}>
          <ThemedText
            type="small"
            style={[styles.pillText, { color: pill.fg }]}
            lightColor={feedDark ? pill.fg : undefined}
            darkColor={feedDark ? pill.fg : undefined}
          >
            {pill.label}
          </ThemedText>
        </View>
      </View>
      <ThemedText
        type="muted"
        numberOfLines={1}
        style={styles.date}
        lightColor={feedDark ? fgMuted : undefined}
        darkColor={feedDark ? fgMuted : undefined}
      >
        {formatEventStartsAt(event.startsAt)}
      </ThemedText>
      {meta ? (
        <ThemedText
          type="small"
          numberOfLines={2}
          style={styles.meta}
          lightColor={feedDark ? fgMuted : undefined}
          darkColor={feedDark ? fgMuted : undefined}
        >
          {meta}
        </ThemedText>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    gap: 6,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 10,
  },
  title: {
    fontSize: 18,
    lineHeight: 24,
    flex: 1,
  },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    flexShrink: 0,
  },
  pillText: {
    fontWeight: "700",
    fontSize: 11,
    letterSpacing: 0.4,
  },
  date: {
    marginTop: 2,
  },
  meta: {
    marginTop: 2,
    opacity: 0.85,
  },
});
