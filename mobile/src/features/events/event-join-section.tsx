import { useUser } from "@clerk/expo";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, TextInput, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useThemeColor } from "@/hooks/use-theme-color";
import {
  createKairoApiFromEnv,
  getLinkedKairoUserId,
  KairoApiConfigurationError,
  KairoApiError,
  type ApiEventDetailPrimaryState,
  type ApiEventPublic,
} from "@/src/api";

type JoinRole = "PLAYER" | "WATCHER" | "VOLUNTEER";

type Props = {
  event: ApiEventPublic;
  onJoined: () => void;
  /** From `viewerContext.primaryState` on event detail; hides join when already registered. */
  viewerPrimaryState?: ApiEventDetailPrimaryState | null;
};

export function EventJoinSection({ event, onJoined, viewerPrimaryState }: Props) {
  const { user } = useUser();
  const linkedUserId = getLinkedKairoUserId(user);
  const borderColor = useThemeColor({ light: "#C6C6C8", dark: "#3A3A3C" }, "icon");
  const surface = useThemeColor({ light: "#F2F2F7", dark: "#1C1C1E" }, "background");
  const textColor = useThemeColor({}, "text");
  const tint = useThemeColor({}, "tint");

  const roleOptions = useMemo(() => {
    const opts: JoinRole[] = [];
    if (event.allowSoloPlayers) opts.push("PLAYER");
    if (event.allowWatchers) opts.push("WATCHER");
    if (event.allowVolunteers) opts.push("VOLUNTEER");
    return opts;
  }, [event.allowSoloPlayers, event.allowWatchers, event.allowVolunteers]);

  const [role, setRole] = useState<JoinRole>("PLAYER");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (roleOptions.length > 0 && !roleOptions.includes(role)) {
      setRole(roleOptions[0]!);
    }
  }, [roleOptions, role]);

  const open = event.status === "PUBLISHED" || event.status === "LIVE";

  if (viewerPrimaryState === "WAITLISTED") {
    return null;
  }

  const alreadyRegistered =
    viewerPrimaryState === "PARTICIPANT" ||
    viewerPrimaryState === "WATCHER" ||
    viewerPrimaryState === "VOLUNTEER" ||
    viewerPrimaryState === "ORGANIZER";

  if (alreadyRegistered && event.status !== "DRAFT") {
    return null;
  }

  if (event.status === "DRAFT") {
    const isHost =
      viewerPrimaryState === "ORGANIZER" ||
      Boolean(linkedUserId && linkedUserId === event.organizerId);
    return (
      <ThemedView style={styles.block}>
        <ThemedText type="subtitle">Join this event</ThemedText>
        <ThemedText type="muted" style={styles.gapTop}>
          {isHost
            ? "This event is still a draft. Use Organizer tools on this screen to publish when you are ready."
            : "This event is still a draft. The host must publish it before participants can register."}
        </ThemedText>
      </ThemedView>
    );
  }

  if (event.status === "CANCELLED") {
    return (
      <ThemedView style={styles.block}>
        <ThemedText type="subtitle">Join this event</ThemedText>
        <ThemedText type="muted" style={styles.gapTop}>
          This event was cancelled.
        </ThemedText>
      </ThemedView>
    );
  }

  if (!open || roleOptions.length === 0) {
    return null;
  }

  const onJoin = async () => {
    setBusy(true);
    setMessage(null);
    try {
      const api = createKairoApiFromEnv({ userId: linkedUserId });
      await api.joinEvent(event.id, {
        role,
        note: note.trim() === "" ? undefined : note.trim(),
      });
      setMessage("You're registered. Counts update below.");
      setNote("");
      onJoined();
    } catch (e) {
      if (e instanceof KairoApiConfigurationError) {
        setMessage(e.message);
      } else if (e instanceof KairoApiError) {
        setMessage(e.message);
      } else {
        setMessage(e instanceof Error ? e.message : "Could not join.");
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <ThemedView style={styles.block}>
      <ThemedText type="subtitle">Join this event</ThemedText>
      <ThemedText type="muted" style={styles.gapTop}>
        Pick how you want to take part, then confirm.
      </ThemedText>
      <View style={styles.chipRow}>
        {roleOptions.map((r) => (
          <Pressable
            key={r}
            onPress={() => setRole(r)}
            style={[
              styles.chip,
              { borderColor },
              role === r && { borderColor: tint, backgroundColor: `${String(tint)}22` },
            ]}
          >
            <ThemedText type="small">{r === "PLAYER" ? "Player" : r === "WATCHER" ? "Watcher" : "Volunteer"}</ThemedText>
          </Pressable>
        ))}
      </View>
      <ThemedText type="small">Note to organizer (optional)</ThemedText>
      <TextInput
        value={note}
        onChangeText={setNote}
        placeholder="e.g. arriving at 6:15"
        placeholderTextColor="#8E8E93"
        style={[styles.input, { borderColor, backgroundColor: surface, color: textColor }]}
      />
      {message ? (
        <ThemedText type="small" style={styles.msg}>
          {message}
        </ThemedText>
      ) : null}
      <Pressable
        style={[styles.button, busy && styles.buttonDisabled]}
        onPress={() => void onJoin()}
        disabled={busy}
      >
        {busy ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <ThemedText style={styles.buttonLabel}>Join as {role === "PLAYER" ? "player" : role === "WATCHER" ? "watcher" : "volunteer"}</ThemedText>
        )}
      </Pressable>
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
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 4,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  button: {
    marginTop: 8,
    backgroundColor: "#0a7ea4",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.55,
  },
  buttonLabel: {
    color: "#fff",
    fontWeight: "700",
  },
  warn: {
    color: "#B45309",
    marginTop: 4,
  },
  msg: {
    marginTop: 4,
  },
});
