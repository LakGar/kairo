import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { proofTypeSchema, submitProofSchema, type SubmitProofInput } from "@kairo/shared";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useThemeColor } from "@/hooks/use-theme-color";
import {
  createKairoApiFromEnv,
  getDevUserId,
  KairoApiConfigurationError,
  KairoApiError,
  type ApiEventPublic,
  type ApiMatchPublic,
  type ApiProofSubmission,
} from "@/src/api";

import { useEventProofSubmitData } from "./use-event-proof-submit-data";

type Props = {
  event: ApiEventPublic;
  onSubmitted: () => void;
};

function matchShortLabel(m: ApiMatchPublic): string {
  const num = m.matchNumber != null ? `#${m.matchNumber}` : m.id.slice(0, 8);
  const home = m.homeTeam?.name ?? "TBD";
  const away = m.awayTeam?.name ?? "TBD";
  return `${num} ${home} vs ${away}`;
}

function submissionSnippet(s: ApiProofSubmission): string {
  return (
    s.text?.trim() ||
    s.url?.trim() ||
    `${s.type}${s.prompt ? ` · ${s.prompt.title}` : ""}`
  );
}

export function EventProofSubmitSection({ event, onSubmitted }: Props) {
  const devUserId = getDevUserId();
  const open = event.status === "PUBLISHED" || event.status === "LIVE";

  const { prompts, matches, submissions, loading, error, refresh } = useEventProofSubmitData(
    event.id,
    open,
  );

  const borderColor = useThemeColor({ light: "#C6C6C8", dark: "#3A3A3C" }, "icon");
  const surface = useThemeColor({ light: "#F2F2F7", dark: "#1C1C1E" }, "background");
  const textColor = useThemeColor({}, "text");
  const tint = useThemeColor({}, "tint");

  const [proofType, setProofType] = useState<SubmitProofInput["type"]>("TEXT");
  const [text, setText] = useState("");
  const [url, setUrl] = useState("");
  const [matchId, setMatchId] = useState<string | null>(null);
  const [promptId, setPromptId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const mine = useMemo(() => {
    if (!devUserId) return [];
    return submissions
      .filter((s) => s.userId === devUserId)
      .slice()
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }, [submissions, devUserId]);

  if (!open) {
    return null;
  }

  const onSubmit = async () => {
    setBusy(true);
    setMessage(null);
    const body = {
      eventId: event.id,
      matchId,
      promptId,
      type: proofType,
      url: url.trim() === "" ? null : url.trim(),
      text: text.trim() === "" ? null : text.trim(),
    };
    const parsed = submitProofSchema.safeParse(body);
    if (!parsed.success) {
      const flat = parsed.error.flatten();
      const first =
        Object.values(flat.fieldErrors).flat()[0] ??
        flat.formErrors[0] ??
        parsed.error.message;
      setMessage(first ?? "Check your proof fields.");
      setBusy(false);
      return;
    }
    try {
      const api = createKairoApiFromEnv();
      await api.submitProof(event.id, parsed.data);
      setText("");
      setUrl("");
      setMatchId(null);
      setPromptId(null);
      setMessage("Proof submitted.");
      void refresh();
      onSubmitted();
    } catch (e) {
      if (e instanceof KairoApiError) setMessage(e.message);
      else if (e instanceof KairoApiConfigurationError) setMessage(e.message);
      else setMessage(e instanceof Error ? e.message : "Could not submit proof.");
    } finally {
      setBusy(false);
    }
  };

  const proofTypes = proofTypeSchema.options;

  return (
    <ThemedView style={styles.block}>
      <ThemedText type="subtitle">Submit proof</ThemedText>
      {!devUserId ? (
        <ThemedText type="small" style={styles.warn}>
          Set EXPO_PUBLIC_KAIRO_DEV_USER_ID in mobile/.env to submit proof in dev.
        </ThemedText>
      ) : null}
      <ThemedText type="muted" style={styles.gapTop}>
        Join the event first. Use text for write-ups or paste a URL for links and
        image/video hosting (no file upload in MVP).
      </ThemedText>

      {loading ? <ActivityIndicator style={styles.loader} /> : null}
      {error ? (
        <View style={styles.row}>
          <ThemedText type="muted" style={{ flex: 1 }}>
            {error}
          </ThemedText>
          <Pressable onPress={() => void refresh()}>
            <ThemedText type="link">Retry</ThemedText>
          </Pressable>
        </View>
      ) : null}

      <ThemedText type="small" style={styles.label}>
        Proof type
      </ThemedText>
      <View style={styles.chipRow}>
        {proofTypes.map((t) => (
          <Pressable
            key={t}
            onPress={() => setProofType(t)}
            style={[
              styles.chip,
              { borderColor },
              proofType === t && { borderColor: tint, backgroundColor: `${String(tint)}22` },
            ]}
          >
            <ThemedText type="small">
              {t === "LINK"
                ? "Link"
                : t === "TEXT"
                  ? "Text"
                  : t === "PHOTO"
                    ? "Photo URL"
                    : "Video URL"}
            </ThemedText>
          </Pressable>
        ))}
      </View>

      {proofType === "TEXT" ? (
        <>
          <ThemedText type="small" style={styles.label}>
            Text
          </ThemedText>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Describe what you did or saw"
            placeholderTextColor="#8E8E93"
            multiline
            style={[
              styles.input,
              styles.textArea,
              { borderColor, backgroundColor: surface, color: textColor },
            ]}
          />
        </>
      ) : (
        <>
          <ThemedText type="small" style={styles.label}>
            URL
          </ThemedText>
          <TextInput
            value={url}
            onChangeText={setUrl}
            placeholder="https://…"
            placeholderTextColor="#8E8E93"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            style={[styles.input, { borderColor, backgroundColor: surface, color: textColor }]}
          />
        </>
      )}

      <ThemedText type="small" style={styles.label}>
        Link to match (optional)
      </ThemedText>
      <View style={styles.chipRow}>
        <Pressable
          onPress={() => setMatchId(null)}
          style={[
            styles.chip,
            { borderColor },
            matchId === null && { borderColor: tint, backgroundColor: `${String(tint)}22` },
          ]}
        >
          <ThemedText type="small">None</ThemedText>
        </Pressable>
        {matches.map((m) => (
          <Pressable
            key={m.id}
            onPress={() => setMatchId(m.id)}
            style={[
              styles.chip,
              { borderColor },
              matchId === m.id && { borderColor: tint, backgroundColor: `${String(tint)}22` },
            ]}
          >
            <ThemedText type="small" numberOfLines={1}>
              {matchShortLabel(m)}
            </ThemedText>
          </Pressable>
        ))}
      </View>

      <ThemedText type="small" style={styles.label}>
        Link to prompt (optional)
      </ThemedText>
      <View style={styles.chipRow}>
        <Pressable
          onPress={() => setPromptId(null)}
          style={[
            styles.chip,
            { borderColor },
            promptId === null && { borderColor: tint, backgroundColor: `${String(tint)}22` },
          ]}
        >
          <ThemedText type="small">None</ThemedText>
        </Pressable>
        {prompts.map((p) => (
          <Pressable
            key={p.id}
            onPress={() => setPromptId(p.id)}
            style={[
              styles.chip,
              { borderColor },
              promptId === p.id && { borderColor: tint, backgroundColor: `${String(tint)}22` },
            ]}
          >
            <ThemedText type="small" numberOfLines={1}>
              {p.title}
            </ThemedText>
          </Pressable>
        ))}
      </View>

      {message ? (
        <ThemedText type="small" style={styles.msg}>
          {message}
        </ThemedText>
      ) : null}

      <Pressable
        style={[styles.button, (!devUserId || busy) && styles.buttonDisabled]}
        onPress={() => void onSubmit()}
        disabled={!devUserId || busy}
      >
        {busy ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <ThemedText style={styles.buttonLabel}>Submit proof</ThemedText>
        )}
      </Pressable>

      {mine.length > 0 ? (
        <>
          <ThemedText type="subtitle" style={styles.subheading}>
            Your submissions
          </ThemedText>
          {mine.map((s) => (
            <View key={s.id} style={[styles.rowCard, { borderColor }]}>
              <ThemedText type="small">
                {s.status.replaceAll("_", " ")} · {s.type}
              </ThemedText>
              <ThemedText type="default" style={styles.gapTop} numberOfLines={3}>
                {submissionSnippet(s)}
              </ThemedText>
            </View>
          ))}
        </>
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
  label: {
    marginTop: 10,
  },
  loader: {
    marginTop: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 8,
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
    maxWidth: "100%",
  },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: "top",
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
  subheading: {
    marginTop: 16,
  },
  rowCard: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    padding: 12,
    marginTop: 8,
  },
});
