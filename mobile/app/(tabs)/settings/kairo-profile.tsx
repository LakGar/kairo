import { useCallback, useEffect, useMemo, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useUser } from "@clerk/expo";
import { BlurView } from "expo-blur";
import { useRouter } from "expo-router";
import {
  ActivityIndicator,
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

import type { UpdateMyProfileRequestInput } from "@kairo/shared";

import {
  createKairoApiFromEnv,
  getLinkedKairoUserId,
  KairoApiConfigurationError,
  KairoApiError,
} from "@/src/api";
import {
  type SettingsChrome,
  useSettingsChrome,
} from "@/src/settings/settings-chrome";

import type { ApiMeProfileDto, ApiMeProfilePayload } from "@/src/api";

const androidBlur =
  Platform.OS === "android"
    ? { experimentalBlurMethod: "dimezisBlurView" as const }
    : {};

function formatList(items: string[] | undefined | null): string {
  if (!items?.length) return "—";
  return items.join(", ");
}

function createStyles(c: SettingsChrome) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: c.screen },
    flex: { flex: 1 },
    centered: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
    scroll: { paddingHorizontal: 16 },
    brandRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      marginBottom: 20,
    },
    brandText: {
      fontSize: 28,
      fontWeight: "800",
      letterSpacing: -0.5,
      color: c.label,
      textTransform: "lowercase",
    },
    subBrand: {
      textAlign: "center",
      fontSize: 14,
      color: c.muted,
      marginBottom: 16,
    },
    banner: {
      borderRadius: 12,
      paddingVertical: 12,
      paddingHorizontal: 14,
      marginBottom: 14,
    },
    bannerSuccess: { backgroundColor: "rgba(34,197,94,0.14)" },
    bannerErr: { backgroundColor: c.errorBannerBg },
    bannerText: { fontSize: 14, fontWeight: "500", color: "#86EFAC", textAlign: "center" },
    bannerTextErr: { fontSize: 14, fontWeight: "500", color: c.errorBannerText, textAlign: "center" },
    sectionTitle: {
      marginTop: 8,
      marginBottom: 10,
      marginLeft: 4,
      fontSize: 13,
      fontWeight: "600",
      color: c.muted,
      textTransform: "uppercase",
      letterSpacing: 0.6,
    },
    card: {
      backgroundColor: c.card,
      borderRadius: 14,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.cardBorder,
      overflow: "hidden",
      marginBottom: 18,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 14,
      paddingHorizontal: 16,
      gap: 12,
    },
    rowBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.cardBorder },
    rowLabel: { width: 96, fontSize: 15, fontWeight: "500", color: c.muted },
    rowInput: {
      flex: 1,
      fontSize: 16,
      color: c.label,
      padding: 0,
      minWidth: 0,
    },
    bioInput: {
      minHeight: 100,
      paddingHorizontal: 16,
      paddingVertical: 14,
      fontSize: 16,
      lineHeight: 22,
      color: c.label,
    },
    readRow: { paddingVertical: 12, paddingHorizontal: 16 },
    readRowBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.cardBorder },
    readLabel: { fontSize: 12, fontWeight: "600", color: c.muted, marginBottom: 4 },
    readValue: { fontSize: 15, color: c.label },
    saveBtn: {
      marginTop: 8,
      marginBottom: 24,
      borderRadius: 14,
      paddingVertical: 16,
      alignItems: "center",
      backgroundColor: c.primaryBtnBg,
    },
    saveBtnDisabled: { opacity: 0.45 },
    saveBtnText: { fontSize: 17, fontWeight: "700", color: c.primaryBtnText },
    hint: { fontSize: 13, lineHeight: 18, color: c.hint, marginHorizontal: 4, marginBottom: 12 },
    headerShell: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      zIndex: 10,
      overflow: "hidden",
      minHeight: 48,
    },
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 8,
      paddingBottom: 8,
    },
    headerCircleBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: c.headerBackBtnBg,
      alignItems: "center",
      justifyContent: "center",
    },
    headerTitleWrap: { flex: 1, alignItems: "center" },
    headerTitle: { color: c.label, fontSize: 17, fontWeight: "700" },
    userErr: { fontSize: 15, color: c.errorBannerText, textAlign: "center" },
  });
}

export default function KairoProfileSettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useUser();
  const chrome = useSettingsChrome();
  const styles = useMemo(() => createStyles(chrome), [chrome]);

  const linkedId = getLinkedKairoUserId(user);

  const [loading, setLoading] = useState(true);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [initial, setInitial] = useState<ApiMeProfileDto | null>(null);
  const [payload, setPayload] = useState<ApiMeProfilePayload | null>(null);

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");

  const [saving, setSaving] = useState(false);
  const [usernameErr, setUsernameErr] = useState<string | null>(null);
  const [banner, setBanner] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const load = useCallback(async () => {
    setLoadErr(null);
    setLoading(true);
    setBanner(null);
    try {
      const api = createKairoApiFromEnv({ userId: linkedId ?? undefined });
      const data = await api.getMyProfile();
      setPayload(data);
      const p = data.profile;
      setInitial(p);
      setName(p.name ?? "");
      setUsername(p.username ?? "");
      setBio(p.bio ?? "");
    } catch (e) {
      const msg =
        e instanceof KairoApiConfigurationError
          ? e.message
          : e instanceof KairoApiError
            ? e.message
            : "Could not load profile.";
      setLoadErr(msg);
    } finally {
      setLoading(false);
    }
  }, [linkedId]);

  useEffect(() => {
    void load();
  }, [load]);

  const dirty = useMemo(() => {
    if (!initial) return false;
    const n0 = (initial.name ?? "").trim();
    const u0 = (initial.username ?? "").trim().toLowerCase();
    const b0 = (initial.bio ?? "").trim();
    return (
      name.trim() !== n0 ||
      username.trim().toLowerCase() !== u0 ||
      bio.trim() !== b0
    );
  }, [initial, name, username, bio]);

  const onSave = async () => {
    if (!initial || saving) return;
    setUsernameErr(null);
    setBanner(null);

    const body: UpdateMyProfileRequestInput = {};
    const n0 = (initial.name ?? "").trim();
    const u0 = (initial.username ?? "").trim().toLowerCase();
    const b0 = (initial.bio ?? "").trim();
    const nt = name.trim();
    const ut = username.trim().toLowerCase();
    const bt = bio.trim();

    if (nt !== n0) body.name = nt === "" ? "" : nt;
    if (ut !== u0) {
      if (ut.length > 0 && ut.length < 3) {
        setUsernameErr("Username must be at least 3 characters.");
        return;
      }
      if (ut.length > 0 && !/^[a-z0-9_]+$/.test(ut)) {
        setUsernameErr("Use lowercase letters, numbers, and underscores only.");
        return;
      }
      if (ut.length >= 3) body.username = ut;
      if (ut.length === 0 && u0.length > 0) {
        setUsernameErr("Username cannot be empty. Pick a new handle or keep your current one.");
        return;
      }
    }
    if (bt !== b0) body.bio = bt;

    if (Object.keys(body).length === 0) {
      setBanner({ kind: "ok", text: "Nothing to save." });
      return;
    }

    setSaving(true);
    try {
      const api = createKairoApiFromEnv({ userId: linkedId ?? undefined });
      const next = await api.updateMyProfile(body);
      setPayload(next);
      const p = next.profile;
      setInitial(p);
      setName(p.name ?? "");
      setUsername(p.username ?? "");
      setBio(p.bio ?? "");
      setBanner({ kind: "ok", text: "Profile saved." });
    } catch (e) {
      if (e instanceof KairoApiError && e.code === "USERNAME_CONFLICT") {
        setUsernameErr("That username is already taken.");
        setBanner({ kind: "err", text: e.message });
        return;
      }
      setBanner({
        kind: "err",
        text: e instanceof Error ? e.message : "Save failed.",
      });
    } finally {
      setSaving(false);
    }
  };

  const headerPad = insets.top + 52;
  const bottomPad = Math.max(insets.bottom, 28) + 24;
  const p = payload?.profile;

  if (loading) {
    return (
      <View style={[styles.root, styles.centered]}>
        <ActivityIndicator color={chrome.label} />
      </View>
    );
  }

  if (loadErr) {
    return (
      <View style={[styles.root, styles.centered]}>
        <Text style={styles.userErr}>{loadErr}</Text>
        <Pressable onPress={() => void load()} style={{ marginTop: 16 }}>
          <Text style={{ color: chrome.modalLink, fontWeight: "600" }}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={insets.top}
      >
        <ScrollView
          contentInsetAdjustmentBehavior="never"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[
            styles.scroll,
            { paddingTop: headerPad, paddingBottom: bottomPad },
          ]}
        >
          <View style={styles.brandRow}>
            <Text style={styles.brandText}>kairo</Text>
            <Ionicons name="sparkles" size={18} color={chrome.label} />
          </View>
          <Text style={styles.subBrand}>Your account on Kairo</Text>

          {banner ? (
            <View
              style={[
                styles.banner,
                banner.kind === "ok" ? styles.bannerSuccess : styles.bannerErr,
              ]}
            >
              <Text
                style={banner.kind === "ok" ? styles.bannerText : styles.bannerTextErr}
              >
                {banner.text}
              </Text>
            </View>
          ) : null}

          <Text style={styles.sectionTitle}>Profile</Text>
          <View style={styles.card}>
            <View style={[styles.row, styles.rowBorder]}>
              <Text style={styles.rowLabel}>Name</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Display name"
                placeholderTextColor={chrome.muted}
                style={styles.rowInput}
                autoCapitalize="words"
              />
            </View>
            <View style={[styles.row, styles.rowBorder]}>
              <Text style={styles.rowLabel}>Username</Text>
              <TextInput
                value={username}
                onChangeText={(t) => {
                  setUsername(t.toLowerCase());
                  setUsernameErr(null);
                }}
                placeholder="your_handle"
                placeholderTextColor={chrome.muted}
                style={styles.rowInput}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
            {usernameErr ? (
              <Text
                style={{
                  paddingHorizontal: 16,
                  paddingBottom: 10,
                  fontSize: 13,
                  color: chrome.errorBannerText,
                }}
              >
                {usernameErr}
              </Text>
            ) : null}
            <TextInput
              value={bio}
              onChangeText={setBio}
              placeholder="Bio"
              placeholderTextColor={chrome.muted}
              style={styles.bioInput}
              multiline
              maxLength={2000}
              textAlignVertical="top"
            />
          </View>

          <Text style={styles.sectionTitle}>Onboarding</Text>
          <View style={styles.card}>
            <View style={[styles.readRow, styles.readRowBorder]}>
              <Text style={styles.readLabel}>Completed</Text>
              <Text style={styles.readValue}>
                {p?.onboardingCompleted ? "Yes" : "No"}
                {p?.onboardingCompletedAt
                  ? ` · ${new Date(p.onboardingCompletedAt).toLocaleDateString()}`
                  : ""}
              </Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Saved preferences (read-only)</Text>
          <View style={styles.card}>
            <PrefRow label="Primary goal" value={p?.primaryGoal} styles={styles} />
            <PrefRow label="Activity interests" value={formatList(p?.activityInterests)} styles={styles} />
            <PrefRow label="Participation modes" value={formatList(p?.participationModes)} styles={styles} />
            <PrefRow label="Accountability" value={p?.accountabilityStyle} styles={styles} />
            <PrefRow label="Proof preference" value={p?.proofPreference} styles={styles} />
            <PrefRow label="Notifications" value={p?.notificationPreference} styles={styles} last />
          </View>

          <Text style={styles.hint}>
            Clerk photo and social links stay under Edit profile. This screen updates your Kairo
            server profile only.
          </Text>

          <Pressable
            onPress={() => void onSave()}
            disabled={saving || !dirty}
            style={({ pressed }) => [
              styles.saveBtn,
              (!dirty || saving) && styles.saveBtnDisabled,
              pressed && dirty && !saving && { opacity: 0.9 },
            ]}
          >
            {saving ? (
              <ActivityIndicator color={chrome.primaryBtnText} />
            ) : (
              <Text style={styles.saveBtnText}>Save changes</Text>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>

      <View
        style={[styles.headerShell, { paddingTop: insets.top + 4 }]}
        pointerEvents="box-none"
      >
        <BlurView
          pointerEvents="none"
          tint={chrome.blurTint}
          intensity={22}
          style={StyleSheet.absoluteFill}
          {...androidBlur}
        />
        <View style={styles.headerRow}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [styles.headerCircleBtn, pressed && { opacity: 0.7 }]}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons name="chevron-back" size={22} color={chrome.headerIcon} />
          </Pressable>
          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              Kairo profile
            </Text>
          </View>
          <View style={{ width: 40 }} />
        </View>
      </View>
    </View>
  );
}

function PrefRow({
  label,
  value,
  styles,
  last,
}: {
  label: string;
  value: string | null | undefined;
  styles: ReturnType<typeof createStyles>;
  last?: boolean;
}) {
  const v = value?.trim() ? value : "—";
  return (
    <View style={[styles.readRow, !last && styles.readRowBorder]}>
      <Text style={styles.readLabel}>{label}</Text>
      <Text style={styles.readValue}>{v}</Text>
    </View>
  );
}
