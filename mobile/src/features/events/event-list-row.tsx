import { Pressable, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useThemeColor } from "@/hooks/use-theme-color";
import type { ApiEventPublic } from "@/src/api";

import { formatEventStartsAt } from "./format-event-range";

type Props = {
  event: ApiEventPublic;
  onPress: () => void;
};

export function EventListRow({ event, onPress }: Props) {
  const border = useThemeColor({ light: "#E8E8EC", dark: "#2C2C2E" }, "icon");
  const meta = [
    event.activityType,
    event.city ?? event.locationName,
    `${event._count.participants} joined`,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        { borderBottomColor: border },
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.textBlock}>
        <ThemedText type="subtitle" numberOfLines={2} style={styles.title}>
          {event.title}
        </ThemedText>
        <ThemedText type="muted" numberOfLines={1}>
          {formatEventStartsAt(event.startsAt)}
        </ThemedText>
        {meta ? (
          <ThemedText type="small" numberOfLines={1} style={styles.meta}>
            {meta}
          </ThemedText>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  pressed: {
    opacity: 0.85,
  },
  textBlock: {
    gap: 4,
  },
  title: {
    fontSize: 18,
    lineHeight: 24,
  },
  meta: {
    marginTop: 2,
  },
});
