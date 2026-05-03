import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useThemeColor } from "@/hooks/use-theme-color";
import { useUIPalette } from "@/hooks/use-ui-palette";
import { EventListRow } from "@/src/features/events/event-list-row";
import { useMyEvents } from "@/src/features/events/use-my-events";
import type { ApiEventPublic } from "@/src/api";

type Segment = "hosting" | "attending";

export default function MyEventsScreen() {
  const router = useRouter();
  const ui = useUIPalette();
  const tint = useThemeColor({}, "tint");
  const { hosting, attending, loading, refreshing, error, refresh } = useMyEvents();
  const [segment, setSegment] = useState<Segment>("hosting");

  const data = useMemo(() => {
    return segment === "hosting" ? hosting : attending;
  }, [segment, hosting, attending]);

  const onOpen = (event: ApiEventPublic) => {
    router.push(`/(tabs)/events/${event.id}`);
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: ui.groupedBackground }]} edges={["bottom"]}>
      <ThemedView style={styles.pad}>
        <ThemedText type="muted">
          Events you organize and events you have joined (dev API user).
        </ThemedText>
      </ThemedView>

      <View style={styles.segmentOuter}>
        <View style={[styles.segmentTrack, { backgroundColor: ui.segmentTrack }]}>
          <Pressable
            onPress={() => setSegment("hosting")}
            style={[
              styles.segmentBtn,
              segment === "hosting" && {
                backgroundColor: ui.segmentActive,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.08,
                shadowRadius: 3,
              },
            ]}
          >
            <ThemedText
              type="small"
              style={[
                styles.segmentLabel,
                segment === "hosting" ? styles.segmentLabelOn : styles.segmentLabelOff,
                segment === "hosting" && { color: tint },
              ]}
            >
              Hosting · {hosting.length}
            </ThemedText>
          </Pressable>
          <Pressable
            onPress={() => setSegment("attending")}
            style={[
              styles.segmentBtn,
              segment === "attending" && {
                backgroundColor: ui.segmentActive,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.08,
                shadowRadius: 3,
              },
            ]}
          >
            <ThemedText
              type="small"
              style={[
                styles.segmentLabel,
                segment === "attending" ? styles.segmentLabelOn : styles.segmentLabelOff,
                segment === "attending" && { color: tint },
              ]}
            >
              Attending · {attending.length}
            </ThemedText>
          </Pressable>
        </View>
      </View>

      {loading && !refreshing ? (
        <ThemedView style={styles.centered}>
          <ActivityIndicator size="large" />
          <ThemedText type="muted">Loading your events…</ThemedText>
        </ThemedView>
      ) : error ? (
        <ThemedView style={styles.centered}>
          <ThemedText type="subtitle" style={styles.centerText}>
            {error.message}
          </ThemedText>
          <Pressable
            style={[styles.button, { backgroundColor: tint }]}
            onPress={() => void refresh()}
          >
            <ThemedText style={[styles.buttonLabel, { color: ui.linkOnTint }]}>Retry</ThemedText>
          </Pressable>
        </ThemedView>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => void refresh()} />
          }
          ListEmptyComponent={
            <ThemedView style={styles.empty}>
              <ThemedText type="subtitle">
                {segment === "hosting" ? "No events you host yet" : "Not attending any events yet"}
              </ThemedText>
              <ThemedText type="muted" style={styles.emptySub}>
                {segment === "hosting"
                  ? "Create an event from the Create tab, then publish when you are ready."
                  : "Browse Discover and join an event as player, watcher, or volunteer."}
              </ThemedText>
            </ThemedView>
          }
          renderItem={({ item }) => (
            <EventListRow event={item} onPress={() => onOpen(item)} />
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  pad: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
  },
  segmentOuter: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  segmentTrack: {
    flexDirection: "row",
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  segmentLabel: {
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  segmentLabelOn: {
    opacity: 1,
  },
  segmentLabelOff: {
    opacity: 0.55,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 24,
    flexGrow: 1,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    gap: 16,
  },
  centerText: {
    textAlign: "center",
  },
  empty: {
    paddingVertical: 40,
    paddingHorizontal: 12,
    alignItems: "center",
    gap: 8,
  },
  emptySub: {
    textAlign: "center",
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 14,
  },
  buttonLabel: {
    fontWeight: "700",
    fontSize: 16,
  },
});
