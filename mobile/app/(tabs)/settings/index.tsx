import type { ComponentProps, ReactNode } from "react";
import { useMemo } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useAuth, useClerk, useUser } from "@clerk/expo";
import Constants from "expo-constants";
import { BlurView } from "expo-blur";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
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

import { getApiBaseUrl, getLinkedKairoUserId } from "@/src/api";
import {
  type SettingsChrome,
  useSettingsChrome,
} from "@/src/settings/settings-chrome";

type Ion = ComponentProps<typeof Ionicons>["name"];

const androidBlur =
  Platform.OS === "android"
    ? { experimentalBlurMethod: "dimezisBlurView" as const }
    : {};

function createSettingsHomeStyles(c: SettingsChrome) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: c.screen,
    },
    scroll: {
      paddingHorizontal: 16,
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
    headerTitleWrap: {
      flex: 1,
      alignItems: "center",
    },
    headerTitle: {
      color: c.label,
      fontSize: 17,
      fontWeight: "700",
    },
    headerRightSpacer: {
      width: 40,
    },
    sectionLabel: {
      marginTop: 22,
      marginBottom: 8,
      marginLeft: 4,
      fontSize: 13,
      fontWeight: "600",
      color: c.muted,
      textTransform: "uppercase",
      letterSpacing: 0.6,
    },
    group: {
      backgroundColor: c.card,
      borderRadius: 14,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.cardBorder,
      overflow: "hidden",
      marginBottom: 4,
    },
    profileTop: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 14,
      paddingHorizontal: 14,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.cardBorder,
      gap: 12,
    },
    profileAvatar: {
      width: 52,
      height: 52,
      borderRadius: 26,
    },
    profileAvatarFallback: {
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor: c.profileAvatarFallback,
      alignItems: "center",
      justifyContent: "center",
    },
    profileText: {
      flex: 1,
      minWidth: 0,
    },
    profileName: {
      color: c.label,
      fontSize: 17,
      fontWeight: "700",
    },
    profileSub: {
      marginTop: 2,
      color: c.muted,
      fontSize: 14,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 14,
      paddingHorizontal: 14,
      gap: 12,
    },
    rowDivider: {
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.cardBorder,
    },
    rowText: {
      flex: 1,
      minWidth: 0,
    },
    rowTitle: {
      color: c.label,
      fontSize: 16,
      fontWeight: "500",
    },
    rowSubtitle: {
      marginTop: 4,
      color: c.muted,
      fontSize: 13,
    },
    iconTile: {
      width: 32,
      height: 32,
      borderRadius: 8,
      alignItems: "center",
      justifyContent: "center",
    },
    signOut: {
      marginTop: 28,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      paddingVertical: 16,
    },
    signOutText: {
      color: c.destructive,
      fontSize: 17,
      fontWeight: "600",
    },
  });
}

type SettingsHomeStyles = ReturnType<typeof createSettingsHomeStyles>;

function IconTile({
  name,
  bg,
  styles,
}: {
  name: Ion;
  bg: string;
  styles: SettingsHomeStyles;
}) {
  return (
    <View style={[styles.iconTile, { backgroundColor: bg }]}>
      <Ionicons name={name} size={18} color="#fff" />
    </View>
  );
}

function SettingsRow({
  leading,
  title,
  subtitle,
  onPress,
  trailing = "chevron",
  showDivider,
  styles,
  chevronColor,
}: {
  leading: ReactNode;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  trailing?: "chevron" | "external";
  showDivider?: boolean;
  styles: SettingsHomeStyles;
  chevronColor: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        showDivider && styles.rowDivider,
        pressed && { opacity: 0.75 },
      ]}
    >
      {leading}
      <View style={styles.rowText}>
        <Text style={styles.rowTitle}>{title}</Text>
        {subtitle ? (
          <Text style={styles.rowSubtitle} numberOfLines={4}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      <Ionicons
        name={trailing === "external" ? "open-outline" : "chevron-forward"}
        size={18}
        color={chevronColor}
      />
    </Pressable>
  );
}

/** Full-screen settings — only reachable from the tab header avatar (stack route, not a tab). */
export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useUser();
  const { isSignedIn } = useAuth();
  const { signOut } = useClerk();
  const chrome = useSettingsChrome();
  const styles = useMemo(() => createSettingsHomeStyles(chrome), [chrome]);

  const name =
    user?.fullName?.trim() ||
    user?.username?.trim() ||
    user?.firstName?.trim() ||
    "You";
  const uri = user?.imageUrl;
  const apiUrl = getApiBaseUrl();
  const linkedKairoId = getLinkedKairoUserId(user);
  const linkedHint = linkedKairoId
    ? `${linkedKairoId.slice(0, 6)}…${linkedKairoId.slice(-4)}`
    : "Not linked (set Clerk metadata kairoUserId)";

  const headerPad = insets.top + 52;
  const bottomPad = Math.max(insets.bottom, 16) + 28;

  const open = (url: string) => {
    void Linking.openURL(url);
  };

  const openAppStoreListing = () => {
    const androidPkg =
      Constants.expoConfig?.android?.package ?? "com.anonymous.mobile";
    if (Platform.OS === "android") {
      void Linking.openURL(
        `https://play.google.com/store/apps/details?id=${encodeURIComponent(androidPkg)}`,
      );
      return;
    }
    void Linking.openURL("https://apps.apple.com/");
  };

  const rowProps = { styles, chevronColor: chrome.chevron };

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
        <View style={[styles.group, { marginBottom: 20, marginTop: 20 }]}>
          <Pressable
            style={styles.profileTop}
            onPress={() => router.push("/(tabs)/settings/profile")}
          >
            {uri ? (
              <Image
                source={{ uri }}
                style={styles.profileAvatar}
                contentFit="cover"
              />
            ) : (
              <View style={styles.profileAvatarFallback}>
                <Ionicons name="person" size={32} color={chrome.muted} />
              </View>
            )}
            <View style={styles.profileText}>
              <Text style={styles.profileName}>{name}</Text>
              <Text style={styles.profileSub}>View Profile</Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={18}
              color={chrome.chevron}
            />
          </Pressable>
          <SettingsRow
            leading={<IconTile name="create-outline" bg="#636366" styles={styles} />}
            title="Edit Profile"
            onPress={() => router.push("/(tabs)/settings/edit-profile")}
            showDivider
            {...rowProps}
          />
          <SettingsRow
            leading={<IconTile name="person-circle-outline" bg="#0A84FF" styles={styles} />}
            title="Kairo profile"
            subtitle="Name, username, bio, and saved preferences"
            onPress={() => router.push("/(tabs)/settings/kairo-profile")}
            showDivider={false}
            {...rowProps}
          />
        </View>

        <View style={styles.group}>
          <SettingsRow
            leading={<IconTile name="settings-outline" bg="#8E8E93" styles={styles} />}
            title="Account Settings"
            onPress={() => router.push("/(tabs)/settings/account")}
            showDivider
            {...rowProps}
          />
          <SettingsRow
            leading={<IconTile name="card-outline" bg="#7C3AED" styles={styles} />}
            title="Payment"
            onPress={() => router.push("/(tabs)/settings/payments")}
            {...rowProps}
          />
        </View>

        <Text style={styles.sectionLabel}>Preferences</Text>
        <View style={styles.group}>
          <SettingsRow
            leading={<IconTile name="notifications-outline" bg="#FF453A" styles={styles} />}
            title="Notifications"
            onPress={() => router.push("/(tabs)/settings/notifications")}
            showDivider
            {...rowProps}
          />
          <SettingsRow
            leading={<IconTile name="shield-checkmark-outline" bg="#32D74B" styles={styles} />}
            title="Permissions"
            onPress={() => router.push("/(tabs)/settings/permissions")}
            showDivider
            {...rowProps}
          />
          <SettingsRow
            leading={<IconTile name="color-palette-outline" bg="#FF375F" styles={styles} />}
            title="Appearance"
            onPress={() => router.push("/(tabs)/settings/appearance")}
            {...rowProps}
          />
        </View>

        <Text style={styles.sectionLabel}>Resources</Text>
        <View style={styles.group}>
          <SettingsRow
            leading={<IconTile name="help-circle-outline" bg="#0A84FF" styles={styles} />}
            title="Contact Support"
            onPress={() => open("mailto:support@getkairo.com")}
            showDivider
            {...rowProps}
          />
          <SettingsRow
            leading={<IconTile name="star-outline" bg="#FFD60A" styles={styles} />}
            title={
              Platform.OS === "android"
                ? "Rate on Play Store"
                : "Rate in App Store"
            }
            onPress={openAppStoreListing}
            trailing="external"
            showDivider
            {...rowProps}
          />
          <SettingsRow
            leading={
              <LinearGradient
                colors={["#F58529", "#DD2A7B", "#8134AF"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.iconTile}
              >
                <Ionicons name="logo-instagram" size={18} color="#fff" />
              </LinearGradient>
            }
            title="Kairo on Instagram"
            onPress={() => open("https://www.instagram.com/")}
            trailing="external"
            showDivider
            {...rowProps}
          />
          <SettingsRow
            leading={
              <View style={[styles.iconTile, { backgroundColor: "#000" }]}>
                <Ionicons name="logo-twitter" size={16} color="#fff" />
              </View>
            }
            title="Kairo on X (Twitter)"
            onPress={() => open("https://x.com/")}
            trailing="external"
            {...rowProps}
          />
        </View>

        <Text style={styles.sectionLabel}>Developer</Text>
        <View style={styles.group}>
          <SettingsRow
            leading={<IconTile name="globe-outline" bg="#48484A" styles={styles} />}
            title="API base URL"
            subtitle={apiUrl || "Not configured"}
            onPress={() => router.push("/(tabs)/settings/developer")}
            showDivider
            {...rowProps}
          />
          <SettingsRow
            leading={<IconTile name="key-outline" bg="#48484A" styles={styles} />}
            title="Linked Kairo user id"
            subtitle={linkedHint}
            onPress={() => router.push("/(tabs)/settings/developer")}
            {...rowProps}
          />
        </View>

        {isSignedIn ? (
          <Pressable
            style={({ pressed }) => [
              styles.signOut,
              pressed && { opacity: 0.88 },
            ]}
            onPress={() => void signOut()}
          >
            <Ionicons name="log-out-outline" size={22} color={chrome.destructive} />
            <Text style={styles.signOutText}>Sign out</Text>
          </Pressable>
        ) : null}
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
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace("/(tabs)/(home)/dashboard");
              }
            }}
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
            <Text style={styles.headerTitle}>Settings</Text>
          </View>
          <View style={styles.headerRightSpacer} />
        </View>
      </View>
    </View>
  );
}
