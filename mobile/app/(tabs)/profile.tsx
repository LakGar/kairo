import type { ComponentProps } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useAuth, useClerk, useUser } from "@clerk/expo";
import { type Href, useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, View, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useThemeColor } from "@/hooks/use-theme-color";
import { useUIPalette } from "@/hooks/use-ui-palette";
import { getApiBaseUrl, getDevUserId } from "@/src/api";

type IoniconName = ComponentProps<typeof Ionicons>["name"];

function Row({
  icon,
  label,
  value,
  borderColor,
}: {
  icon: IoniconName;
  label: string;
  value: string;
  borderColor: string;
}) {
  const muted = useThemeColor({}, "icon");
  return (
    <View style={[styles.row, { borderBottomColor: borderColor }]}>
      <View style={styles.rowLeft}>
        <Ionicons name={icon} size={20} color={muted} />
        <ThemedText type="small" style={styles.rowLabel}>
          {label}
        </ThemedText>
      </View>
      <ThemedText type="default" style={styles.rowValue} numberOfLines={4}>
        {value}
      </ThemedText>
    </View>
  );
}

export default function ProfileScreen() {
  const { user } = useUser();
  const { isSignedIn } = useAuth();
  const { signOut } = useClerk();
  const router = useRouter();
  const ui = useUIPalette();
  const tint = useThemeColor({}, "tint");
  const muted = useThemeColor({}, "icon");

  const email = user?.primaryEmailAddress?.emailAddress ?? "—";
  const name =
    user?.fullName?.trim() ||
    user?.username?.trim() ||
    user?.firstName?.trim() ||
    "—";

  const apiUrl = getApiBaseUrl();
  const devId = getDevUserId();
  const devHint = devId
    ? `${devId.slice(0, 6)}…${devId.slice(-4)}`
    : "Not set (mutations will fail until set)";

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: ui.groupedBackground }]} edges={["bottom"]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <ThemedView
          style={[
            styles.avatarBlock,
            {
              backgroundColor: ui.card,
              borderColor: ui.cardBorder,
            },
            Platform.select({
              ios: {
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.06,
                shadowRadius: 10,
              },
              android: { elevation: 2 },
              default: {},
            }),
          ]}
        >
          <View style={[styles.avatarRing, { borderColor: `${tint}55` }]}>
            <Ionicons name="person" size={36} color={tint} />
          </View>
          <ThemedText type="title" style={styles.name}>
            {name}
          </ThemedText>
          <ThemedText type="muted" style={styles.email}>
            {email}
          </ThemedText>
          {isSignedIn ? (
            <View style={[styles.badge, { backgroundColor: `${tint}18` }]}>
              <Ionicons name="shield-checkmark" size={14} color={tint} />
              <ThemedText type="small" style={[styles.badgeText, { color: tint }]}>
                Clerk session
              </ThemedText>
            </View>
          ) : null}
        </ThemedView>

        <ThemedText type="subtitle" style={styles.section}>
          {"App & API (dev)"}
        </ThemedText>
        <ThemedView
          style={[
            styles.card,
            { backgroundColor: ui.card, borderColor: ui.cardBorder },
          ]}
        >
          <Row icon="globe-outline" label="API base URL" value={apiUrl || "Not configured"} borderColor={ui.cardBorder} />
          <Row icon="key-outline" label="Kairo dev user id" value={devHint} borderColor={ui.cardBorder} />
        </ThemedView>
        <ThemedText type="muted" style={styles.note}>
          The website API still uses the{" "}
          <ThemedText type="default">x-kairo-user-id</ThemedText> header until Clerk is wired
          server-side. Keep <ThemedText type="default">EXPO_PUBLIC_KAIRO_DEV_USER_ID</ThemedText>{" "}
          aligned with a real user in your database.
        </ThemedText>

        <ThemedText type="subtitle" style={styles.section}>
          Quick links
        </ThemedText>
        <Pressable
          style={[
            styles.linkBtn,
            { borderColor: tint, backgroundColor: ui.card },
          ]}
          onPress={() => router.push("/(tabs)/dashboard")}
        >
          <Ionicons name="home-outline" size={20} color={tint} />
          <ThemedText style={[styles.linkBtnLabel, { color: tint }]}>Home dashboard</ThemedText>
          <Ionicons name="chevron-forward" size={18} color={muted} style={styles.chevron} />
        </Pressable>
        <Pressable
          style={[
            styles.linkBtn,
            { borderColor: tint, backgroundColor: ui.card },
          ]}
          onPress={() => router.push("/(tabs)/index" as Href)}
        >
          <Ionicons name="compass-outline" size={20} color={tint} />
          <ThemedText style={[styles.linkBtnLabel, { color: tint }]}>Discover events</ThemedText>
          <Ionicons name="chevron-forward" size={18} color={muted} style={styles.chevron} />
        </Pressable>

        <Pressable
          style={[
            styles.signOut,
            { backgroundColor: ui.danger },
            Platform.select({
              ios: {
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.12,
                shadowRadius: 4,
              },
              android: { elevation: 2 },
              default: {},
            }),
          ]}
          onPress={() => void signOut()}
        >
          <Ionicons name="log-out-outline" size={20} color="#fff" />
          <ThemedText style={styles.signOutLabel}>Sign out</ThemedText>
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
    paddingBottom: 32,
    paddingHorizontal: 20,
  },
  avatarBlock: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 22,
    marginTop: 8,
    alignItems: "center",
    gap: 6,
  },
  avatarRing: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  name: {
    textAlign: "center",
  },
  email: {
    textAlign: "center",
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  badgeText: {
    fontWeight: "600",
  },
  section: {
    marginTop: 28,
    marginBottom: 10,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  row: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  rowLabel: {
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  rowValue: {
    fontWeight: "500",
    marginTop: 6,
  },
  note: {
    marginTop: 14,
    lineHeight: 21,
  },
  linkBtn: {
    marginTop: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 2,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  linkBtnLabel: {
    flex: 1,
    fontWeight: "600",
    fontSize: 16,
  },
  chevron: {
    marginLeft: "auto",
  },
  signOut: {
    marginTop: 28,
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
  },
  signOutLabel: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
});
