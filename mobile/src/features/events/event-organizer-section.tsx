import { useUser } from "@clerk/expo";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Switch,
  TextInput,
  View,
} from "react-native";
import {
  createManualMatchSchema,
  createProofPromptSchema,
  getDefaultResultVerificationModeForEventFormat,
  type CreateProofPromptInput,
  type EventFormatValue,
  proofTypeSchema,
} from "@kairo/shared";

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
  type ApiMatchPublic,
  type ApiProofSubmission,
  type ApiTeamPublic,
  type ApiUserSnippet,
} from "@/src/api";

import { useEventOrganizerData } from "./use-event-organizer-data";

function userLabel(u: ApiUserSnippet): string {
  return u.profile?.name ?? u.profile?.username ?? u.email;
}

function matchResultStatusLabel(status: string): string {
  switch (status) {
    case "PENDING":
      return "Pending result";
    case "WAITING_CONFIRMATION":
      return "Waiting confirmation";
    case "CONFIRMED":
      return "Result confirmed";
    case "DISPUTED":
      return "Disputed";
    default:
      return status.replaceAll("_", " ");
  }
}

type Props = {
  event: ApiEventPublic;
  teams: ApiTeamPublic[];
  onEventChanged: () => void;
};

export function EventOrganizerSection({ event, teams, onEventChanged }: Props) {
  const { user } = useUser();
  const linkedUserId = getLinkedKairoUserId(user);
  const isOrganizer = Boolean(linkedUserId && linkedUserId === event.organizerId);

  const { matches, prompts, submissions, loading, error, refresh } = useEventOrganizerData(
    event.id,
    isOrganizer,
  );

  const borderColor = useThemeColor({ light: "#C6C6C8", dark: "#3A3A3C" }, "icon");
  const surface = useThemeColor({ light: "#F2F2F7", dark: "#1C1C1E" }, "background");
  const textColor = useThemeColor({}, "text");
  const textMuted = useThemeColor({}, "tabIconDefault");
  const tint = useThemeColor({}, "tint");

  const [banner, setBanner] = useState<string | null>(null);
  const [lifecycleBusy, setLifecycleBusy] = useState(false);

  const [homeTeamId, setHomeTeamId] = useState<string | null>(null);
  const [awayTeamId, setAwayTeamId] = useState<string | null>(null);
  const [roundStr, setRoundStr] = useState("");
  const [matchNumStr, setMatchNumStr] = useState("");
  const [scheduledStr, setScheduledStr] = useState("");
  const [createMatchBusy, setCreateMatchBusy] = useState(false);
  const eventFormat = event.format as EventFormatValue;
  const defaultTeamAgreement =
    getDefaultResultVerificationModeForEventFormat(eventFormat) === "TEAM_AGREEMENT";
  const formatRef = useRef(event.format);
  const [teamAgreementResult, setTeamAgreementResult] = useState(defaultTeamAgreement);

  useEffect(() => {
    if (formatRef.current !== event.format) {
      formatRef.current = event.format;
      setTeamAgreementResult(
        getDefaultResultVerificationModeForEventFormat(event.format as EventFormatValue) ===
          "TEAM_AGREEMENT",
      );
    }
  }, [event.format]);

  const [promptTitle, setPromptTitle] = useState("");
  const [promptDesc, setPromptDesc] = useState("");
  const [promptType, setPromptType] = useState<CreateProofPromptInput["proofType"]>("TEXT");
  const [promptRequired, setPromptRequired] = useState(false);
  const [createPromptBusy, setCreatePromptBusy] = useState(false);

  const [scoreBusyId, setScoreBusyId] = useState<string | null>(null);
  const [winnerBusyId, setWinnerBusyId] = useState<string | null>(null);
  const [reviewBusyId, setReviewBusyId] = useState<string | null>(null);

  const pendingProof = useMemo(
    () => submissions.filter((s) => s.status === "PENDING"),
    [submissions],
  );

  if (!isOrganizer) {
    return null;
  }

  const onRefreshAll = () => {
    void refresh();
    onEventChanged();
  };

  const onPublish = async () => {
    setLifecycleBusy(true);
    setBanner(null);
    try {
      const api = createKairoApiFromEnv({ userId: linkedUserId });
      await api.publishEvent(event.id);
      setBanner("Event published.");
      onRefreshAll();
    } catch (e) {
      if (e instanceof KairoApiError) setBanner(e.message);
      else if (e instanceof KairoApiConfigurationError) setBanner(e.message);
      else setBanner(e instanceof Error ? e.message : "Could not publish.");
    } finally {
      setLifecycleBusy(false);
    }
  };

  const runCancel = async () => {
    setLifecycleBusy(true);
    setBanner(null);
    try {
      const api = createKairoApiFromEnv({ userId: linkedUserId });
      await api.cancelEvent(event.id);
      setBanner("Event cancelled.");
      onRefreshAll();
    } catch (e) {
      if (e instanceof KairoApiError) setBanner(e.message);
      else if (e instanceof KairoApiConfigurationError) setBanner(e.message);
      else setBanner(e instanceof Error ? e.message : "Could not cancel.");
    } finally {
      setLifecycleBusy(false);
    }
  };

  const onCancelPress = () => {
    Alert.alert(
      "Cancel this event?",
      "Participants will see it as cancelled. This cannot be undone from the app.",
      [
        { text: "Keep event", style: "cancel" },
        { text: "Cancel event", style: "destructive", onPress: () => void runCancel() },
      ],
    );
  };

  const onCreateMatch = async () => {
    const round =
      roundStr.trim() === "" ? undefined : Number.parseInt(roundStr, 10);
    const matchNumber =
      matchNumStr.trim() === "" ? undefined : Number.parseInt(matchNumStr, 10);
    const scheduledAt =
      scheduledStr.trim() === "" ? undefined : new Date(scheduledStr.trim());

    const body = {
      homeTeamId,
      awayTeamId,
      round: Number.isFinite(round) ? round : null,
      matchNumber: Number.isFinite(matchNumber) ? matchNumber : null,
      scheduledAt: scheduledAt && !Number.isNaN(scheduledAt.getTime()) ? scheduledAt : null,
      resultVerificationMode: teamAgreementResult
        ? ("TEAM_AGREEMENT" as const)
        : ("ORGANIZER_DECIDES" as const),
    };

    if (teamAgreementResult && (!homeTeamId || !awayTeamId)) {
      setBanner("Team agreement requires both home and away teams.");
      return;
    }

    const parsed = createManualMatchSchema.safeParse(body);
    if (!parsed.success) {
      const flat = parsed.error.flatten().fieldErrors;
      const first =
        Object.values(flat).flat()[0] ?? parsed.error.message ?? "Invalid match.";
      setBanner(first);
      return;
    }

    setCreateMatchBusy(true);
    setBanner(null);
    try {
      const api = createKairoApiFromEnv({ userId: linkedUserId });
      await api.createMatch(event.id, parsed.data);
      setRoundStr("");
      setMatchNumStr("");
      setScheduledStr("");
      setHomeTeamId(null);
      setAwayTeamId(null);
      setTeamAgreementResult(
        getDefaultResultVerificationModeForEventFormat(event.format as EventFormatValue) ===
          "TEAM_AGREEMENT",
      );
      setBanner("Match created.");
      void refresh();
      onEventChanged();
    } catch (e) {
      if (e instanceof KairoApiError) setBanner(e.message);
      else if (e instanceof KairoApiConfigurationError) setBanner(e.message);
      else setBanner(e instanceof Error ? e.message : "Could not create match.");
    } finally {
      setCreateMatchBusy(false);
    }
  };

  const onCreatePrompt = async () => {
    const parsed = createProofPromptSchema.safeParse({
      title: promptTitle,
      description: promptDesc.trim() === "" ? undefined : promptDesc.trim(),
      proofType: promptType,
      isRequired: promptRequired,
    });
    if (!parsed.success) {
      const first = parsed.error.flatten().fieldErrors.title?.[0] ?? parsed.error.message;
      setBanner(first);
      return;
    }
    setCreatePromptBusy(true);
    setBanner(null);
    try {
      const api = createKairoApiFromEnv({ userId: linkedUserId });
      await api.createProofPrompt(event.id, parsed.data);
      setPromptTitle("");
      setPromptDesc("");
      setPromptRequired(false);
      setBanner("Proof prompt added.");
      void refresh();
    } catch (e) {
      if (e instanceof KairoApiError) setBanner(e.message);
      else if (e instanceof KairoApiConfigurationError) setBanner(e.message);
      else setBanner(e instanceof Error ? e.message : "Could not add prompt.");
    } finally {
      setCreatePromptBusy(false);
    }
  };

  const onApplyScores = async (m: ApiMatchPublic, homeStr: string, awayStr: string) => {
    const homeScore = homeStr.trim() === "" ? undefined : Number.parseInt(homeStr, 10);
    const awayScore = awayStr.trim() === "" ? undefined : Number.parseInt(awayStr, 10);
    if (homeScore === undefined && awayScore === undefined) {
      setBanner("Enter at least one score to apply.");
      return;
    }
    if (
      (homeScore !== undefined && !Number.isFinite(homeScore)) ||
      (awayScore !== undefined && !Number.isFinite(awayScore))
    ) {
      setBanner("Scores must be whole numbers.");
      return;
    }
    setScoreBusyId(m.id);
    setBanner(null);
    try {
      const api = createKairoApiFromEnv({ userId: linkedUserId });
      await api.updateMatchScore(m.id, { homeScore, awayScore });
      setBanner("Scores updated.");
      void refresh();
      onEventChanged();
    } catch (e) {
      if (e instanceof KairoApiError) setBanner(e.message);
      else if (e instanceof KairoApiConfigurationError) setBanner(e.message);
      else setBanner(e instanceof Error ? e.message : "Could not update scores.");
    } finally {
      setScoreBusyId(null);
    }
  };

  const onMarkWinner = async (m: ApiMatchPublic, winnerTeamId: string) => {
    setWinnerBusyId(m.id);
    setBanner(null);
    try {
      const api = createKairoApiFromEnv({ userId: linkedUserId });
      await api.markMatchWinner(m.id, { winnerTeamId });
      setBanner("Match result confirmed.");
      void refresh();
      onEventChanged();
    } catch (e) {
      if (e instanceof KairoApiError) setBanner(e.message);
      else if (e instanceof KairoApiConfigurationError) setBanner(e.message);
      else setBanner(e instanceof Error ? e.message : "Could not set winner.");
    } finally {
      setWinnerBusyId(null);
    }
  };

  const onReviewProof = async (submissionId: string, approve: boolean) => {
    setReviewBusyId(submissionId);
    setBanner(null);
    try {
      const api = createKairoApiFromEnv({ userId: linkedUserId });
      if (approve) await api.approveProof(submissionId);
      else await api.rejectProof(submissionId);
      setBanner(approve ? "Proof approved." : "Proof rejected.");
      void refresh();
    } catch (e) {
      if (e instanceof KairoApiError) setBanner(e.message);
      else if (e instanceof KairoApiConfigurationError) setBanner(e.message);
      else setBanner(e instanceof Error ? e.message : "Could not update proof.");
    } finally {
      setReviewBusyId(null);
    }
  };

  const proofTypes = proofTypeSchema.options;

  return (
    <ThemedView style={styles.block}>
      <ThemedText type="subtitle">Organizer tools</ThemedText>

      {banner ? (
        <ThemedText type="default" style={styles.banner}>
          {banner}
        </ThemedText>
      ) : null}

      <ThemedText type="small" style={styles.gapTop}>
        Publish, scheduling, proof prompts, and match results for this event.
      </ThemedText>

      <View style={styles.rowGap}>
        {event.status === "DRAFT" ? (
          <Pressable
            style={[styles.button, { backgroundColor: tint }]}
            disabled={lifecycleBusy}
            onPress={() => void onPublish()}
          >
            {lifecycleBusy ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <ThemedText style={styles.buttonLabel}>Publish event</ThemedText>
            )}
          </Pressable>
        ) : null}
        {event.status !== "CANCELLED" ? (
          <Pressable
            style={[styles.button, styles.dangerButton]}
            disabled={lifecycleBusy}
            onPress={onCancelPress}
          >
            <ThemedText style={styles.buttonLabel}>Cancel event</ThemedText>
          </Pressable>
        ) : null}
      </View>

      {loading ? (
        <ActivityIndicator style={styles.loader} />
      ) : error ? (
        <ThemedText type="muted" style={styles.gapTop}>
          {error}
        </ThemedText>
      ) : null}

      <ThemedText type="subtitle" style={styles.sectionTitle}>
        Matches ({matches.length})
      </ThemedText>
      <ThemedText type="small" style={styles.proofSeparateNote}>
        Proof approval is separate from the match result.
      </ThemedText>
      {matches.map((m) => (
        <MatchOrganizerRow
          key={m.id}
          m={m}
          borderColor={borderColor}
          surface={surface}
          textColor={textColor}
          tint={tint}
          scoreBusy={scoreBusyId === m.id}
          winnerBusy={winnerBusyId === m.id}
          onApplyScores={(h, a) => void onApplyScores(m, h, a)}
          onMarkWinner={(winnerId) => void onMarkWinner(m, winnerId)}
        />
      ))}

      <ThemedText type="subtitle" style={styles.subheading}>
        New match
      </ThemedText>
      <TeamSlotRow
        label="Home"
        value={homeTeamId}
        teams={teams}
        borderColor={borderColor}
        surface={surface}
        textColor={textColor}
        tint={tint}
        onChange={setHomeTeamId}
      />
      <TeamSlotRow
        label="Away"
        value={awayTeamId}
        teams={teams}
        borderColor={borderColor}
        surface={surface}
        textColor={textColor}
        tint={tint}
        onChange={setAwayTeamId}
      />
      <ThemedText type="small" style={styles.fieldLabel}>
        Round (optional)
      </ThemedText>
      <TextInput
        value={roundStr}
        onChangeText={setRoundStr}
        placeholder="e.g. 1"
        keyboardType="number-pad"
        placeholderTextColor={textColor + "99"}
        style={[styles.input, { borderColor, color: textColor, backgroundColor: surface }]}
      />
      <ThemedText type="small" style={styles.fieldLabel}>
        Match # (optional)
      </ThemedText>
      <TextInput
        value={matchNumStr}
        onChangeText={setMatchNumStr}
        placeholder="e.g. 1"
        keyboardType="number-pad"
        placeholderTextColor={textColor + "99"}
        style={[styles.input, { borderColor, color: textColor, backgroundColor: surface }]}
      />
      <ThemedText type="small" style={styles.fieldLabel}>
        Scheduled at (optional ISO date)
      </ThemedText>
      <TextInput
        value={scheduledStr}
        onChangeText={setScheduledStr}
        placeholder="2026-05-10T18:00:00.000Z"
        placeholderTextColor={textColor + "99"}
        style={[styles.input, { borderColor, color: textColor, backgroundColor: surface }]}
      />
      <ThemedText type="small" style={styles.fieldLabel}>
        {getDefaultResultVerificationModeForEventFormat(eventFormat) === "TEAM_AGREEMENT"
          ? "Teams agree on results. Disputes go to the organizer."
          : "Organizer confirms results."}
      </ThemedText>
      <View style={styles.switchRow}>
        <ThemedText type="default">Team agreement results</ThemedText>
        <Switch value={teamAgreementResult} onValueChange={setTeamAgreementResult} />
      </View>
      <ThemedText type="small" style={styles.fieldLabel}>
        When on, both teams must be set; opponent confirms or disputes (you resolve disputes).
      </ThemedText>
      <Pressable
        style={[styles.button, { backgroundColor: tint, marginTop: 10 }]}
        disabled={createMatchBusy}
        onPress={() => void onCreateMatch()}
      >
        {createMatchBusy ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <ThemedText style={styles.buttonLabel}>Create match</ThemedText>
        )}
      </Pressable>

      <ThemedText type="subtitle" style={styles.sectionTitle}>
        Proof prompts ({prompts.length})
      </ThemedText>
      {prompts.map((p) => (
        <View key={p.id} style={[styles.promptRow, { borderColor }]}>
          <ThemedText type="subtitle">{p.title}</ThemedText>
          <ThemedText type="small">
            {p.proofType}
            {p.isRequired ? " · Required" : ""}
          </ThemedText>
        </View>
      ))}

      <ThemedText type="subtitle" style={styles.subheading}>
        New proof prompt
      </ThemedText>
      <TextInput
        value={promptTitle}
        onChangeText={setPromptTitle}
        placeholder="Title"
        placeholderTextColor={textColor + "99"}
        style={[styles.input, { borderColor, color: textColor, backgroundColor: surface }]}
      />
      <TextInput
        value={promptDesc}
        onChangeText={setPromptDesc}
        placeholder="Description (optional)"
        multiline
        placeholderTextColor={textColor + "99"}
        style={[styles.input, styles.textArea, { borderColor, color: textColor, backgroundColor: surface }]}
      />
      <ThemedText type="small" style={styles.fieldLabel}>
        Proof type
      </ThemedText>
      <View style={styles.chipRow}>
        {proofTypes.map((pt) => (
          <Pressable
            key={pt}
            onPress={() => setPromptType(pt)}
            style={[
              styles.chip,
              { borderColor },
              promptType === pt && { backgroundColor: tint, borderColor: tint },
            ]}
          >
            <ThemedText
              type="small"
              style={promptType === pt ? styles.chipLabelOn : undefined}
            >
              {pt}
            </ThemedText>
          </Pressable>
        ))}
      </View>
      <View style={styles.switchRow}>
        <ThemedText type="default">Required</ThemedText>
        <Switch value={promptRequired} onValueChange={setPromptRequired} />
      </View>
      <Pressable
        style={[styles.button, { backgroundColor: tint, marginTop: 10 }]}
        disabled={createPromptBusy}
        onPress={() => void onCreatePrompt()}
      >
        {createPromptBusy ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <ThemedText style={styles.buttonLabel}>Add prompt</ThemedText>
        )}
      </Pressable>

      <ThemedText type="subtitle" style={styles.sectionTitle}>
        Proof inbox ({pendingProof.length} pending)
      </ThemedText>
      {pendingProof.length === 0 ? (
        <FeatureEmptyState
          colors={{
            textPrimary: textColor,
            textMuted,
            icon: borderColor,
          }}
          icon="document-text-outline"
          title="Inbox is clear"
          subtitle="No pending proof submissions right now. Players will show up here when they submit."
          compact
        />
      ) : (
        pendingProof.map((s) => (
          <ProofInboxRow
            key={s.id}
            s={s}
            borderColor={borderColor}
            textColor={textColor}
            tint={tint}
            busy={reviewBusyId === s.id}
            onApprove={() => void onReviewProof(s.id, true)}
            onReject={() => void onReviewProof(s.id, false)}
          />
        ))
      )}
    </ThemedView>
  );
}

function TeamSlotRow({
  label,
  value,
  teams,
  borderColor,
  surface,
  textColor,
  tint,
  onChange,
}: {
  label: string;
  value: string | null;
  teams: ApiTeamPublic[];
  borderColor: string;
  surface: string;
  textColor: string;
  tint: string;
  onChange: (id: string | null) => void;
}) {
  return (
    <View style={styles.teamSlot}>
      <ThemedText type="small" style={styles.fieldLabel}>
        {label}
      </ThemedText>
      <View style={styles.chipRow}>
        <Pressable
          onPress={() => onChange(null)}
          style={[
            styles.chip,
            { borderColor },
            value === null && { backgroundColor: tint, borderColor: tint },
          ]}
        >
          <ThemedText type="small" style={value === null ? styles.chipLabelOn : undefined}>
            TBD
          </ThemedText>
        </Pressable>
        {teams.map((t) => (
          <Pressable
            key={t.id}
            onPress={() => onChange(t.id)}
            style={[
              styles.chip,
              { borderColor },
              value === t.id && { backgroundColor: tint, borderColor: tint },
            ]}
          >
            <ThemedText type="small" style={value === t.id ? styles.chipLabelOn : undefined}>
              {t.name}
            </ThemedText>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function MatchOrganizerRow({
  m,
  borderColor,
  surface,
  textColor,
  tint,
  scoreBusy,
  winnerBusy,
  onApplyScores,
  onMarkWinner,
}: {
  m: ApiMatchPublic;
  borderColor: string;
  surface: string;
  textColor: string;
  tint: string;
  scoreBusy: boolean;
  winnerBusy: boolean;
  onApplyScores: (home: string, away: string) => void;
  onMarkWinner: (winnerTeamId: string) => void;
}) {
  const [homeStr, setHomeStr] = useState(
    m.homeScore != null ? String(m.homeScore) : "",
  );
  const [awayStr, setAwayStr] = useState(
    m.awayScore != null ? String(m.awayScore) : "",
  );

  useEffect(() => {
    setHomeStr(m.homeScore != null ? String(m.homeScore) : "");
    setAwayStr(m.awayScore != null ? String(m.awayScore) : "");
  }, [m.homeScore, m.awayScore, m.id, m.resultStatus]);

  const label =
    m.matchNumber != null
      ? `Match ${m.matchNumber}${m.round != null ? ` · Round ${m.round}` : ""}`
      : `Match ${m.id.slice(0, 8)}…`;

  const canPickWinner = Boolean(m.homeTeamId && m.awayTeamId);

  return (
    <View style={[styles.matchCard, { borderColor }]}>
      <ThemedText type="subtitle">{label}</ThemedText>
      <ThemedText type="small" style={styles.gapTop}>
        {(m.homeTeam?.name ?? "TBD") + " vs " + (m.awayTeam?.name ?? "TBD")}
      </ThemedText>
      <ThemedText type="muted">{m.status.replaceAll("_", " ")}</ThemedText>
      <ThemedText type="small" style={styles.resultStatusLine}>
        {matchResultStatusLabel(m.resultStatus ?? "PENDING")}
      </ThemedText>
      <View style={styles.scoreRow}>
        <TextInput
          value={homeStr}
          onChangeText={setHomeStr}
          keyboardType="number-pad"
          placeholder="Home"
          placeholderTextColor={textColor + "99"}
          style={[
            styles.scoreInput,
            { borderColor, color: textColor, backgroundColor: surface },
          ]}
        />
        <ThemedText type="default">—</ThemedText>
        <TextInput
          value={awayStr}
          onChangeText={setAwayStr}
          keyboardType="number-pad"
          placeholder="Away"
          placeholderTextColor={textColor + "99"}
          style={[
            styles.scoreInput,
            { borderColor, color: textColor, backgroundColor: surface },
          ]}
        />
        <Pressable
          style={[styles.smallButton, { backgroundColor: tint }]}
          disabled={scoreBusy}
          onPress={() => onApplyScores(homeStr, awayStr)}
        >
          {scoreBusy ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <ThemedText style={styles.smallButtonLabel}>Apply</ThemedText>
          )}
        </Pressable>
      </View>
      {canPickWinner ? (
        <View style={styles.rowGap}>
          {m.homeTeamId ? (
            <Pressable
              style={[styles.button, styles.outlineButton, { borderColor: tint }]}
              disabled={winnerBusy}
              onPress={() => onMarkWinner(m.homeTeamId!)}
            >
              <ThemedText style={{ color: tint }}>Home wins</ThemedText>
            </Pressable>
          ) : null}
          {m.awayTeamId ? (
            <Pressable
              style={[styles.button, styles.outlineButton, { borderColor: tint }]}
              disabled={winnerBusy}
              onPress={() => onMarkWinner(m.awayTeamId!)}
            >
              <ThemedText style={{ color: tint }}>Away wins</ThemedText>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

function ProofInboxRow({
  s,
  borderColor,
  textColor,
  tint,
  busy,
  onApprove,
  onReject,
}: {
  s: ApiProofSubmission;
  borderColor: string;
  textColor: string;
  tint: string;
  busy: boolean;
  onApprove: () => void;
  onReject: () => void;
}) {
  const snippet =
    s.text?.trim() ||
    s.url?.trim() ||
    `${s.type}${s.prompt ? ` · ${s.prompt.title}` : ""}`;

  return (
    <View style={[styles.matchCard, { borderColor }]}>
      <ThemedText type="subtitle">{userLabel(s.user)}</ThemedText>
      <ThemedText type="small" style={styles.gapTop} numberOfLines={3}>
        {snippet}
      </ThemedText>
      {busy ? (
        <ActivityIndicator style={styles.gapTop} color={textColor} />
      ) : (
        <View style={styles.rowGap}>
          <Pressable
            style={[styles.button, { backgroundColor: tint, flex: 1 }]}
            onPress={onApprove}
          >
            <ThemedText style={styles.buttonLabel}>Approve</ThemedText>
          </Pressable>
          <Pressable
            style={[styles.button, styles.dangerButton, { flex: 1 }]}
            onPress={onReject}
          >
            <ThemedText style={styles.buttonLabel}>Reject</ThemedText>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 8,
  },
  gapTop: {
    marginTop: 8,
  },
  proofSeparateNote: {
    marginTop: 4,
    opacity: 0.85,
  },
  resultStatusLine: {
    marginTop: 4,
    fontWeight: "600",
  },
  banner: {
    marginTop: 8,
  },
  loader: {
    marginTop: 12,
  },
  sectionTitle: {
    marginTop: 20,
  },
  subheading: {
    marginTop: 12,
  },
  rowGap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 12,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    minWidth: 120,
    alignItems: "center",
    justifyContent: "center",
  },
  dangerButton: {
    backgroundColor: "#C62828",
  },
  outlineButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
  },
  buttonLabel: {
    color: "#fff",
    fontWeight: "600",
  },
  fieldLabel: {
    marginTop: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 4,
  },
  textArea: {
    minHeight: 72,
    textAlignVertical: "top",
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 6,
  },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
  },
  chipLabelOn: {
    color: "#fff",
    fontWeight: "600",
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 10,
  },
  teamSlot: {
    marginTop: 8,
  },
  matchCard: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginTop: 10,
  },
  promptRow: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: 8,
  },
  scoreRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 10,
  },
  scoreInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  smallButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  smallButtonLabel: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 13,
  },
});
