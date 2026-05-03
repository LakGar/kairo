import { useAuth, useClerk, useUser } from "@clerk/expo";
import { type Href, useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useThemeColor } from "@/hooks/use-theme-color";
import { getApiBaseUrl, getDevUserId } from "@/src/api";

function Row({ label, value }: { label: string; value: string }) {
  const borderColor = useThemeColor({ light: "#C6C6C8", dark: "#3A3A3C" }, "icon");
  return (
    <View style={[styles.row, { borderBottomColor: borderColor }]}>
      <ThemedText type="small">{label}</ThemedText>
      <ThemedText type="default" style={styles.rowValue} numberOfLines={3}>
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
  const colorScheme = useColorScheme() ?? "light";
  const theme = Colors[colorScheme];
  const tint = useThemeColor({}, "tint");
  const surface = useThemeColor({ light: "#F2F2F7", dark: "#2C2C2E" }, "background");

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
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <ThemedView style={[styles.avatarBlock, { backgroundColor: surface }]}>
          <ThemedText type="title">{name}</ThemedText>
          <ThemedText type="muted" style={styles.gap}>
            {email}
          </ThemedText>
          {isSignedIn ? (
            <ThemedText type="small" style={styles.mono}>
              Signed in with Clerk
            </ThemedText>
          ) : null}
        </ThemedView>

        <ThemedText type="subtitle" style={styles.section}>
          {"App & API (dev)"}
        </ThemedText>
        <ThemedView style={styles.card}>
          <Row label="API base URL" value={apiUrl || "Not configured"} />
          <Row label="Kairo dev user id" value={devHint} />
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
          style={[styles.linkBtn, { borderColor: theme.tint }]}
          onPress={() => router.push("/(tabs)/dashboard")}
        >
          <ThemedText style={{ color: tint, fontWeight: "600" }}>Home dashboard</ThemedText>
        </Pressable>
        <Pressable
          style={[styles.linkBtn, { borderColor: theme.tint }]}
          onPress={() => router.push("/(tabs)/index" as Href)}
        >
          <ThemedText style={{ color: tint, fontWeight: "600" }}>Discover events</ThemedText>
        </Pressable>

        <Pressable
          style={[styles.signOut, { backgroundColor: "#C62828" }]}
          onPress={() => void signOut()}
        >
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
    borderRadius: 14,
    padding: 20,
    marginTop: 8,
    gap: 4,
  },
  gap: {
    marginTop: 4,
  },
  mono: {
    fontFamily: "monospace",
    marginTop: 8,
    opacity: 0.8,
  },
  section: {
    marginTop: 24,
    marginBottom: 8,
  },
  card: {
    borderRadius: 12,
    overflow: "hidden",
  },
  row: {
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 4,
  },
  rowValue: {
    fontWeight: "500",
  },
  note: {
    marginTop: 12,
    lineHeight: 20,
  },
  linkBtn: {
    marginTop: 10,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: "center",
  },
  signOut: {
    marginTop: 28,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  signOutLabel: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
});
