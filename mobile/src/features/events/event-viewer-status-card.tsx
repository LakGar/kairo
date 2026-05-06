import { Ionicons } from "@expo/vector-icons";
import {
  getDefaultResultVerificationModeForEventFormat,
  type EventFormatValue,
} from "@kairo/shared";
import { StyleSheet, Text, View } from "react-native";

import type {
  ApiEventDetailPrimaryState,
  ApiEventPublic,
  ApiEventViewerContext,
} from "@/src/api";
import { HomeColors } from "@/src/features/home/home-tokens";

type Props = {
  event: ApiEventPublic;
  viewerContext: ApiEventViewerContext | null | undefined;
  /** Fallback when API omits viewerContext (older server). */
  fallbackPrimaryState: ApiEventDetailPrimaryState;
};

function verificationLine(format: string): string {
  const mode = getDefaultResultVerificationModeForEventFormat(format as EventFormatValue);
  return mode === "TEAM_AGREEMENT"
    ? "Results: team agreement between sides"
    : "Results: organizer decides";
}

export function EventViewerStatusCard({
  event,
  viewerContext,
  fallbackPrimaryState,
}: Props) {
  const primary = viewerContext?.primaryState ?? fallbackPrimaryState;
  const teams = viewerContext?.teamMemberships ?? [];

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <Ionicons name="person-circle-outline" size={22} color={HomeColors.textPrimary} />
        <Text style={styles.title}>Your status</Text>
      </View>

      {primary === "NOT_JOINED" ? (
        <>
          <Text style={styles.body}>You’re viewing this event.</Text>
          <Text style={styles.muted}>
            Join as a player, create or join a team, watch, or volunteer — whatever the host allows.
          </Text>
        </>
      ) : null}

      {primary === "WAITLISTED" ? (
        <>
          <Text style={styles.body}>You’re on the waitlist.</Text>
          <Text style={styles.muted}>
            The organizer will let you know if a spot opens. You can’t submit proof or change results
            yet.
          </Text>
        </>
      ) : null}

      {primary === "ORGANIZER" ? (
        <>
          <Text style={styles.body}>You’re hosting this event.</Text>
          {viewerContext?.organizerStats ? (
            <Text style={styles.muted}>
              {viewerContext.organizerStats.proofPendingCount} proof
              {viewerContext.organizerStats.proofPendingCount === 1 ? "" : "s"} pending
              {viewerContext.organizerStats.matchResultsPendingConfirmation > 0
                ? ` · ${viewerContext.organizerStats.matchResultsPendingConfirmation} result(s) awaiting confirmation`
                : ""}
              {viewerContext.organizerStats.matchResultsDisputed > 0
                ? ` · ${viewerContext.organizerStats.matchResultsDisputed} disputed`
                : ""}
            </Text>
          ) : (
            <Text style={styles.muted}>Use organizer tools below to publish, matches, and proof.</Text>
          )}
        </>
      ) : null}

      {primary === "PARTICIPANT" ? (
        <>
          <Text style={styles.body}>You’re participating.</Text>
          {teams.length > 0 ? (
            <Text style={styles.muted}>
              {teams.map((t) => `${t.teamName} (${t.role === "CAPTAIN" ? "Captain" : "Member"})`).join(" · ")}
            </Text>
          ) : (
            <Text style={styles.muted}>Solo / player registration.</Text>
          )}
          <Text style={styles.detail}>{verificationLine(event.format)}</Text>
        </>
      ) : null}

      {primary === "WATCHER" ? (
        <>
          <Text style={styles.body}>You’re watching.</Text>
          <Text style={styles.muted}>
            This role doesn’t affect your Kairo Score yet. Follow along with schedule, teams, and
            results below.
          </Text>
        </>
      ) : null}

      {primary === "VOLUNTEER" ? (
        <>
          <Text style={styles.body}>You’re volunteering.</Text>
          <Text style={styles.muted}>
            Check the event description and host messages for instructions. This role doesn’t affect
            your Kairo Score yet.
          </Text>
        </>
      ) : null}

      {primary === "INVITED" ? (
        <Text style={styles.muted}>Invitation details will appear here when invites are enabled.</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
    padding: 14,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: HomeColors.border,
    gap: 6,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  title: {
    color: HomeColors.textPrimary,
    fontSize: 16,
    fontWeight: "800",
  },
  body: {
    color: HomeColors.textSecondary,
    fontSize: 15,
    fontWeight: "600",
    lineHeight: 20,
  },
  muted: {
    color: HomeColors.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  detail: {
    marginTop: 4,
    color: HomeColors.textMuted,
    fontSize: 12,
    fontWeight: "600",
  },
});
