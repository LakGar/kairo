import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { createEventSchema } from "@kairo/shared";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useThemeColor } from "@/hooks/use-theme-color";
import {
  createKairoApiFromEnv,
  getDevUserId,
  KairoApiConfigurationError,
  KairoApiError,
  type ApiEventPublic,
} from "@/src/api";

import { defaultStartsAtLocal } from "./create-event-defaults";

const FORMATS = [
  "OPEN_MEETUP",
  "TEAM_TOURNAMENT",
  "SOLO_COMPETITION",
  "ROUND_ROBIN",
  "SINGLE_ELIMINATION",
] as const;

const VISIBILITIES = ["PUBLIC", "PRIVATE", "INVITE_ONLY"] as const;

function labelEnum(v: string): string {
  return v.replaceAll("_", " ");
}

type Props = {
  onSuccess: (event: ApiEventPublic) => void;
};

export function CreateEventForm({ onSuccess }: Props) {
  const borderColor = useThemeColor({ light: "#C6C6C8", dark: "#3A3A3C" }, "icon");
  const textColor = useThemeColor({}, "text");
  const surface = useThemeColor({ light: "#F2F2F7", dark: "#1C1C1E" }, "background");
  const tint = useThemeColor({}, "tint");
  const placeholderColor = "#8E8E93";

  const [title, setTitle] = useState("");
  const [activityType, setActivityType] = useState("");
  const [format, setFormat] = useState<(typeof FORMATS)[number]>("OPEN_MEETUP");
  const [visibility, setVisibility] = useState<(typeof VISIBILITIES)[number]>("PUBLIC");
  const [locationName, setLocationName] = useState("");
  const [city, setCity] = useState("");
  const [startsAt, setStartsAt] = useState(defaultStartsAtLocal);
  const [endsAt, setEndsAt] = useState("");
  const [description, setDescription] = useState("");
  const [allowTeams, setAllowTeams] = useState(true);
  const [allowSoloPlayers, setAllowSoloPlayers] = useState(true);
  const [allowWatchers, setAllowWatchers] = useState(true);
  const [allowVolunteers, setAllowVolunteers] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  const devUserConfigured = Boolean(getDevUserId()?.trim());

  const inputStyle = useMemo(
    () => [
      styles.input,
      {
        borderColor,
        color: textColor,
        backgroundColor: surface,
      },
    ],
    [borderColor, textColor, surface],
  );

  const onSubmit = async () => {
    setValidationError(null);
    setApiError(null);

    const raw = {
      title: title.trim(),
      description: description.trim() === "" ? undefined : description.trim(),
      activityType: activityType.trim(),
      format,
      visibility,
      locationName: locationName.trim() === "" ? undefined : locationName.trim(),
      city: city.trim() === "" ? undefined : city.trim(),
      startsAt,
      endsAt: endsAt.trim() === "" ? undefined : endsAt.trim(),
      allowTeams,
      allowSoloPlayers,
      allowWatchers,
      allowVolunteers,
      currency: "USD" as const,
    };

    const parsed = createEventSchema.safeParse(raw);
    if (!parsed.success) {
      const flat = parsed.error.flatten();
      const fieldMsgs = Object.entries(flat.fieldErrors)
        .flatMap(([key, msgs]) => (msgs?.length ? msgs.map((m) => `${key}: ${m}`) : []))
        .join("\n");
      setValidationError(fieldMsgs || parsed.error.message);
      return;
    }

    setSubmitting(true);
    try {
      const api = createKairoApiFromEnv();
      const event = await api.createEvent(parsed.data);
      onSuccess(event);
    } catch (e) {
      if (e instanceof KairoApiConfigurationError) {
        setApiError(e.message);
      } else if (e instanceof KairoApiError) {
        setApiError(e.message);
      } else {
        setApiError(e instanceof Error ? e.message : "Could not create event.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scroll}
        keyboardDismissMode="on-drag"
      >
        <ThemedView style={styles.section}>
          <ThemedText type="muted">
            New events are saved as a draft on the server. Publish from the website or a
            later mobile flow. Creating requires EXPO_PUBLIC_KAIRO_DEV_USER_ID in
            mobile/.env until Clerk is wired on the API.
          </ThemedText>
          {!devUserConfigured ? (
            <ThemedText type="small" style={styles.warn}>
              No dev user id detected — the API will return 401 until you set
              EXPO_PUBLIC_KAIRO_DEV_USER_ID.
            </ThemedText>
          ) : null}
        </ThemedView>

        {validationError ? (
          <ThemedView style={styles.banner}>
            <ThemedText type="small" style={styles.bannerText}>
              {validationError}
            </ThemedText>
          </ThemedView>
        ) : null}
        {apiError ? (
          <ThemedView style={styles.bannerApi}>
            <ThemedText type="small" style={styles.bannerText}>
              {apiError}
            </ThemedText>
          </ThemedView>
        ) : null}

        <ThemedView style={styles.section}>
          <ThemedText type="subtitle">Basics</ThemedText>
          <ThemedText type="small">Title</ThemedText>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Neighborhood pickup game"
            placeholderTextColor={placeholderColor}
            style={inputStyle}
          />
          <ThemedText type="small">Activity type</ThemedText>
          <TextInput
            value={activityType}
            onChangeText={setActivityType}
            placeholder="Basketball, running club, …"
            placeholderTextColor={placeholderColor}
            style={inputStyle}
          />
          <ThemedText type="small">Description (optional)</ThemedText>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="What should people know?"
            placeholderTextColor={placeholderColor}
            style={[inputStyle, styles.multiline]}
            multiline
          />
        </ThemedView>

        <ThemedView style={styles.section}>
          <ThemedText type="subtitle">Format</ThemedText>
          <View style={styles.chipRow}>
            {FORMATS.map((f) => (
              <Pressable
                key={f}
                onPress={() => setFormat(f)}
                style={[
                  styles.chip,
                  { borderColor },
                  format === f && { borderColor: tint, backgroundColor: `${tint}22` },
                ]}
              >
                <ThemedText type="small" numberOfLines={1}>
                  {labelEnum(f)}
                </ThemedText>
              </Pressable>
            ))}
          </View>
        </ThemedView>

        <ThemedView style={styles.section}>
          <ThemedText type="subtitle">Visibility</ThemedText>
          <View style={styles.chipRow}>
            {VISIBILITIES.map((v) => (
              <Pressable
                key={v}
                onPress={() => setVisibility(v)}
                style={[
                  styles.chip,
                  { borderColor },
                  visibility === v && { borderColor: tint, backgroundColor: `${tint}22` },
                ]}
              >
                <ThemedText type="small">{labelEnum(v)}</ThemedText>
              </Pressable>
            ))}
          </View>
        </ThemedView>

        <ThemedView style={styles.section}>
          <ThemedText type="subtitle">Where & when</ThemedText>
          <ThemedText type="small">Venue name (optional)</ThemedText>
          <TextInput
            value={locationName}
            onChangeText={setLocationName}
            placeholder="Mission Gym"
            placeholderTextColor={placeholderColor}
            style={inputStyle}
          />
          <ThemedText type="small">City (optional)</ThemedText>
          <TextInput
            value={city}
            onChangeText={setCity}
            placeholder="San Francisco"
            placeholderTextColor={placeholderColor}
            style={inputStyle}
          />
          <ThemedText type="small">Starts at (local)</ThemedText>
          <TextInput
            value={startsAt}
            onChangeText={setStartsAt}
            placeholder="2026-06-01T18:00"
            placeholderTextColor={placeholderColor}
            style={inputStyle}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <ThemedText type="small">Ends at (optional, same format)</ThemedText>
          <TextInput
            value={endsAt}
            onChangeText={setEndsAt}
            placeholder="Leave blank for open-ended"
            placeholderTextColor={placeholderColor}
            style={inputStyle}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </ThemedView>

        <ThemedView style={styles.section}>
          <ThemedText type="subtitle">Who can join</ThemedText>
          <View style={styles.switchRow}>
            <ThemedText>Teams</ThemedText>
            <Switch value={allowTeams} onValueChange={setAllowTeams} />
          </View>
          <View style={styles.switchRow}>
            <ThemedText>Solo players</ThemedText>
            <Switch value={allowSoloPlayers} onValueChange={setAllowSoloPlayers} />
          </View>
          <View style={styles.switchRow}>
            <ThemedText>Watchers</ThemedText>
            <Switch value={allowWatchers} onValueChange={setAllowWatchers} />
          </View>
          <View style={styles.switchRow}>
            <ThemedText>Volunteers</ThemedText>
            <Switch value={allowVolunteers} onValueChange={setAllowVolunteers} />
          </View>
        </ThemedView>

        <Pressable
          style={[styles.submit, submitting && styles.submitDisabled]}
          onPress={() => void onSubmit()}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <ThemedText style={styles.submitLabel}>Create draft</ThemedText>
          )}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 8,
  },
  section: {
    gap: 8,
    marginTop: 12,
  },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  multiline: {
    minHeight: 88,
    textAlignVertical: "top",
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  submit: {
    marginTop: 24,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: "#0a7ea4",
  },
  submitDisabled: {
    opacity: 0.75,
  },
  submitLabel: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  banner: {
    backgroundColor: "#FEF3C7",
    padding: 12,
    borderRadius: 10,
    marginTop: 8,
  },
  bannerApi: {
    backgroundColor: "#FEE2E2",
    padding: 12,
    borderRadius: 10,
    marginTop: 8,
  },
  bannerText: {
    color: "#1C1917",
  },
  warn: {
    marginTop: 8,
    color: "#B45309",
  },
});
