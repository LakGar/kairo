import { useLayoutEffect } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
} from "react-native";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { EventJoinSection } from "@/src/features/events/event-join-section";
import { EventOrganizerSection } from "@/src/features/events/event-organizer-section";
import { EventProofSubmitSection } from "@/src/features/events/event-proof-submit-section";
import { EventTeamsSection } from "@/src/features/events/event-teams-section";
import { formatEventRange } from "@/src/features/events/format-event-range";
import { useEventDetail } from "@/src/features/events/use-event-detail";
import { useEventTeams } from "@/src/features/events/use-event-teams";

export default function EventDetailScreen() {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const navigation = useNavigation();
  const router = useRouter();
  const { event, loading, error, reload } = useEventDetail(eventId);
  const {
    teams,
    loading: teamsLoading,
    error: teamsError,
    refresh: refreshTeams,
  } = useEventTeams(eventId);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: event?.title ?? "Event",
    });
  }, [navigation, event?.title]);

  if (loading && !event) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator size="large" />
      </ThemedView>
    );
  }

  if (error && !event) {
    return (
      <ThemedView style={styles.centered}>
        <ThemedText type="subtitle" style={styles.centerText}>
          {error.message}
        </ThemedText>
        <Pressable style={styles.button} onPress={() => void reload()}>
          <ThemedText style={styles.buttonLabel}>Try again</ThemedText>
        </Pressable>
        <Pressable onPress={() => router.back()}>
          <ThemedText type="link">Go back</ThemedText>
        </Pressable>
      </ThemedView>
    );
  }

  if (!event) {
    return null;
  }

  const organizerName =
    event.organizer.profile?.name ??
    event.organizer.profile?.username ??
    event.organizer.email;

  const location = [event.locationName, event.city, event.state, event.country]
    .filter(Boolean)
    .join(", ");

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <ThemedView style={styles.block}>
        <ThemedText type="muted">{formatEventRange(event.startsAt, event.endsAt)}</ThemedText>
        <ThemedText type="title" style={styles.heading}>
          {event.title}
        </ThemedText>
        <ThemedText type="default">{event.activityType}</ThemedText>
        {location ? (
          <ThemedText type="muted" style={styles.gapTop}>
            {location}
          </ThemedText>
        ) : null}
        <ThemedText type="small" style={styles.gapTop}>
          Hosted by {organizerName}
        </ThemedText>
      </ThemedView>

      <ThemedView style={styles.block}>
        <ThemedText type="subtitle">About</ThemedText>
        <ThemedText type="default" style={styles.gapTop}>
          {event.description?.trim() || "No description yet."}
        </ThemedText>
      </ThemedView>

      <ThemedView style={styles.block}>
        <ThemedText type="subtitle">At a glance</ThemedText>
        <ThemedText type="default" style={styles.gapTop}>
          Status: {event.status.replaceAll("_", " ")}
        </ThemedText>
        <ThemedText type="default">Format: {event.format.replaceAll("_", " ")}</ThemedText>
        <ThemedText type="default">
          Teams {event._count.teams} · Participants {event._count.participants} · Matches{" "}
          {event._count.matches}
        </ThemedText>
      </ThemedView>

      <EventOrganizerSection
        event={event}
        teams={teams}
        onEventChanged={() => void reload()}
      />

      <EventJoinSection event={event} onJoined={() => void reload()} />

      <EventTeamsSection
        event={event}
        teams={teams}
        teamsLoading={teamsLoading}
        teamsError={teamsError}
        onTeamsChanged={() => void refreshTeams()}
        onEventChanged={() => void reload()}
      />

      <EventProofSubmitSection event={event} onSubmitted={() => void reload()} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingBottom: 32,
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
  block: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 6,
  },
  heading: {
    marginTop: 4,
  },
  gapTop: {
    marginTop: 8,
  },
  button: {
    backgroundColor: "#0a7ea4",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  buttonLabel: {
    color: "#fff",
    fontWeight: "600",
  },
});
