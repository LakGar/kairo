import { useMemo } from "react";
import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { useUser } from "@clerk/expo";
import { BlurView } from "expo-blur";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import {
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useMyEvents } from "@/src/features/events/use-my-events";
import { parseKairoProfile } from "@/src/features/profile/kairo-profile-metadata";
import type { KairoSocialLinks } from "@/src/features/profile/kairo-profile-metadata";
import { socialLinkUrl } from "@/src/features/profile/social-links";
import {
  type SettingsChrome,
  useSettingsChrome,
} from "@/src/settings/settings-chrome";

const androidBlur =
  Platform.OS === "android"
    ? { experimentalBlurMethod: "dimezisBlurView" as const }
    : {};

type Ion = ComponentProps<typeof Ionicons>["name"];

const SOCIAL_ICONS: Partial<Record<keyof KairoSocialLinks, Ion>> = {
  instagram: "logo-instagram",
  x: "logo-twitter",
  youtube: "logo-youtube",
  snapchat: "logo-snapchat",
  tiktok: "logo-tiktok",
  linkedin: "logo-linkedin",
  website: "globe-outline",
};

const AVATAR = 96;

function createProfileStyles(c: SettingsChrome) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: c.screen,
    },
    scroll: {
      paddingHorizontal: 20,
    },
    hero: {
      alignItems: "center",
      paddingTop: 8,
      paddingBottom: 8,
    },
    avatar: {
      width: AVATAR,
      height: AVATAR,
      borderRadius: AVATAR / 2,
      borderWidth: 1,
      borderColor: c.line,
    },
    avatarFallback: {
      width: AVATAR,
      height: AVATAR,
      borderRadius: AVATAR / 2,
      borderWidth: 1,
      borderColor: c.line,
      backgroundColor: c.inputFill,
      alignItems: "center",
      justifyContent: "center",
    },
    displayName: {
      marginTop: 16,
      fontSize: 22,
      fontWeight: "700",
      color: c.label,
      letterSpacing: -0.3,
      textAlign: "center",
    },
    handle: {
      marginTop: 4,
      fontSize: 15,
      fontWeight: "400",
      color: c.muted,
      letterSpacing: 0.2,
    },
    statsRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      marginTop: 22,
      paddingVertical: 16,
      paddingHorizontal: 12,
      width: "100%",
      maxWidth: 340,
      borderRadius: 14,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.line,
      backgroundColor: c.sheetSurface,
    },
    statCell: {
      flex: 1,
      alignItems: "center",
      minWidth: 0,
      paddingHorizontal: 4,
    },
    statDivider: {
      width: StyleSheet.hairlineWidth,
      alignSelf: "stretch",
      backgroundColor: c.line,
    },
    statValue: {
      fontSize: 18,
      fontWeight: "700",
      color: c.label,
      letterSpacing: -0.4,
    },
    statLabel: {
      marginTop: 4,
      fontSize: 12,
      fontWeight: "600",
      color: c.muted,
      letterSpacing: 0.4,
      textTransform: "uppercase",
    },
    bioBlock: {
      marginTop: 20,
      width: "100%",
      maxWidth: 360,
      paddingHorizontal: 4,
    },
    bioText: {
      fontSize: 15,
      lineHeight: 22,
      color: c.label,
      textAlign: "center",
    },
    bioPlaceholder: {
      color: c.chevron,
      fontStyle: "italic",
    },
    sectionEyebrow: {
      alignSelf: "flex-start",
      marginTop: 28,
      marginBottom: 10,
      marginLeft: 2,
      fontSize: 12,
      fontWeight: "600",
      color: c.muted,
      letterSpacing: 0.8,
      textTransform: "uppercase",
    },
    socialRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "center",
      gap: 10,
      marginBottom: 8,
    },
    socialChip: {
      width: 48,
      height: 48,
      borderRadius: 24,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.line,
      backgroundColor: c.sheetSurface,
      alignItems: "center",
      justifyContent: "center",
    },
    card: {
      borderRadius: 12,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.line,
      backgroundColor: c.sheetSurface,
      overflow: "hidden",
    },
    infoRow: {
      paddingVertical: 14,
      paddingHorizontal: 16,
    },
    infoRowBorder: {
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.line,
    },
    infoLabel: {
      fontSize: 13,
      fontWeight: "500",
      color: c.muted,
      marginBottom: 6,
    },
    infoValue: {
      fontSize: 16,
      fontWeight: "500",
      color: c.label,
      letterSpacing: -0.2,
    },
    footerHint: {
      marginTop: 20,
      marginHorizontal: 4,
      fontSize: 13,
      lineHeight: 18,
      color: c.chevron,
      textAlign: "center",
    },
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
    backBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: c.headerBackBtnBg,
      alignItems: "center",
      justifyContent: "center",
    },
    headerIconBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: c.headerBackBtnBg,
      alignItems: "center",
      justifyContent: "center",
    },
    headerTitleWrap: {
      flex: 1,
      alignItems: "center",
    },
    headerTitle: {
      color: c.label,
      fontSize: 17,
      fontWeight: "700",
    },
  });
}

type ProfileStyles = ReturnType<typeof createProfileStyles>;

function InfoRow({
  label,
  value,
  isLast,
  styles,
}: {
  label: string;
  value: string;
  isLast?: boolean;
  styles: ProfileStyles;
}) {
  return (
    <View style={[styles.infoRow, !isLast && styles.infoRowBorder]}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue} selectable>
        {value}
      </Text>
    </View>
  );
}

function formatUsd(cents: number) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(cents / 100);
}

/** Public-style profile: stats, bio, socials, and account details. */
export default function SettingsProfileViewScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useUser();
  const { attending, loading: eventsLoading } = useMyEvents();
  const chrome = useSettingsChrome();
  const styles = useMemo(() => createProfileStyles(chrome), [chrome]);

  const kairo = useMemo(
    () => parseKairoProfile(user?.unsafeMetadata),
    [user?.unsafeMetadata],
  );

  const displayName =
    user?.fullName?.trim() ||
    [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim() ||
    user?.username?.trim() ||
    "Your name";

  const handle = user?.username?.trim()
    ? `@${user.username.trim()}`
    : user?.primaryEmailAddress?.emailAddress
      ? `@${user.primaryEmailAddress.emailAddress.split("@")[0]}`
      : "@you";

  const gamesJoined = eventsLoading ? "—" : String(attending.length);
  const wins = kairo.stats?.wins ?? 0;
  const netCents = kairo.stats?.netEarningsCents ?? 0;
  const netLabel = formatUsd(netCents);

  const email =
    user?.primaryEmailAddress?.emailAddress ?? "Not available";
  const phone =
    user?.phoneNumbers?.[0]?.phoneNumber?.trim() ?? "Not added";

  const joined =
    user?.createdAt != null
      ? new Intl.DateTimeFormat(undefined, {
          month: "long",
          year: "numeric",
        }).format(new Date(user.createdAt))
      : "—";

  const uri = user?.imageUrl;
  const headerPad = insets.top + 52;
  const bottomPad = Math.max(insets.bottom, 16) + 32;

  const bioText = kairo.bio?.trim();

  return (
    <View style={styles.root}>
      <ScrollView
        contentInsetAdjustmentBehavior="never"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: headerPad, paddingBottom: bottomPad },
        ]}
      >
        <View style={styles.hero}>
          {uri ? (
            <Image
              source={{ uri }}
              style={styles.avatar}
              contentFit="cover"
              transition={160}
            />
          ) : (
            <View style={styles.avatarFallback}>
              <Ionicons name="person" size={44} color={chrome.muted} />
            </View>
          )}
          <Text style={styles.displayName}>{displayName}</Text>
          <Text style={styles.handle}>{handle}</Text>

          <View style={styles.statsRow}>
            <View style={styles.statCell}>
              <Text style={styles.statValue}>{gamesJoined}</Text>
              <Text style={styles.statLabel}>Games</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCell}>
              <Text style={styles.statValue}>{wins}</Text>
              <Text style={styles.statLabel}>Wins</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCell}>
              <Text style={styles.statValue} numberOfLines={1}>
                {netLabel}
              </Text>
              <Text style={styles.statLabel}>Net</Text>
            </View>
          </View>

          <View style={styles.bioBlock}>
            <Text
              style={[styles.bioText, !bioText && styles.bioPlaceholder]}
              numberOfLines={6}
            >
              {bioText || "No bio yet."}
            </Text>
          </View>

          {(Object.keys(SOCIAL_ICONS) as (keyof KairoSocialLinks)[]).some(
            (k) => socialLinkUrl(k, kairo.social?.[k]),
          ) ? (
            <>
              <Text style={styles.sectionEyebrow}>Links</Text>
              <View style={styles.socialRow}>
                {(Object.keys(SOCIAL_ICONS) as (keyof KairoSocialLinks)[]).map(
                  (key) => {
                    const href = socialLinkUrl(key, kairo.social?.[key]);
                    const icon = SOCIAL_ICONS[key];
                    if (!href || !icon) return null;
                    return (
                      <Pressable
                        key={key}
                        onPress={() => void Linking.openURL(href)}
                        style={({ pressed }) => [
                          styles.socialChip,
                          pressed && { opacity: 0.75 },
                        ]}
                        accessibilityRole="link"
                        accessibilityLabel={`Open ${key}`}
                      >
                        <Ionicons name={icon} size={22} color={chrome.label} />
                      </Pressable>
                    );
                  },
                )}
              </View>
            </>
          ) : null}
        </View>

        <Text style={styles.sectionEyebrow}>Account information</Text>
        <View style={styles.card}>
          <InfoRow label="Email" value={email} styles={styles} />
          <InfoRow label="Phone" value={phone} styles={styles} />
          <InfoRow label="Member since" value={joined} isLast styles={styles} />
        </View>

        <Text style={styles.footerHint}>
          Edit your photo, name, bio, links, and public stats from Edit profile. Your Kairo
          display name, handle, and bio for events live under Settings → Kairo profile.
        </Text>
      </ScrollView>

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
            style={({ pressed }) => [
              styles.backBtn,
              pressed && { opacity: 0.7 },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons name="chevron-back" size={22} color={chrome.headerIcon} />
          </Pressable>
          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              Profile
            </Text>
          </View>
          <Pressable
            onPress={() => router.push("/(tabs)/settings/edit-profile")}
            style={({ pressed }) => [
              styles.headerIconBtn,
              pressed && { opacity: 0.75 },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Edit profile"
          >
            <Ionicons name="create-outline" size={22} color={chrome.headerIcon} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}
