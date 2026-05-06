import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { submitTeamAgreementResultSchema } from "@kairo/shared";

import {
  createKairoApiFromEnv,
  KairoApiConfigurationError,
  KairoApiError,
  type ApiMatchPublic,
  type ApiTeamPublic,
} from "@/src/api";
import { HomeColors } from "@/src/features/home/home-tokens";

function isUserOnTeam(team: ApiTeamPublic, userId: string | undefined): boolean {
  if (!userId) return false;
  if (team.captainId === userId) return true;
  return team.members.some((m) => m.userId === userId);
}

function userTeamIdOnMatch(
  m: ApiMatchPublic,
  userId: string | undefined,
  teams: ApiTeamPublic[],
): string | null {
  if (!userId || !m.homeTeamId || !m.awayTeamId) return null;
  const home = teams.find((t) => t.id === m.homeTeamId);
  const away = teams.find((t) => t.id === m.awayTeamId);
  if (home && isUserOnTeam(home, userId)) return m.homeTeamId;
  if (away && isUserOnTeam(away, userId)) return m.awayTeamId;
  return null;
}

function opponentTeamId(m: ApiMatchPublic): string | null {
  if (!m.submittedByTeamId || !m.homeTeamId || !m.awayTeamId) return null;
  if (m.submittedByTeamId === m.homeTeamId) return m.awayTeamId;
  if (m.submittedByTeamId === m.awayTeamId) return m.homeTeamId;
  return null;
}

type Props = {
  eventId: string;
  teams: ApiTeamPublic[];
  linkedUserId: string | undefined;
  onChanged: () => void;
  /** When set (e.g. Home deep link), emphasize this match row. */
  highlightMatchId?: string | null;
  /** When false, match rows are read-only (no submit / confirm / dispute). */
  allowParticipantResultControls?: boolean;
};

export function EventTeamAgreementResultsSection({
  eventId,
  teams,
  linkedUserId,
  onChanged,
  highlightMatchId,
  allowParticipantResultControls = true,
}: Props) {
  const [matches, setMatches] = useState<ApiMatchPublic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const api = createKairoApiFromEnv({ userId: linkedUserId });
      const list = await api.listMatches(eventId);
      setMatches(list.filter((m) => m.resultVerificationMode === "TEAM_AGREEMENT"));
    } catch (e) {
      if (e instanceof KairoApiError) setError(e.message);
      else if (e instanceof KairoApiConfigurationError) setError(e.message);
      else setError(e instanceof Error ? e.message : "Could not load matches.");
      setMatches([]);
    } finally {
      setLoading(false);
    }
  }, [eventId, linkedUserId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!loading && !error && matches.length === 0) {
    return null;
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Team agreement results</Text>
      <Text style={styles.hint}>Proof approval is separate from the match result.</Text>
      {loading ? <ActivityIndicator color={HomeColors.textMuted} style={styles.loader} /> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {matches.map((m) => (
        <TeamAgreementMatchRow
          key={m.id}
          m={m}
          teams={teams}
          linkedUserId={linkedUserId}
          allowParticipantResultControls={allowParticipantResultControls}
          highlight={Boolean(highlightMatchId && highlightMatchId === m.id)}
          onChanged={() => {
            void load();
            onChanged();
          }}
        />
      ))}
    </View>
  );
}

function TeamAgreementMatchRow({
  m,
  teams,
  linkedUserId,
  allowParticipantResultControls,
  highlight,
  onChanged,
}: {
  m: ApiMatchPublic;
  teams: ApiTeamPublic[];
  linkedUserId: string | undefined;
  allowParticipantResultControls: boolean;
  highlight?: boolean;
  onChanged: () => void;
}) {
  const [homeScoreStr, setHomeScoreStr] = useState("");
  const [awayScoreStr, setAwayScoreStr] = useState("");
  const [winnerTeamId, setWinnerTeamId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);

  const label =
    m.matchNumber != null
      ? `Match ${m.matchNumber}${m.round != null ? ` · Round ${m.round}` : ""}`
      : `Match`;

  const myTeamId = userTeamIdOnMatch(m, linkedUserId, teams);
  const onSide = allowParticipantResultControls && myTeamId !== null;
  const oppId = opponentTeamId(m);

  const onSubmit = async () => {
    if (!winnerTeamId) {
      setBanner("Pick which team won.");
      return;
    }
    const homeScore =
      homeScoreStr.trim() === "" ? undefined : Number.parseInt(homeScoreStr, 10);
    const awayScore =
      awayScoreStr.trim() === "" ? undefined : Number.parseInt(awayScoreStr, 10);
    if (homeScore !== undefined && !Number.isFinite(homeScore)) {
      setBanner("Home score must be a whole number.");
      return;
    }
    if (awayScore !== undefined && !Number.isFinite(awayScore)) {
      setBanner("Away score must be a whole number.");
      return;
    }
    const body = { winnerTeamId, homeScore, awayScore };
    const parsed = submitTeamAgreementResultSchema.safeParse(body);
    if (!parsed.success) {
      setBanner(parsed.error.flatten().formErrors[0] ?? "Invalid result.");
      return;
    }
    setBusy(true);
    setBanner(null);
    try {
      const api = createKairoApiFromEnv({ userId: linkedUserId });
      await api.submitTeamAgreementResult(m.id, parsed.data);
      onChanged();
    } catch (e) {
      if (e instanceof KairoApiError) setBanner(e.message);
      else if (e instanceof KairoApiConfigurationError) setBanner(e.message);
      else setBanner(e instanceof Error ? e.message : "Could not submit.");
    } finally {
      setBusy(false);
    }
  };

  const onConfirm = async () => {
    setBusy(true);
    setBanner(null);
    try {
      const api = createKairoApiFromEnv({ userId: linkedUserId });
      await api.confirmTeamAgreementResult(m.id);
      onChanged();
    } catch (e) {
      if (e instanceof KairoApiError) setBanner(e.message);
      else if (e instanceof KairoApiConfigurationError) setBanner(e.message);
      else setBanner(e instanceof Error ? e.message : "Could not confirm.");
    } finally {
      setBusy(false);
    }
  };

  const onDispute = async () => {
    setBusy(true);
    setBanner(null);
    try {
      const api = createKairoApiFromEnv({ userId: linkedUserId });
      await api.disputeTeamAgreementResult(m.id);
      onChanged();
    } catch (e) {
      if (e instanceof KairoApiError) setBanner(e.message);
      else if (e instanceof KairoApiConfigurationError) setBanner(e.message);
      else setBanner(e instanceof Error ? e.message : "Could not dispute.");
    } finally {
      setBusy(false);
    }
  };

  const homeName = m.homeTeam?.name ?? "Home";
  const awayName = m.awayTeam?.name ?? "Away";

  let statusLine = "";
  if (m.resultStatus === "PENDING") statusLine = "Pending result";
  else if (m.resultStatus === "WAITING_CONFIRMATION") statusLine = "Waiting for opponent confirmation";
  else if (m.resultStatus === "DISPUTED") statusLine = "Disputed — waiting for organizer";
  else if (m.resultStatus === "CONFIRMED") statusLine = "Result confirmed";

  return (
    <View style={[styles.card, highlight && styles.cardHighlight]}>
      <Text style={styles.cardTitle}>{label}</Text>
      <Text style={styles.names}>
        {homeName} vs {awayName}
      </Text>
      <Text style={styles.status}>{statusLine}</Text>
      {m.resultStatus === "WAITING_CONFIRMATION" || m.resultStatus === "CONFIRMED" ? (
        <Text style={styles.meta}>
          Winner: {m.winnerTeamId === m.homeTeamId ? homeName : awayName}
          {m.homeScore != null || m.awayScore != null
            ? ` · ${m.homeScore ?? "—"}–${m.awayScore ?? "—"}`
            : ""}
        </Text>
      ) : null}

      {banner ? <Text style={styles.banner}>{banner}</Text> : null}

      {m.resultStatus === "PENDING" && onSide ? (
        <View style={styles.form}>
          <Text style={styles.label}>Winner</Text>
          <View style={styles.row}>
            <Pressable
              style={[styles.chip, winnerTeamId === m.homeTeamId && styles.chipOn]}
              onPress={() => setWinnerTeamId(m.homeTeamId)}
            >
              <Text style={[styles.chipText, winnerTeamId === m.homeTeamId && styles.chipTextOn]}>
                {homeName}
              </Text>
            </Pressable>
            <Pressable
              style={[styles.chip, winnerTeamId === m.awayTeamId && styles.chipOn]}
              onPress={() => setWinnerTeamId(m.awayTeamId)}
            >
              <Text style={[styles.chipText, winnerTeamId === m.awayTeamId && styles.chipTextOn]}>
                {awayName}
              </Text>
            </Pressable>
          </View>
          <Text style={styles.label}>Scores (optional)</Text>
          <View style={styles.row}>
            <TextInput
              value={homeScoreStr}
              onChangeText={setHomeScoreStr}
              placeholder="Home"
              keyboardType="number-pad"
              placeholderTextColor={HomeColors.textMuted}
              style={styles.input}
            />
            <TextInput
              value={awayScoreStr}
              onChangeText={setAwayScoreStr}
              placeholder="Away"
              keyboardType="number-pad"
              placeholderTextColor={HomeColors.textMuted}
              style={styles.input}
            />
          </View>
          <Pressable style={styles.primary} disabled={busy} onPress={() => void onSubmit()}>
            {busy ? (
              <ActivityIndicator color={HomeColors.black} />
            ) : (
              <Text style={styles.primaryText}>Submit result</Text>
            )}
          </Pressable>
        </View>
      ) : null}

      {m.resultStatus === "WAITING_CONFIRMATION" && onSide && myTeamId === m.submittedByTeamId ? (
        <Text style={styles.note}>Waiting for opponent confirmation.</Text>
      ) : null}

      {m.resultStatus === "WAITING_CONFIRMATION" &&
      onSide &&
      oppId != null &&
      myTeamId === oppId ? (
        <View style={styles.row}>
          <Pressable style={styles.primary} disabled={busy} onPress={() => void onConfirm()}>
            {busy ? (
              <ActivityIndicator color={HomeColors.black} />
            ) : (
              <Text style={styles.primaryText}>Confirm result</Text>
            )}
          </Pressable>
          <Pressable style={styles.danger} disabled={busy} onPress={() => void onDispute()}>
            <Text style={styles.dangerText}>Dispute</Text>
          </Pressable>
        </View>
      ) : null}

      {!onSide && m.resultStatus !== "CONFIRMED" ? (
        <Text style={styles.note}>
          {allowParticipantResultControls
            ? "You are not on either team — status only."
            : "Results are shown for this event — team controls are for registered players."}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    color: HomeColors.textPrimary,
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },
  hint: {
    color: HomeColors.textMuted,
    fontSize: 13,
    marginBottom: 12,
  },
  loader: {
    marginVertical: 12,
  },
  error: {
    color: "#F87171",
    marginBottom: 8,
  },
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: HomeColors.border,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    backgroundColor: HomeColors.bg,
  },
  cardHighlight: {
    borderWidth: 2,
    borderColor: HomeColors.accent,
  },
  cardTitle: {
    color: HomeColors.textPrimary,
    fontWeight: "700",
    fontSize: 16,
  },
  names: {
    color: HomeColors.textSecondary,
    marginTop: 4,
    fontSize: 14,
  },
  status: {
    color: HomeColors.textMuted,
    marginTop: 6,
    fontSize: 13,
    fontWeight: "600",
  },
  meta: {
    color: HomeColors.textSecondary,
    marginTop: 4,
    fontSize: 13,
  },
  banner: {
    color: "#F87171",
    marginTop: 8,
    fontSize: 13,
  },
  form: {
    marginTop: 10,
    gap: 8,
  },
  label: {
    color: HomeColors.textMuted,
    fontSize: 12,
    marginTop: 4,
  },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    alignItems: "center",
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: HomeColors.border,
  },
  chipOn: {
    backgroundColor: HomeColors.white,
    borderColor: HomeColors.white,
  },
  chipText: {
    color: HomeColors.textSecondary,
    fontWeight: "600",
  },
  chipTextOn: {
    color: HomeColors.black,
  },
  input: {
    flex: 1,
    minWidth: 80,
    borderWidth: 1,
    borderColor: HomeColors.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: HomeColors.textPrimary,
  },
  primary: {
    backgroundColor: HomeColors.white,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
    marginTop: 8,
    minWidth: 140,
  },
  primaryText: {
    color: HomeColors.black,
    fontWeight: "700",
  },
  danger: {
    borderWidth: 1,
    borderColor: "#B91C1C",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 8,
  },
  dangerText: {
    color: "#F87171",
    fontWeight: "700",
  },
  note: {
    color: HomeColors.textMuted,
    marginTop: 8,
    fontSize: 13,
  },
});
