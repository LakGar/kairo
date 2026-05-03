import { useUser } from "@clerk/expo";
import { useRouter } from "expo-router";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { EventListRow } from "@/src/features/events/event-list-row";
import { useUpcomingEvents } from "@/src/features/events/use-upcoming-events";
import type { ApiEventPublic } from "@/src/api";

export default function DiscoverScreen() {
  const { user } = useUser();
  const router = useRouter();
  const { events, loading, refreshing, error, refresh } = useUpcomingEvents();

  const onOpenEvent = (event: ApiEventPublic) => {
    router.push(`/(tabs)/events/${event.id}`);
  };

  return (
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
      <ThemedView style={styles.header}>
        <ThemedText type="muted">
          Upcoming published events. Pull down to refresh.
        </ThemedText>
        {user?.emailAddresses[0]?.emailAddress ? (
          <ThemedText type="small" numberOfLines={1} style={styles.signedIn}>
            Signed in as {user.emailAddresses[0].emailAddress}
          </ThemedText>
        ) : null}
      </ThemedView>

      {loading && !refreshing ? (
        <ThemedView style={styles.centered}>
          <ActivityIndicator size="large" />
          <ThemedText type="muted">Loading events…</ThemedText>
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
          data={events}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => void refresh()} />
          }
          ListEmptyComponent={
            <ThemedView style={styles.empty}>
              <ThemedText type="subtitle">No upcoming events</ThemedText>
              <ThemedText type="muted" style={styles.emptySub}>
                Published events with a future start date appear here once your API and
                database are set up.
              </ThemedText>
            </ThemedView>
          }
          renderItem={({ item }) => (
            <EventListRow event={item} onPress={() => onOpenEvent(item)} />
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
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
    gap: 6,
  },
  signedIn: {
    marginTop: 4,
    opacity: 0.85,
  },
  listContent: {
    paddingHorizontal: 16,
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
    paddingVertical: 48,
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
