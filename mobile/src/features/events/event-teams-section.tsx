import { useUser } from "@clerk/expo";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { createTeamSchema } from "@kairo/shared";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { FeatureEmptyState } from "@/src/components/feature-empty-state";
import { useThemeColor } from "@/hooks/use-theme-color";
import {
  createKairoApiFromEnv,
  getLinkedKairoUserId,
  KairoApiConfigurationError,
  KairoApiError,
  type ApiEventPublic,
  type ApiTeamPublic,
} from "@/src/api";

function displayName(user: ApiTeamPublic["captain"]): string {
  return user.profile?.name ?? user.profile?.username ?? user.email;
}

function isOnTeam(team: ApiTeamPublic, userId: string | undefined): boolean {
  if (!userId) return false;
  if (team.captainId === userId) return true;
  return team.members.some((m) => m.userId === userId);
}

type Props = {
  event: ApiEventPublic;
  teams: ApiTeamPublic[];
  teamsLoading: boolean;
  teamsError: string | null;
  onTeamsChanged: () => void;
  onEventChanged: () => void;
  /** List teams only (no create / join / leave) for public or spectator roles. */
  previewOnly?: boolean;
};

export function EventTeamsSection({
  event,
  teams,
  teamsLoading,
  teamsError,
  onTeamsChanged,
  onEventChanged,
  previewOnly = false,
}: Props) {
  const { user } = useUser();
  const linkedUserId = getLinkedKairoUserId(user);
  const borderColor = useThemeColor({ light: "#C6C6C8", dark: "#3A3A3C" }, "icon");
  const surface = useThemeColor({ light: "#F2F2F7", dark: "#1C1C1E" }, "background");
  const textColor = useThemeColor({}, "text");
  const textMuted = useThemeColor({}, "tabIconDefault");
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [createBusy, setCreateBusy] = useState(false);
  const [actionBusyId, setActionBusyId] = useState<string | null>(null);
  const [banner, setBanner] = useState<string | null>(null);

  const canUseTeams =
    !previewOnly &&
    (event.status === "PUBLISHED" || event.status === "LIVE") &&
    event.allowTeams;

  const atTeamCap = useMemo(() => {
    if (event.maxTeams == null) return false;
    return teams.length >= event.maxTeams;
  }, [event.maxTeams, teams.length]);

  const onCreateTeam = async () => {
    const parsed = createTeamSchema.safeParse({
      name: newName,
      description: newDesc.trim() === "" ? undefined : newDesc.trim(),
    });
    if (!parsed.success) {
      const first = parsed.error.flatten().fieldErrors.name?.[0] ?? parsed.error.message;
      setBanner(first);
      return;
    }
    setCreateBusy(true);
    setBanner(null);
    try {
      const api = createKairoApiFromEnv({ userId: linkedUserId });
      await api.createTeam(event.id, parsed.data);
      setNewName("");
      setNewDesc("");
      setBanner("Team created.");
      onTeamsChanged();
      onEventChanged();
    } catch (e) {
      if (e instanceof KairoApiError) setBanner(e.message);
      else if (e instanceof KairoApiConfigurationError) setBanner(e.message);
      else setBanner(e instanceof Error ? e.message : "Could not create team.");
    } finally {
      setCreateBusy(false);
    }
  };

  const onJoinTeam = async (teamId: string) => {
    setActionBusyId(teamId);
    setBanner(null);
    try {
      const api = createKairoApiFromEnv({ userId: linkedUserId });
      await api.joinTeam(teamId);
      setBanner("Joined team.");
      onTeamsChanged();
      onEventChanged();
    } catch (e) {
      if (e instanceof KairoApiError) setBanner(e.message);
      else if (e instanceof KairoApiConfigurationError) setBanner(e.message);
      else setBanner(e instanceof Error ? e.message : "Could not join team.");
    } finally {
      setActionBusyId(null);
    }
  };

  const onLeaveTeam = async (teamId: string) => {
    setActionBusyId(teamId);
    setBanner(null);
    try {
      const api = createKairoApiFromEnv({ userId: linkedUserId });
      await api.leaveTeam(teamId);
      setBanner("Left team.");
      onTeamsChanged();
      onEventChanged();
    } catch (e) {
      if (e instanceof KairoApiError) setBanner(e.message);
      else if (e instanceof KairoApiConfigurationError) setBanner(e.message);
      else setBanner(e instanceof Error ? e.message : "Could not leave team.");
    } finally {
      setActionBusyId(null);
    }
  };

  if (!event.allowTeams) {
    return (
      <ThemedView style={styles.block}>
        <ThemedText type="subtitle">Teams</ThemedText>
        <ThemedText type="muted" style={styles.gapTop}>
          This event is not using teams.
        </ThemedText>
      </ThemedView>
    );
  }

  if (event.status === "DRAFT") {
    return (
      <ThemedView style={styles.block}>
        <ThemedText type="subtitle">Teams</ThemedText>
        <ThemedText type="muted" style={styles.gapTop}>
          Create and join teams after the event is published.
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.block}>
      <ThemedText type="subtitle">Teams</ThemedText>
      {banner ? (
        <ThemedText type="small" style={styles.banner}>
          {banner}
        </ThemedText>
      ) : null}
      {teamsError ? (
        <ThemedText type="small" style={styles.err}>
          {teamsError}
        </ThemedText>
      ) : null}

      {teamsLoading ? (
        <ActivityIndicator style={styles.loader} />
      ) : teams.length === 0 ? (
        <FeatureEmptyState
          colors={{
            textPrimary: textColor,
            textMuted,
            icon: borderColor,
          }}
          icon="people-outline"
          title="No teams yet"
          subtitle={
            previewOnly
              ? "Join the event as a player to create or join a team."
              : canUseTeams
                ? "Be the first to create a team with the form below."
                : "Teams are not available for this event."
          }
          compact
        />
      ) : (
        <View style={styles.list}>
          {teams.map((team) => {
            const onTeam = isOnTeam(team, linkedUserId);
            const busy = actionBusyId === team.id;
            return (
              <View key={team.id} style={[styles.card, { borderColor }]}>
                <ThemedText type="default" style={styles.teamTitle}>
                  {team.name}
                </ThemedText>
                <ThemedText type="muted" numberOfLines={2}>
                  Captain: {displayName(team.captain)} · {team.members.length} member
                  {team.members.length === 1 ? "" : "s"}
                </ThemedText>
                {canUseTeams ? (
                  <View style={styles.row}>
                    {onTeam ? (
                      <Pressable
                        style={[styles.secondary, busy && styles.disabled]}
                        onPress={() => void onLeaveTeam(team.id)}
                        disabled={busy}
                      >
                        {busy ? (
                          <ActivityIndicator />
                        ) : (
                          <ThemedText type="small" style={styles.secondaryLabel}>
                            Leave team
                          </ThemedText>
                        )}
                      </Pressable>
                    ) : (
                      <Pressable
                        style={[styles.primary, busy && styles.disabled]}
                        onPress={() => void onJoinTeam(team.id)}
                        disabled={busy}
                      >
                        {busy ? (
                          <ActivityIndicator color="#fff" />
                        ) : (
                          <ThemedText style={styles.primaryLabel}>Join team</ThemedText>
                        )}
                      </Pressable>
                    )}
                  </View>
                ) : null}
              </View>
            );
          })}
        </View>
      )}

      {canUseTeams && !atTeamCap ? (
        <View style={[styles.createBox, { borderTopColor: borderColor }]}>
          <ThemedText type="default" style={styles.createTitle}>
            New team
          </ThemedText>
          <TextInput
            value={newName}
            onChangeText={setNewName}
            placeholder="Team name"
            placeholderTextColor="#8E8E93"
            style={[styles.input, { borderColor, backgroundColor: surface, color: textColor }]}
          />
          <TextInput
            value={newDesc}
            onChangeText={setNewDesc}
            placeholder="Short description (optional)"
            placeholderTextColor="#8E8E93"
            style={[styles.input, { borderColor, backgroundColor: surface, color: textColor }]}
          />
          <Pressable
            style={[styles.primary, createBusy && styles.disabled]}
            onPress={() => void onCreateTeam()}
            disabled={createBusy}
          >
            {createBusy ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <ThemedText style={styles.primaryLabel}>Create team (you are captain)</ThemedText>
            )}
          </Pressable>
        </View>
      ) : atTeamCap ? (
        <ThemedText type="muted" style={styles.gapTop}>
          Team capacity reached for this event.
        </ThemedText>
      ) : null}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  block: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 8,
  },
  gapTop: {
    marginTop: 4,
  },
  loader: {
    marginVertical: 12,
  },
  list: {
    gap: 12,
    marginTop: 8,
  },
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  teamTitle: {
    fontWeight: "600",
  },
  row: {
    marginTop: 4,
  },
  primary: {
    backgroundColor: "#0a7ea4",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  primaryLabel: {
    color: "#fff",
    fontWeight: "700",
  },
  secondary: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#0a7ea4",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  secondaryLabel: {
    color: "#0a7ea4",
    fontWeight: "600",
  },
  disabled: {
    opacity: 0.6,
  },
  createBox: {
    marginTop: 16,
    gap: 8,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  createTitle: {
    fontWeight: "600",
  },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  warn: {
    color: "#B45309",
  },
  banner: {
    marginTop: 4,
  },
  err: {
    color: "#B91C1C",
  },
});
