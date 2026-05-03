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
import { EventListRow } from "@/src/features/events/event-list-row";
import { useMyEvents } from "@/src/features/events/use-my-events";
import type { ApiEventPublic } from "@/src/api";

type Segment = "hosting" | "attending";

export default function MyEventsScreen() {
  const router = useRouter();
  const tint = useThemeColor({}, "tint");
  const borderColor = useThemeColor({ light: "#C6C6C8", dark: "#3A3A3C" }, "icon");
  const { hosting, attending, loading, refreshing, error, refresh } = useMyEvents();
  const [segment, setSegment] = useState<Segment>("hosting");

  const data = useMemo(() => {
    return segment === "hosting" ? hosting : attending;
  }, [segment, hosting, attending]);

  const onOpen = (event: ApiEventPublic) => {
    router.push(`/(tabs)/events/${event.id}`);
  };

  return (
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
      <ThemedView style={styles.pad}>
        <ThemedText type="muted">
          Events you organize and events you have joined (dev API user).
        </ThemedText>
      </ThemedView>

      <View style={[styles.segmentWrap, { borderColor }]}>
        <Pressable
          onPress={() => setSegment("hosting")}
          style={[
            styles.segmentBtn,
            segment === "hosting" && { borderBottomColor: tint, borderBottomWidth: 2 },
          ]}
        >
          <ThemedText type={segment === "hosting" ? "default" : "muted"}>
            Hosting ({hosting.length})
          </ThemedText>
        </Pressable>
        <Pressable
          onPress={() => setSegment("attending")}
          style={[
            styles.segmentBtn,
            segment === "attending" && { borderBottomColor: tint, borderBottomWidth: 2 },
          ]}
        >
          <ThemedText type={segment === "attending" ? "default" : "muted"}>
            Attending ({attending.length})
          </ThemedText>
        </Pressable>
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
          <Pressable style={styles.button} onPress={() => void refresh()}>
            <ThemedText style={styles.buttonLabel}>Retry</ThemedText>
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
  segmentWrap: {
    flexDirection: "row",
    marginHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
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
    backgroundColor: "#0a7ea4",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  buttonLabel: {
    color: "#fff",
    fontWeight: "600",
  },
});
