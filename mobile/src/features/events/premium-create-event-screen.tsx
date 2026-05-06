import { useUser } from "@clerk/expo";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { Image } from "expo-image";
import { type Href, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import DateTimePicker from "@react-native-community/datetimepicker";
import { BlurView } from "expo-blur";
import * as ImagePicker from "expo-image-picker";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColorScheme } from "@/hooks/useColorScheme";
import { getDefaultResultVerificationModeForEventFormat } from "@kairo/shared";

import {
  createKairoApiFromEnv,
  getApiBaseUrl,
  getLinkedKairoUserId,
  KairoApiConfigurationError,
  KairoApiError,
  resolveActingUserId,
} from "@/src/api";
import {
  createEventColorsDark,
  createEventColorsLight,
  type CreateEventScreenColors,
} from "@/src/features/events/create-event-screen-colors";
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
import {
  CreateEventColorsProvider,
  useCreateEventColors,
} from "./create-event-colors-context";
import {
  defaultPremiumSchedule,
  formatPremiumEndLabel,
  formatPremiumStartLabel,
  premiumProofPromptPayloadForApi,
  premiumStakePayloadForApi,
  safeParseCreateEventForPremium,
  validatePremiumScheduleDates,
} from "./premium-create-event-map-api";
import { suggestPremiumProofPromptContent } from "./premium-proof-prompt-templates";

const H_PAD = 24;
/** Matches header overlay: `paddingTop` after safe area + bar row + bottom padding. */
const HEADER_OVERLAY_BODY_HEIGHT = 8 + 44 + 12;
const COVER_CORNER_RADIUS = 28;

const androidHeaderBlur =
  Platform.OS === "android"
    ? { experimentalBlurMethod: "dimezisBlurView" as const }
    : {};

function makePremiumStyles(c: CreateEventScreenColors) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: c.deepBackground },
    flex: { flex: 1 },
    /** Scroll area sits full-screen; header is absolutely overlaid so content blurs underneath. */
    body: { flex: 1 },
    scrollFlex: { flex: 1 },
    headerOverlay: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      zIndex: 100,
      overflow: "hidden",
      backgroundColor: "transparent",
    },
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: H_PAD - 8,
      paddingBottom: 12,
      minHeight: 44,
    },
    headerSide: { width: 44, alignItems: "flex-start", justifyContent: "center" },
    headerTitle: {
      flex: 1,
      textAlign: "center",
      color: c.textPrimary,
      fontSize: 17,
      fontWeight: "600",
      letterSpacing: -0.2,
    },
    checkBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: c.white,
      alignItems: "center",
      justifyContent: "center",
    },
    /** Cover is full-bleed; form uses `scrollForm` for horizontal inset. */
    scrollContent: {
      paddingHorizontal: 0,
      paddingTop: 0,
      gap: 20,
    },
    scrollForm: {
      paddingHorizontal: H_PAD,
      gap: 20,
    },
    coverWrap: {
      position: "relative",
      alignSelf: "center",
      borderRadius: COVER_CORNER_RADIUS,
      overflow: "hidden",
      aspectRatio: 1.05,
      maxHeight: 320,
    },
    /** Absolute fill so expo-image fills the hero; radius matches wrap for clean clipping. */
    coverImg: {
      ...StyleSheet.absoluteFillObject,
      borderRadius: COVER_CORNER_RADIUS,
    },
    coverFab: {
      position: "absolute",
      right: 16,
      bottom: 16,
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: c.panelStrong,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
      alignItems: "center",
      justifyContent: "center",
    },
    block: { gap: 8 },
    timePanel: {
      backgroundColor: c.panel,
      borderRadius: 22,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
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
      backgroundColor: c.textSecondary,
    },
    timeLine: {
      flex: 1,
      width: 2,
      marginVertical: 4,
      backgroundColor: c.timeLine,
      borderRadius: 1,
    },
    timeDotHollow: {
      width: 10,
      height: 10,
      borderRadius: 5,
      borderWidth: 2,
      borderColor: c.textSecondary,
      backgroundColor: "transparent",
    },
    timeRows: { flex: 1, gap: 18 },
    timeRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
    },
    timeLabel: { color: c.textSecondary, fontSize: 15, fontWeight: "600" },
    timeValue: {
      flex: 1,
      textAlign: "right",
      color: c.textPrimary,
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
      backgroundColor: c.panel,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
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
      color: c.textPrimary,
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
      backgroundColor: c.panel,
      borderRadius: 22,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
      paddingHorizontal: 16,
      paddingVertical: 4,
    },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: c.border,
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
    priceLabel: { color: c.textPrimary, fontSize: 16, fontWeight: "500" },
    priceRight: { flexDirection: "row", alignItems: "center", gap: 6 },
    priceValue: { color: c.textSecondary, fontSize: 15, fontWeight: "500" },
    cardStack: { gap: 10 },
    fieldError: {
      color: c.danger,
      fontSize: 13,
      fontWeight: "500",
      marginLeft: 8,
      marginTop: 4,
    },
    mutedNote: { color: c.textMuted, fontSize: 14, lineHeight: 20 },
    primaryBtn: {
      marginTop: 8,
      minHeight: 56,
      borderRadius: 999,
      backgroundColor: c.white,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 24,
    },
    primaryBtnText: {
      color: c.black,
      fontSize: 17,
      fontWeight: "700",
      letterSpacing: -0.2,
    },
    apiErrorBanner: {
      color: c.danger,
      fontSize: 14,
      fontWeight: "600",
      lineHeight: 20,
      marginTop: 4,
    },
    promptActions: { flexDirection: "row", gap: 10, marginTop: 4 },
    secondaryBtn: {
      flex: 1,
      minHeight: 44,
      borderRadius: 999,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
      backgroundColor: c.panel,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 10,
    },
    secondaryBtnText: { color: c.textPrimary, fontSize: 14, fontWeight: "600", textAlign: "center" },
  });
}

export type PremiumCreateEventStyles = ReturnType<typeof makePremiumStyles>;

const INITIAL_FORM: CreateEventForm = {
  title: "",
  description: "",
  coverImageUrl: undefined,
  startsAtLabel: "Sun, May 3 at 10:00 AM",
  endsAtLabel: "11:00 AM",
  locationName: "",
  address: "",
  city: "",
  state: "",
  country: "",
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

function resultVerificationFormatHint(format: EventFormat): string {
  return getDefaultResultVerificationModeForEventFormat(format) === "TEAM_AGREEMENT"
    ? "Teams agree on results. Disputes go to the organizer."
    : "Organizer confirms results.";
}

const STAKE_OPTIONS: { value: StakeType; label: string }[] = [
  { value: "NONE", label: "No stakes" },
  { value: "TASK", label: "Fun loser task" },
  { value: "DONATION", label: "Donation challenge" },
  { value: "PRIZE", label: "Prize/reward challenge" },
];

const PROOF_OPTIONS: { value: ProofType; label: string }[] = [
  { value: "NONE", label: "No proof required" },
  { value: "PHOTO", label: "Photo proof" },
  { value: "VIDEO", label: "Video proof" },
  { value: "PHOTO_OR_VIDEO", label: "Photo or video proof" },
];

function IconPillRow({
  icon,
  children,
  onPress,
  multilineInput,
  ui,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  children: React.ReactNode;
  onPress?: () => void;
  multilineInput?: boolean;
  ui: PremiumCreateEventStyles;
}) {
  const c = useCreateEventColors();
  const content = (
    <View style={[ui.iconPill, multilineInput && ui.iconPillTall]}>
      <Ionicons name={icon} size={22} color={c.textMuted} style={ui.iconPillIcon} />
      <View style={ui.iconPillBody}>{children}</View>
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
  ui,
}: {
  startLabel: string;
  endLabel: string;
  onPressStart: () => void;
  onPressEnd: () => void;
  startError?: string;
  showStartError: boolean;
  ui: PremiumCreateEventStyles;
}) {
  return (
    <View style={ui.timePanel}>
      <View style={ui.timePanelRow}>
        <View style={ui.timeRail}>
          <View style={ui.timeDotSolid} />
          <View style={ui.timeLine} />
          <View style={ui.timeDotHollow} />
        </View>
        <View style={ui.timeRows}>
          <Pressable onPress={onPressStart} style={ui.timeRow} accessibilityRole="button">
            <Text style={ui.timeLabel}>Start</Text>
            <Text style={ui.timeValue} numberOfLines={1}>
              {startLabel}
            </Text>
          </Pressable>
          <Pressable onPress={onPressEnd} style={ui.timeRow} accessibilityRole="button">
            <Text style={ui.timeLabel}>End</Text>
            <Text style={ui.timeValue} numberOfLines={1}>
              {endLabel}
            </Text>
          </Pressable>
        </View>
      </View>
      {showStartError && startError ? <Text style={ui.fieldError}>{startError}</Text> : null}
    </View>
  );
}

function AccessPanel({
  requireApproval,
  onRequireApproval,
  priceLabel,
  onPricePress,
  ui,
}: {
  requireApproval: boolean;
  onRequireApproval: (v: boolean) => void;
  priceLabel: string;
  onPricePress: () => void;
  ui: PremiumCreateEventStyles;
}) {
  const c = useCreateEventColors();
  return (
    <View style={ui.groupPanel}>
      <CreateEventToggleRow
        label="Require approval"
        icon="lock-closed-outline"
        value={requireApproval}
        onValueChange={onRequireApproval}
      />
      <View style={ui.divider} />
      <Pressable
        onPress={onPricePress}
        style={ui.priceRow}
        accessibilityRole="button"
        accessibilityLabel="Entry fee"
      >
        <View style={ui.priceLeft}>
          <Ionicons name="cash-outline" size={20} color={c.textMuted} />
          <Text style={ui.priceLabel}>Price</Text>
        </View>
        <View style={ui.priceRight}>
          <Text style={ui.priceValue}>{priceLabel}</Text>
          <Ionicons name="chevron-forward" size={18} color={c.textMuted} />
        </View>
      </Pressable>
    </View>
  );
}

export function PremiumCreateEventScreen() {
  const { user } = useUser();
  const router = useRouter();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const colorScheme = useColorScheme() ?? "light";
  const c = colorScheme === "dark" ? createEventColorsDark : createEventColorsLight;
  /** Opaque modal chrome — `c.panel` is translucent and makes pickers hard to read. */
  const modalChrome = useMemo(
    () =>
      colorScheme === "dark"
        ? {
            backdrop: "rgba(0,0,0,0.88)",
            sheet: "#1C1C1E",
            border: "#3A3A3C",
            inputBg: "#2C2C2E",
            chipBg: "#3A3A3C",
            text: "#F9FAFB",
            muted: "#A1A1AA",
          }
        : {
            backdrop: "rgba(15,23,42,0.55)",
            sheet: "#FFFFFF",
            border: "#E2E8F0",
            inputBg: "#F1F5F9",
            chipBg: "#E2E8F0",
            text: "#0F172A",
            muted: "#64748B",
          },
    [colorScheme],
  );
  const styles = useMemo(() => makePremiumStyles(c), [c]);
  const [schedule, setSchedule] = useState(defaultPremiumSchedule);
  const [form, setForm] = useState<CreateEventForm>(INITIAL_FORM);
  /** iOS: modal + spinner. Android: native dialog via conditional mount. */
  const [iosScheduleModal, setIosScheduleModal] = useState<null | "start" | "end">(null);
  const [scheduleDraft, setScheduleDraft] = useState(new Date());
  const [androidSchedulePicker, setAndroidSchedulePicker] = useState<null | "start" | "end">(null);
  const [priceModalVisible, setPriceModalVisible] = useState(false);
  const [priceDraft, setPriceDraft] = useState("");
  const [coverBusy, setCoverBusy] = useState(false);
  const [errors, setErrors] = useState<CreateEventFormErrors>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [proofPromptTemplateVariant, setProofPromptTemplateVariant] = useState(0);

  const bottomPad = useMemo(() => Math.max(insets.bottom, 20) + 100, [insets.bottom]);
  /** Scroll content starts below the frosted header so the hero has a clear top edge and rounded corners. */
  const scrollPadTop = useMemo(
    () => insets.top + HEADER_OVERLAY_BODY_HEIGHT,
    [insets.top],
  );

  const patchForm = useCallback(
    <K extends keyof CreateEventForm>(key: K, value: CreateEventForm[K]) => {
      setApiError(null);
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

  useEffect(() => {
    setProofPromptTemplateVariant(0);
  }, [form.proofType]);

  useEffect(() => {
    setForm((f) => ({
      ...f,
      startsAtLabel: formatPremiumStartLabel(schedule.startsAt),
      endsAtLabel: formatPremiumEndLabel(schedule.endsAt),
    }));
  }, [schedule.startsAt, schedule.endsAt]);

  const openScheduleEditor = useCallback((mode: "start" | "end") => {
    setScheduleDraft(mode === "start" ? schedule.startsAt : schedule.endsAt);
    if (Platform.OS === "android") {
      setAndroidSchedulePicker(mode);
    } else {
      setIosScheduleModal(mode);
    }
  }, [schedule.endsAt, schedule.startsAt]);

  const handlePickCoverImage = useCallback(async () => {
    if (coverBusy) return;
    const acting = resolveActingUserId(getLinkedKairoUserId(user));
    const base = getApiBaseUrl().trim();
    if (!acting || !base) {
      Alert.alert("Sign in required", "Connect your account to upload a cover image.");
      return;
    }
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Photos", "Allow photo library access to set a cover image.");
      return;
    }
    setCoverBusy(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.85,
        allowsEditing: true,
        aspect: [16, 9],
      });
      if (result.canceled) return;
      const asset = result.assets[0];
      if (!asset) return;
      const uri = asset.uri;
      const mime =
        asset.mimeType === "image/png"
          ? ("image/png" as const)
          : ("image/jpeg" as const);
      const fileSize =
        typeof asset.fileSize === "number" && asset.fileSize > 0 ? asset.fileSize : 1_500_000;
      const api = createKairoApiFromEnv({ userId: getLinkedKairoUserId(user) });
      const instr = await api.createEventCoverMediaUploadUrl({
        contentType: mime,
        fileSize,
      });
      const blob = await (await fetch(uri)).blob();
      const put = await fetch(instr.uploadUrl, {
        method: "PUT",
        body: blob,
        headers: instr.headers,
      });
      if (!put.ok) {
        const t = await put.text().catch(() => "");
        throw new Error(t || `Upload failed (${put.status})`);
      }
      patchForm("coverImageUrl", instr.publicUrl);
    } catch (e) {
      Alert.alert(
        "Cover image",
        e instanceof Error ? e.message : "Could not upload cover. Check API and Supabase Storage.",
      );
    } finally {
      setCoverBusy(false);
    }
  }, [coverBusy, patchForm, user]);

  const handleGenerateProofPrompt = useCallback(() => {
    if (form.proofType === "NONE") return;
    const next = 0;
    const { title } = suggestPremiumProofPromptContent(form, next);
    patchForm("proofPrompt", title);
    setProofPromptTemplateVariant(next);
  }, [form, patchForm]);

  const handleRegenerateProofPrompt = useCallback(() => {
    if (form.proofType === "NONE") return;
    const next = proofPromptTemplateVariant + 1;
    const { title } = suggestPremiumProofPromptContent(form, next);
    patchForm("proofPrompt", title);
    setProofPromptTemplateVariant(next);
  }, [form, patchForm, proofPromptTemplateVariant]);

  const showErr = useCallback(
    (key: keyof CreateEventFormErrors) =>
      submitAttempted && Boolean(errors[key]),
    [submitAttempted, errors],
  );

  const runSubmit = useCallback(async () => {
    if (submitting) return;
    setSubmitAttempted(true);
    setApiError(null);
    const result = validateCreateEventForm(form, { skipStartLabel: true });
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    const scheduleErr = validatePremiumScheduleDates(schedule.startsAt, schedule.endsAt);
    if (scheduleErr) {
      setErrors({ start: scheduleErr });
      return;
    }
    setErrors({});

    const parsed = safeParseCreateEventForPremium(form, schedule.startsAt, schedule.endsAt);
    if (!parsed.ok) {
      setApiError(parsed.message);
      return;
    }

    const base = getApiBaseUrl().trim();
    const acting = resolveActingUserId(getLinkedKairoUserId(user));
    if (!base || !acting) {
      setApiError(
        "Missing API user or URL. Set EXPO_PUBLIC_API_URL, complete sign-in bootstrap, or set EXPO_PUBLIC_KAIRO_DEV_USER_ID (see mobile/.env.example).",
      );
      return;
    }

    setSubmitting(true);
    try {
      const api = createKairoApiFromEnv({ userId: getLinkedKairoUserId(user) });
      const event = await api.createEvent(parsed.data);

      const proofPayload = premiumProofPromptPayloadForApi(form);
      if (form.proofType !== "NONE" && proofPayload === null && __DEV__) {
        console.warn(
          "[PremiumCreateEvent] Proof prompt fields failed validation; skipping proof prompt create.",
        );
      }

      const stakePayload = premiumStakePayloadForApi(form);
      if (form.stakeType !== "NONE" && stakePayload === null && __DEV__) {
        console.warn(
          "[PremiumCreateEvent] Stake fields failed validation; skipping stake create.",
        );
      }

      const partialFailures: string[] = [];

      if (proofPayload) {
        try {
          await api.createProofPrompt(event.id, proofPayload);
        } catch (e) {
          if (__DEV__) {
            console.warn("[PremiumCreateEvent] Proof prompt API error after event create", e);
          }
          partialFailures.push("proof prompt");
        }
      }

      if (stakePayload) {
        try {
          await api.createStake(event.id, stakePayload);
        } catch (e) {
          if (__DEV__) {
            console.warn("[PremiumCreateEvent] Stake API error after event create", e);
          }
          partialFailures.push("stake");
        }
      }

      if (__DEV__ && partialFailures.length > 0) {
        console.warn(
          `[PremiumCreateEvent] Event ${event.id} was created, but could not persist: ${partialFailures.join(", ")}. TODO: show a non-blocking banner on event detail.`,
        );
      }

      router.replace(`/(tabs)/events/${event.id}` as Href);
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
  }, [form, router, schedule.endsAt, schedule.startsAt, submitting, user]);

  const handleBack = useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      router.replace("/(tabs)/(home)/dashboard");
    }
  }, [navigation, router]);

  const coverUri = form.coverImageUrl;

  return (
    <CreateEventColorsProvider value={c}>
    <View style={styles.root}>
      <LinearGradient
        colors={[c.background, c.deepBackground]}
        locations={[0, 0.55]}
        style={StyleSheet.absoluteFill}
      />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={insets.top}
      >
        <View style={styles.body}>
          <ScrollView
            style={styles.scrollFlex}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={[
              styles.scrollContent,
              {
                paddingBottom: bottomPad,
                paddingTop: scrollPadTop,
                width: windowWidth,
              },
            ]}
            showsVerticalScrollIndicator={false}
          >
          <View
            style={[styles.coverWrap, { width: windowWidth }]}
            accessibilityLabel="Event cover"
          >
            {coverUri ? (
              <Image
                source={{ uri: coverUri }}
                style={styles.coverImg}
                contentFit="cover"
                contentPosition="center"
              />
            ) : (
              <LinearGradient
                colors={[...c.coverGradient]}
                start={{ x: 0.1, y: 0 }}
                end={{ x: 0.9, y: 1 }}
                style={styles.coverImg}
              />
            )}
            <Pressable
              style={styles.coverFab}
              onPress={() => void handlePickCoverImage()}
              disabled={coverBusy}
              accessibilityRole="button"
              accessibilityLabel="Add cover image"
            >
              {coverBusy ? (
                <ActivityIndicator color={c.textPrimary} size="small" />
              ) : (
                <Ionicons name="image-outline" size={20} color={c.textPrimary} />
              )}
            </Pressable>
          </View>

          <View style={styles.scrollForm}>
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
              ui={styles}
              startLabel={formatPremiumStartLabel(schedule.startsAt)}
              endLabel={formatPremiumEndLabel(schedule.endsAt)}
              onPressStart={() => openScheduleEditor("start")}
              onPressEnd={() => openScheduleEditor("end")}
              startError={errors.start}
              showStartError={showErr("start")}
            />
          </View>

          <View style={styles.block}>
            <IconPillRow ui={styles} icon="location-outline">
              <TextInput
                value={form.locationName}
                onChangeText={(t) => patchForm("locationName", t)}
                placeholder="Choose Location"
                placeholderTextColor={c.textMuted}
                style={styles.inlineInput}
              />
            </IconPillRow>
            {showErr("location") ? <Text style={styles.fieldError}>{errors.location}</Text> : null}
          </View>

          <View style={styles.block}>
            <CreateEventSection title="Address (optional)">
              <View style={styles.groupPanel}>
                <TextInput
                  value={form.address}
                  onChangeText={(t) => patchForm("address", t)}
                  placeholder="Street address"
                  placeholderTextColor={c.textMuted}
                  style={styles.inlineInput}
                />
                <View style={styles.divider} />
                <TextInput
                  value={form.city}
                  onChangeText={(t) => patchForm("city", t)}
                  placeholder="City"
                  placeholderTextColor={c.textMuted}
                  style={styles.inlineInput}
                />
                <View style={styles.divider} />
                <TextInput
                  value={form.state}
                  onChangeText={(t) => patchForm("state", t)}
                  placeholder="State / region"
                  placeholderTextColor={c.textMuted}
                  style={styles.inlineInput}
                />
                <View style={styles.divider} />
                <TextInput
                  value={form.country}
                  onChangeText={(t) => patchForm("country", t)}
                  placeholder="Country"
                  placeholderTextColor={c.textMuted}
                  style={styles.inlineInput}
                />
              </View>
              <Text style={[styles.mutedNote, { marginTop: 8 }]}>
                Shown on the event page. Map search can be added later.
              </Text>
            </CreateEventSection>
          </View>

          <View style={styles.block}>
            <IconPillRow ui={styles} icon="document-text-outline" multilineInput>
              <TextInput
                value={form.description}
                onChangeText={(t) => patchForm("description", t)}
                placeholder="Add Description"
                placeholderTextColor={c.textMuted}
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
              <Text style={[styles.mutedNote, { marginTop: 10 }]}>
                {resultVerificationFormatHint(form.format)}
              </Text>
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
            <CreateEventSection
              title="Proof"
              helperText="Proof should be captured in Kairo with a photo or video. Camera capture is coming next."
            >
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
              <Text style={styles.mutedNote}>
                Suggested prompts use local templates from your event title, description, and format — no
                network calls.
              </Text>
              {form.proofType !== "NONE" ? (
                <>
                  <View style={styles.promptActions}>
                    <Pressable
                      style={styles.secondaryBtn}
                      onPress={handleGenerateProofPrompt}
                      accessibilityRole="button"
                      accessibilityLabel="Generate proof prompt"
                    >
                      <Text style={styles.secondaryBtnText}>Generate prompt</Text>
                    </Pressable>
                    <Pressable
                      style={styles.secondaryBtn}
                      onPress={handleRegenerateProofPrompt}
                      accessibilityRole="button"
                      accessibilityLabel="Regenerate proof prompt"
                    >
                      <Text style={styles.secondaryBtnText}>Regenerate</Text>
                    </Pressable>
                  </View>
                  <CreateEventPillInput
                    value={form.proofPrompt}
                    onChangeText={(t) => patchForm("proofPrompt", t)}
                    placeholder="Proof prompt title shown to participants"
                    accessibilityLabel="Proof prompt"
                  />
                </>
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
                ui={styles}
                requireApproval={form.requireApproval}
                onRequireApproval={(v) => patchForm("requireApproval", v)}
                priceLabel={form.priceLabel}
                onPricePress={() => {
                  setPriceDraft(form.priceLabel);
                  setPriceModalVisible(true);
                }}
              />
            </CreateEventSection>
          </View>

          {apiError ? <Text style={styles.apiErrorBanner}>{apiError}</Text> : null}

          <Pressable
            style={[styles.primaryBtn, submitting && { opacity: 0.55 }]}
            onPress={() => void runSubmit()}
            accessibilityRole="button"
            accessibilityLabel="Create event"
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color={c.black} />
            ) : (
              <Text style={styles.primaryBtnText}>Create Event</Text>
            )}
          </Pressable>
          </View>
        </ScrollView>

          <View
            pointerEvents="box-none"
            style={[
              styles.headerOverlay,
              {
                paddingTop: insets.top + 8,
                paddingBottom: 0,
              },
            ]}
          >
            <BlurView
              pointerEvents="none"
              tint={colorScheme === "dark" ? "dark" : "extraLight"}
              intensity={colorScheme === "dark" ? 28 : 38}
              style={StyleSheet.absoluteFill}
              {...androidHeaderBlur}
            />
            <View style={styles.headerRow}>
              <Pressable
                onPress={handleBack}
                hitSlop={12}
                style={styles.headerSide}
                accessibilityRole="button"
                accessibilityLabel="Go back"
              >
                <Ionicons name="chevron-back" size={28} color={c.textPrimary} />
              </Pressable>
              <Text style={styles.headerTitle}>Create Event</Text>
              <Pressable
                onPress={() => void runSubmit()}
                hitSlop={12}
                style={styles.checkBtn}
                accessibilityRole="button"
                accessibilityLabel="Save event"
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color={c.black} />
                ) : (
                  <Ionicons name="checkmark" size={22} color={c.black} />
                )}
              </Pressable>
            </View>
          </View>
        </View>

        {androidSchedulePicker ? (
          <DateTimePicker
            value={
              androidSchedulePicker === "start" ? schedule.startsAt : schedule.endsAt
            }
            mode="datetime"
            display="default"
            onChange={(ev, d) => {
              const mode = androidSchedulePicker;
              setAndroidSchedulePicker(null);
              if (ev.type !== "set" || !d) return;
              if (mode === "start") {
                setSchedule((prev) => {
                  const nextStart = d;
                  let nextEnd = prev.endsAt;
                  if (nextEnd < nextStart) {
                    nextEnd = new Date(nextStart.getTime() + 60 * 60 * 1000);
                  }
                  return { startsAt: nextStart, endsAt: nextEnd };
                });
              } else {
                setSchedule((prev) => ({ ...prev, endsAt: d }));
              }
            }}
          />
        ) : null}

        <Modal
          visible={iosScheduleModal !== null}
          transparent
          animationType="slide"
          onRequestClose={() => setIosScheduleModal(null)}
        >
          <View style={{ flex: 1 }}>
            <BlurView
              intensity={55}
              tint={colorScheme === "dark" ? "dark" : "light"}
              style={StyleSheet.absoluteFillObject}
              {...(Platform.OS === "android"
                ? { experimentalBlurMethod: "dimezisBlurView" as const }
                : {})}
            />
            <Pressable
              style={[
                StyleSheet.absoluteFillObject,
                {
                  justifyContent: "flex-end",
                  backgroundColor:
                    colorScheme === "dark" ? "rgba(0,0,0,0.22)" : "rgba(15,23,42,0.18)",
                },
              ]}
              onPress={() => setIosScheduleModal(null)}
            >
              <Pressable
                onPress={(e) => e.stopPropagation()}
                style={{
                  backgroundColor: modalChrome.sheet,
                  paddingTop: 16,
                  paddingBottom: Math.max(insets.bottom, 20),
                  paddingHorizontal: 20,
                  borderTopLeftRadius: 16,
                  borderTopRightRadius: 16,
                  borderTopWidth: StyleSheet.hairlineWidth,
                  borderColor: modalChrome.border,
                }}
              >
                <Text
                  style={{
                    color: modalChrome.text,
                    fontSize: 17,
                    fontWeight: "700",
                    marginBottom: 8,
                    textAlign: "center",
                  }}
                >
                  {iosScheduleModal === "start" ? "Start date & time" : "End date & time"}
                </Text>
                <View
                  style={{
                    backgroundColor: modalChrome.sheet,
                    borderRadius: 12,
                    overflow: "hidden",
                    marginBottom: 12,
                  }}
                >
                  <DateTimePicker
                    value={scheduleDraft}
                    mode="datetime"
                    display="spinner"
                    themeVariant={colorScheme === "dark" ? "dark" : "light"}
                    onChange={(_, d) => {
                      if (d) setScheduleDraft(d);
                    }}
                  />
                </View>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginTop: 4,
                  }}
                >
                  <Pressable onPress={() => setIosScheduleModal(null)} hitSlop={12}>
                    <Text style={{ color: modalChrome.muted, fontSize: 17, fontWeight: "600" }}>
                      Cancel
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      const mode = iosScheduleModal;
                      if (!mode) return;
                      if (mode === "start") {
                        setSchedule((prev) => {
                          const nextStart = scheduleDraft;
                          let nextEnd = prev.endsAt;
                          if (nextEnd < nextStart) {
                            nextEnd = new Date(nextStart.getTime() + 60 * 60 * 1000);
                          }
                          return { startsAt: nextStart, endsAt: nextEnd };
                        });
                      } else {
                        setSchedule((prev) => ({ ...prev, endsAt: scheduleDraft }));
                      }
                      setIosScheduleModal(null);
                    }}
                    hitSlop={12}
                  >
                    <Text style={{ color: modalChrome.text, fontSize: 17, fontWeight: "700" }}>
                      Save
                    </Text>
                  </Pressable>
                </View>
              </Pressable>
            </Pressable>
          </View>
        </Modal>

        <Modal
          visible={priceModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setPriceModalVisible(false)}
        >
          <Pressable
            style={{
              flex: 1,
              justifyContent: "center",
              padding: 24,
              backgroundColor: modalChrome.backdrop,
            }}
            onPress={() => setPriceModalVisible(false)}
          >
            <Pressable
              onPress={(e) => e.stopPropagation()}
              style={{
                backgroundColor: modalChrome.sheet,
                borderRadius: 16,
                padding: 20,
                borderWidth: 1,
                borderColor: modalChrome.border,
                maxWidth: 400,
                alignSelf: "center",
                width: "100%",
              }}
            >
              <Text style={{ color: modalChrome.text, fontSize: 18, fontWeight: "700", marginBottom: 8 }}>
                Entry fee
              </Text>
              <Text style={{ color: modalChrome.muted, fontSize: 14, lineHeight: 20, marginBottom: 14 }}>
                USD amount shown on the event (no charge in the app). Examples: Free, 10, 25.50.
              </Text>
              <TextInput
                value={priceDraft}
                onChangeText={setPriceDraft}
                placeholder="Free or 15"
                placeholderTextColor={modalChrome.muted}
                keyboardType="decimal-pad"
                style={{
                  backgroundColor: modalChrome.inputBg,
                  color: modalChrome.text,
                  borderRadius: 12,
                  paddingHorizontal: 14,
                  paddingVertical: 14,
                  fontSize: 17,
                  fontWeight: "500",
                }}
              />
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 14 }}>
                {(["Free", "5", "10", "25"] as const).map((preset) => (
                  <Pressable
                    key={preset}
                    onPress={() => setPriceDraft(preset === "Free" ? "Free" : `$${preset}`)}
                    style={{
                      paddingHorizontal: 14,
                      paddingVertical: 10,
                      borderRadius: 999,
                      backgroundColor: modalChrome.chipBg,
                    }}
                  >
                    <Text style={{ color: modalChrome.text, fontWeight: "600" }}>
                      {preset === "Free" ? "Free" : `$${preset}`}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: 20, marginTop: 22 }}>
                <Pressable onPress={() => setPriceModalVisible(false)} hitSlop={12}>
                  <Text style={{ color: modalChrome.muted, fontWeight: "600", fontSize: 16 }}>Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    const t = priceDraft.trim() || "Free";
                    patchForm("priceLabel", t);
                    setPriceModalVisible(false);
                  }}
                  hitSlop={12}
                >
                  <Text style={{ color: modalChrome.text, fontWeight: "700", fontSize: 16 }}>Save</Text>
                </Pressable>
              </View>
            </Pressable>
          </Pressable>
        </Modal>
      </KeyboardAvoidingView>
    </View>
    </CreateEventColorsProvider>
  );
}
