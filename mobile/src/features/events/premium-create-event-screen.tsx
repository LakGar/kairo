import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CreateEventOptionCard } from "./components/create-event-option-card";
import { CreateEventPillInput } from "./components/create-event-pill-input";
import { CreateEventSection } from "./components/create-event-section";
import { CreateEventToggleRow } from "./components/create-event-toggle-row";
import type {
  CreateEventForm,
  CreateEventFormErrors,
  EventFormat,
  ProofType,
  StakeType,
} from "./create-event.types";
import { validateCreateEventForm } from "./create-event-validation";

const C = {
  deepBackground: "#0B0F14",
  background: "#10292C",
  panel: "rgba(255,255,255,0.10)",
  panelStrong: "rgba(255,255,255,0.14)",
  border: "rgba(255,255,255,0.10)",
  textPrimary: "#F8FAFC",
  textSecondary: "#CBD5E1",
  textMuted: "#9CA3AF",
  white: "#FFFFFF",
  black: "#000000",
  success: "#86EFAC",
  danger: "#EF4444",
};

const H_PAD = 24;

const INITIAL_FORM: CreateEventForm = {
  title: "",
  description: "",
  coverImageUrl: undefined,
  startsAtLabel: "Sun, May 3 at 10:00 AM",
  endsAtLabel: "11:00 AM",
  locationName: "",
  visibility: "PUBLIC",
  format: "OPEN_MEETUP",
  allowSoloPlayers: true,
  allowTeams: true,
  allowWatchers: false,
  allowVolunteers: false,
  stakeType: "NONE",
  stakeNote: "",
  proofType: "PHOTO",
  proofPrompt: "",
  maxTeams: "",
  maxSoloPlayers: "",
  maxWatchers: "",
  maxVolunteers: "",
  requireApproval: false,
  priceLabel: "Free",
};

const FORMAT_OPTIONS: { value: EventFormat; label: string }[] = [
  { value: "OPEN_MEETUP", label: "Open meetup" },
  { value: "TEAM_TOURNAMENT", label: "Team tournament" },
  { value: "SOLO_COMPETITION", label: "Solo competition" },
  { value: "ROUND_ROBIN", label: "Round robin" },
  { value: "SINGLE_ELIMINATION", label: "Single elimination" },
];

const STAKE_OPTIONS: { value: StakeType; label: string }[] = [
  { value: "NONE", label: "No stakes" },
  { value: "TASK", label: "Fun loser task" },
  { value: "DONATION", label: "Donation challenge" },
  { value: "PRIZE", label: "Prize/reward challenge" },
];

const PROOF_OPTIONS: { value: ProofType; label: string }[] = [
  { value: "NONE", label: "No proof required" },
  { value: "PHOTO", label: "Photo proof" },
  { value: "SCORE_CONFIRMATION", label: "Score confirmation" },
  { value: "FRIEND_VERIFICATION", label: "Friend verification" },
  { value: "ORGANIZER_APPROVAL", label: "Organizer approval" },
];

function IconPillRow({
  icon,
  children,
  onPress,
  multilineInput,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  children: React.ReactNode;
  onPress?: () => void;
  multilineInput?: boolean;
}) {
  const content = (
    <View style={[styles.iconPill, multilineInput && styles.iconPillTall]}>
      <Ionicons name={icon} size={22} color={C.textMuted} style={styles.iconPillIcon} />
      <View style={styles.iconPillBody}>{children}</View>
    </View>
  );
  if (onPress) {
    return (
      <Pressable onPress={onPress} accessibilityRole="button">
        {content}
      </Pressable>
    );
  }
  return content;
}

function TimePanel({
  startLabel,
  endLabel,
  onPressStart,
  onPressEnd,
  startError,
  showStartError,
}: {
  startLabel: string;
  endLabel: string;
  onPressStart: () => void;
  onPressEnd: () => void;
  startError?: string;
  showStartError: boolean;
}) {
  return (
    <View style={styles.timePanel}>
      <View style={styles.timePanelRow}>
        <View style={styles.timeRail}>
          <View style={styles.timeDotSolid} />
          <View style={styles.timeLine} />
          <View style={styles.timeDotHollow} />
        </View>
        <View style={styles.timeRows}>
          <Pressable onPress={onPressStart} style={styles.timeRow} accessibilityRole="button">
            <Text style={styles.timeLabel}>Start</Text>
            <Text style={styles.timeValue} numberOfLines={1}>
              {startLabel}
            </Text>
          </Pressable>
          <Pressable onPress={onPressEnd} style={styles.timeRow} accessibilityRole="button">
            <Text style={styles.timeLabel}>End</Text>
            <Text style={styles.timeValue} numberOfLines={1}>
              {endLabel}
            </Text>
          </Pressable>
        </View>
      </View>
      {showStartError && startError ? <Text style={styles.fieldError}>{startError}</Text> : null}
    </View>
  );
}

function AccessPanel({
  requireApproval,
  onRequireApproval,
  priceLabel,
  onPricePress,
}: {
  requireApproval: boolean;
  onRequireApproval: (v: boolean) => void;
  priceLabel: string;
  onPricePress: () => void;
}) {
  return (
    <View style={styles.groupPanel}>
      <CreateEventToggleRow
        label="Require approval"
        icon="lock-closed-outline"
        value={requireApproval}
        onValueChange={onRequireApproval}
      />
      <View style={styles.divider} />
      <Pressable
        onPress={onPricePress}
        style={styles.priceRow}
        accessibilityRole="button"
        accessibilityLabel="Entry fee"
      >
        <View style={styles.priceLeft}>
          <Ionicons name="cash-outline" size={20} color={C.textMuted} />
          <Text style={styles.priceLabel}>Price</Text>
        </View>
        <View style={styles.priceRight}>
          <Text style={styles.priceValue}>{priceLabel}</Text>
          <Ionicons name="chevron-forward" size={18} color={C.textMuted} />
        </View>
      </Pressable>
    </View>
  );
}

export function PremiumCreateEventScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [form, setForm] = useState<CreateEventForm>(INITIAL_FORM);
  const [errors, setErrors] = useState<CreateEventFormErrors>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const bottomPad = useMemo(() => Math.max(insets.bottom, 20) + 100, [insets.bottom]);

  const patchForm = useCallback(
    <K extends keyof CreateEventForm>(key: K, value: CreateEventForm[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
      const errKey: keyof CreateEventFormErrors | null =
        key === "title"
          ? "title"
          : key === "locationName"
            ? "location"
            : key === "startsAtLabel"
              ? "start"
              : key === "allowSoloPlayers" || key === "allowTeams"
                ? "participation"
                : null;
      if (errKey) {
        setErrors((e) => {
          const next = { ...e };
          delete next[errKey];
          return next;
        });
      }
    },
    [],
  );

  const showErr = useCallback(
    (key: keyof CreateEventFormErrors) =>
      submitAttempted && Boolean(errors[key]),
    [submitAttempted, errors],
  );

  const runSubmit = useCallback(() => {
    setSubmitAttempted(true);
    setSubmitSuccess(false);
    const result = validateCreateEventForm(form);
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    setErrors({});
    console.log("Create event payload", result.payload);
    // TODO: call backend create event API when ready (replace console.log).
    setSubmitSuccess(true);
  }, [form]);

  const handleBack = useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      router.replace("/(tabs)/(home)/dashboard");
    }
  }, [navigation, router]);

  const coverUri = form.coverImageUrl;

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={[C.background, C.deepBackground]}
        locations={[0, 0.55]}
        style={StyleSheet.absoluteFill}
      />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={insets.top}
      >
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <Pressable
            onPress={handleBack}
            hitSlop={12}
            style={styles.headerSide}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons name="chevron-back" size={28} color={C.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitle}>Create Event</Text>
          <Pressable
            onPress={runSubmit}
            hitSlop={12}
            style={styles.checkBtn}
            accessibilityRole="button"
            accessibilityLabel="Save event"
          >
            <Ionicons name="checkmark" size={22} color={C.black} />
          </Pressable>
        </View>

        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPad }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.coverWrap} accessibilityLabel="Event cover">
            {coverUri ? (
              <Image source={{ uri: coverUri }} style={styles.coverImg} contentFit="cover" />
            ) : (
              <LinearGradient
                colors={["#1a5c66", "#0d2830", C.deepBackground]}
                start={{ x: 0.1, y: 0 }}
                end={{ x: 0.9, y: 1 }}
                style={styles.coverImg}
              />
            )}
            <Pressable
              style={styles.coverFab}
              onPress={() => {
                console.log("Change cover image");
                // TODO: open image picker when dependency is added.
              }}
              accessibilityRole="button"
              accessibilityLabel="Add cover image"
            >
              <Ionicons name="image-outline" size={20} color={C.textPrimary} />
            </Pressable>
          </View>

          <View style={styles.block}>
            <CreateEventPillInput
              value={form.title}
              onChangeText={(t) => patchForm("title", t)}
              placeholder="Event Name"
              error={showErr("title") ? errors.title : undefined}
              accessibilityLabel="Event name"
            />
          </View>

          <View style={styles.block}>
            <TimePanel
              startLabel={form.startsAtLabel}
              endLabel={form.endsAtLabel}
              onPressStart={() => {
                console.log("TODO: date/time picker for start");
              }}
              onPressEnd={() => {
                console.log("TODO: date/time picker for end");
              }}
              startError={errors.start}
              showStartError={showErr("start")}
            />
          </View>

          <View style={styles.block}>
            <IconPillRow icon="location-outline">
              <TextInput
                value={form.locationName}
                onChangeText={(t) => patchForm("locationName", t)}
                placeholder="Choose Location"
                placeholderTextColor={C.textMuted}
                style={styles.inlineInput}
              />
            </IconPillRow>
            {showErr("location") ? <Text style={styles.fieldError}>{errors.location}</Text> : null}
          </View>

          <View style={styles.block}>
            <IconPillRow icon="document-text-outline" multilineInput>
              <TextInput
                value={form.description}
                onChangeText={(t) => patchForm("description", t)}
                placeholder="Add Description"
                placeholderTextColor={C.textMuted}
                style={[styles.inlineInput, styles.inlineInputMulti]}
                multiline
              />
            </IconPillRow>
          </View>

          <View style={styles.block}>
            <CreateEventSection title="Visibility">
              <View style={styles.cardStack}>
                <CreateEventOptionCard
                  title="Public"
                  subtitle="Anyone can find and join"
                  selected={form.visibility === "PUBLIC"}
                  onPress={() => patchForm("visibility", "PUBLIC")}
                />
                <CreateEventOptionCard
                  title="Private"
                  subtitle="Only people with the link"
                  selected={form.visibility === "PRIVATE"}
                  onPress={() => patchForm("visibility", "PRIVATE")}
                />
                <CreateEventOptionCard
                  title="Invite-only"
                  subtitle="Organizer approves or invites people"
                  selected={form.visibility === "INVITE_ONLY"}
                  onPress={() => patchForm("visibility", "INVITE_ONLY")}
                />
              </View>
            </CreateEventSection>
          </View>

          <View style={styles.block}>
            <CreateEventSection title="Participation">
              <View style={styles.groupPanel}>
                <CreateEventToggleRow
                  label="Solo players"
                  icon="person-outline"
                  value={form.allowSoloPlayers}
                  onValueChange={(v) => patchForm("allowSoloPlayers", v)}
                />
                <View style={styles.divider} />
                <CreateEventToggleRow
                  label="Teams"
                  icon="people-outline"
                  value={form.allowTeams}
                  onValueChange={(v) => patchForm("allowTeams", v)}
                />
                <View style={styles.divider} />
                <CreateEventToggleRow
                  label="Watchers"
                  icon="eye-outline"
                  value={form.allowWatchers}
                  onValueChange={(v) => patchForm("allowWatchers", v)}
                />
                <View style={styles.divider} />
                <CreateEventToggleRow
                  label="Volunteers"
                  icon="hand-left-outline"
                  value={form.allowVolunteers}
                  onValueChange={(v) => patchForm("allowVolunteers", v)}
                />
              </View>
              {showErr("participation") ? (
                <Text style={styles.fieldError}>{errors.participation}</Text>
              ) : null}
            </CreateEventSection>
          </View>

          <View style={styles.block}>
            <CreateEventSection title="Format">
              <View style={styles.cardStack}>
                {FORMAT_OPTIONS.map((opt) => (
                  <CreateEventOptionCard
                    key={opt.value}
                    title={opt.label}
                    selected={form.format === opt.value}
                    onPress={() => patchForm("format", opt.value)}
                  />
                ))}
              </View>
            </CreateEventSection>
          </View>

          <View style={styles.block}>
            <CreateEventSection
              title="Stakes"
              helperText="Stakes are social challenges, rewards, or donation commitments. No betting."
            >
              <View style={styles.cardStack}>
                {STAKE_OPTIONS.map((opt) => (
                  <CreateEventOptionCard
                    key={opt.value}
                    title={opt.label}
                    selected={form.stakeType === opt.value}
                    onPress={() => patchForm("stakeType", opt.value)}
                  />
                ))}
              </View>
              {form.stakeType === "TASK" ? (
                <CreateEventPillInput
                  value={form.stakeNote}
                  onChangeText={(t) => patchForm("stakeNote", t)}
                  placeholder="Example: Losing team buys smoothies"
                  accessibilityLabel="Loser task"
                />
              ) : null}
              {form.stakeType === "DONATION" ? (
                <CreateEventPillInput
                  value={form.stakeNote}
                  onChangeText={(t) => patchForm("stakeNote", t)}
                  placeholder="Example: Loser donates $10 to a cause"
                  accessibilityLabel="Donation note"
                />
              ) : null}
              {form.stakeType === "PRIZE" ? (
                <CreateEventPillInput
                  value={form.stakeNote}
                  onChangeText={(t) => patchForm("stakeNote", t)}
                  placeholder="Example: Winner gets free entry next week"
                  accessibilityLabel="Reward"
                />
              ) : null}
            </CreateEventSection>
          </View>

          <View style={styles.block}>
            <CreateEventSection title="Proof">
              <View style={styles.cardStack}>
                {PROOF_OPTIONS.map((opt) => (
                  <CreateEventOptionCard
                    key={opt.value}
                    title={opt.label}
                    selected={form.proofType === opt.value}
                    onPress={() => patchForm("proofType", opt.value)}
                  />
                ))}
              </View>
              {form.proofType !== "NONE" ? (
                <CreateEventPillInput
                  value={form.proofPrompt}
                  onChangeText={(t) => patchForm("proofPrompt", t)}
                  placeholder="Example: Take a team photo before the match"
                  accessibilityLabel="Proof prompt"
                />
              ) : null}
            </CreateEventSection>
          </View>

          <View style={styles.block}>
            <CreateEventSection title="Capacity">
              <View style={styles.cardStack}>
                {form.allowTeams ? (
                  <CreateEventPillInput
                    value={form.maxTeams}
                    onChangeText={(t) => patchForm("maxTeams", t)}
                    placeholder="Max teams"
                    keyboardType="number-pad"
                    accessibilityLabel="Max teams"
                  />
                ) : null}
                {form.allowSoloPlayers ? (
                  <CreateEventPillInput
                    value={form.maxSoloPlayers}
                    onChangeText={(t) => patchForm("maxSoloPlayers", t)}
                    placeholder="Max solo players"
                    keyboardType="number-pad"
                    accessibilityLabel="Max solo players"
                  />
                ) : null}
                {form.allowWatchers ? (
                  <CreateEventPillInput
                    value={form.maxWatchers}
                    onChangeText={(t) => patchForm("maxWatchers", t)}
                    placeholder="Max watchers"
                    keyboardType="number-pad"
                    accessibilityLabel="Max watchers"
                  />
                ) : null}
                {form.allowVolunteers ? (
                  <CreateEventPillInput
                    value={form.maxVolunteers}
                    onChangeText={(t) => patchForm("maxVolunteers", t)}
                    placeholder="Max volunteers"
                    keyboardType="number-pad"
                    accessibilityLabel="Max volunteers"
                  />
                ) : null}
                {!form.allowTeams &&
                !form.allowSoloPlayers &&
                !form.allowWatchers &&
                !form.allowVolunteers ? (
                  <Text style={styles.mutedNote}>
                    Enable participation options above to set capacity limits.
                  </Text>
                ) : null}
              </View>
            </CreateEventSection>
          </View>

          <View style={styles.block}>
            <CreateEventSection title="Access">
              <AccessPanel
                requireApproval={form.requireApproval}
                onRequireApproval={(v) => patchForm("requireApproval", v)}
                priceLabel={form.priceLabel}
                onPricePress={() => {
                  console.log("TODO: entry fee / price flow when payments exist");
                }}
              />
            </CreateEventSection>
          </View>

          {submitSuccess ? (
            <Text style={styles.successBanner}>Saved locally — check the console for payload.</Text>
          ) : null}

          <Pressable
            style={styles.primaryBtn}
            onPress={runSubmit}
            accessibilityRole="button"
            accessibilityLabel="Create event"
          >
            <Text style={styles.primaryBtnText}>Create Event</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.deepBackground },
  flex: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: H_PAD - 8,
    paddingBottom: 12,
  },
  headerSide: { width: 44, alignItems: "flex-start", justifyContent: "center" },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    color: C.textPrimary,
    fontSize: 17,
    fontWeight: "600",
    letterSpacing: -0.2,
  },
  checkBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.white,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: {
    paddingHorizontal: H_PAD,
    paddingTop: 4,
    gap: 20,
  },
  coverWrap: {
    borderRadius: 28,
    overflow: "hidden",
    aspectRatio: 1.05,
    maxHeight: 320,
    alignSelf: "stretch",
  },
  coverImg: {
    width: "100%",
    height: "100%",
  },
  coverFab: {
    position: "absolute",
    right: 16,
    bottom: 16,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: C.panelStrong,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: C.border,
    alignItems: "center",
    justifyContent: "center",
  },
  block: { gap: 8 },
  timePanel: {
    backgroundColor: C.panel,
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: C.border,
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 10,
  },
  timePanelRow: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: 14,
  },
  timeRail: { width: 14, alignItems: "center", paddingTop: 6 },
  timeDotSolid: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: C.textSecondary,
  },
  timeLine: {
    flex: 1,
    width: 2,
    marginVertical: 4,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 1,
  },
  timeDotHollow: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: C.textSecondary,
    backgroundColor: "transparent",
  },
  timeRows: { flex: 1, gap: 18 },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  timeLabel: { color: C.textSecondary, fontSize: 15, fontWeight: "600" },
  timeValue: {
    flex: 1,
    textAlign: "right",
    color: C.textPrimary,
    fontSize: 15,
    fontWeight: "500",
  },
  iconPill: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 56,
    borderRadius: 999,
    paddingLeft: 18,
    paddingRight: 22,
    backgroundColor: C.panel,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: C.border,
  },
  iconPillTall: {
    minHeight: 120,
    alignItems: "flex-start",
    paddingTop: 16,
    borderRadius: 28,
  },
  iconPillIcon: { marginRight: 12, marginTop: 2 },
  iconPillBody: { flex: 1, minWidth: 0 },
  inlineInput: {
    color: C.textPrimary,
    fontSize: 17,
    fontWeight: "500",
    paddingVertical: 16,
    minHeight: 56,
  },
  inlineInputMulti: {
    minHeight: 100,
    textAlignVertical: "top",
    paddingTop: 4,
  },
  groupPanel: {
    backgroundColor: C.panel,
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: C.border,
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: C.border,
    marginLeft: 32,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 52,
    paddingVertical: 8,
  },
  priceLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  priceLabel: { color: C.textPrimary, fontSize: 16, fontWeight: "500" },
  priceRight: { flexDirection: "row", alignItems: "center", gap: 6 },
  priceValue: { color: C.textSecondary, fontSize: 15, fontWeight: "500" },
  cardStack: { gap: 10 },
  fieldError: {
    color: C.danger,
    fontSize: 13,
    fontWeight: "500",
    marginLeft: 8,
    marginTop: 4,
  },
  mutedNote: { color: C.textMuted, fontSize: 14, lineHeight: 20 },
  primaryBtn: {
    marginTop: 8,
    minHeight: 56,
    borderRadius: 999,
    backgroundColor: C.white,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  primaryBtnText: {
    color: C.black,
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  successBanner: {
    color: C.success,
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
    marginTop: 4,
  },
});
