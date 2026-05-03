import { Pressable, StyleSheet, View, Platform } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useThemeColor } from "@/hooks/use-theme-color";
import { useUIPalette } from "@/hooks/use-ui-palette";
import type { ApiEventPublic } from "@/src/api";

import { formatEventStartsAt } from "./format-event-range";

type Props = {
  event: ApiEventPublic;
  onPress: () => void;
};

function statusColors(
  status: string,
  ui: ReturnType<typeof useUIPalette>,
  tint: string,
  mutedFg: string,
): { bg: string; fg: string; label: string } {
  const s = status.replaceAll("_", " ");
  switch (status) {
    case "PUBLISHED":
      return { bg: `${tint}22`, fg: tint, label: s };
    case "LIVE":
      return { bg: "rgba(46, 125, 50, 0.2)", fg: "#2E7D32", label: s };
    case "DRAFT":
      return { bg: ui.segmentTrack, fg: mutedFg, label: s };
    case "CANCELLED":
      return { bg: `${ui.danger}33`, fg: ui.danger, label: s };
    default:
      return { bg: ui.segmentTrack, fg: tint, label: s };
  }
}

export function EventListRow({ event, onPress }: Props) {
  const ui = useUIPalette();
  const tint = useThemeColor({}, "tint");
  const mutedFg = useThemeColor({}, "icon");
  const meta = [
    event.activityType,
    event.city ?? event.locationName,
    `${event._count.participants} joined`,
  ]
    .filter(Boolean)
    .join(" · ");

  const pill = statusColors(event.status, ui, tint, mutedFg);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: ui.card,
          borderColor: ui.cardBorder,
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
        <ThemedText type="subtitle" numberOfLines={2} style={styles.title}>
          {event.title}
        </ThemedText>
        <View style={[styles.pill, { backgroundColor: pill.bg }]}>
          <ThemedText
            type="small"
            style={[styles.pillText, { color: pill.fg }]}
          >
            {pill.label}
          </ThemedText>
        </View>
      </View>
      <ThemedText type="muted" numberOfLines={1} style={styles.date}>
        {formatEventStartsAt(event.startsAt)}
      </ThemedText>
      {meta ? (
        <ThemedText type="small" numberOfLines={2} style={styles.meta}>
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
