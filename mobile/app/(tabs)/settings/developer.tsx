import { useMemo } from "react";
import { useUser } from "@clerk/expo";
import { Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SettingsStackHeader } from "@/components/settings-stack-header";
import {
  getApiBaseUrl,
  getDevFallbackKairoUserId,
  getLinkedKairoUserId,
  resolveActingUserId,
} from "@/src/api";
import {
  type SettingsChrome,
  useSettingsChrome,
} from "@/src/settings/settings-chrome";

function createDeveloperStyles(c: SettingsChrome) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: c.screen },
    scroll: { paddingHorizontal: 16 },
    lead: {
      fontSize: 14,
      lineHeight: 20,
      color: c.muted,
      marginBottom: 20,
    },
    sectionLabel: {
      marginBottom: 8,
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
      padding: 14,
      marginBottom: 20,
    },
    mono: {
      fontSize: 14,
      lineHeight: 20,
      color: c.label,
      fontFamily: Platform.select({
        ios: "Menlo",
        android: "monospace",
        default: "monospace",
      }),
    },
    footer: {
      marginTop: 8,
      fontSize: 13,
      lineHeight: 19,
      color: c.hint,
    },
    footerEm: {
      color: c.hintEmphasis,
      fontWeight: "600",
    },
  });
}

export default function DeveloperSettingsScreen() {
  const insets = useSafeAreaInsets();
  const headerPad = insets.top + 52;
  const bottomPad = Math.max(insets.bottom, 16) + 32;
  const { user } = useUser();
  const chrome = useSettingsChrome();
  const styles = useMemo(() => createDeveloperStyles(chrome), [chrome]);

  const apiUrl = getApiBaseUrl() || "Not configured";
  const linked = getLinkedKairoUserId(user)?.trim() || "Not set";
  const devFallback = getDevFallbackKairoUserId()?.trim() || "Not set";
  const effectiveApiUser = resolveActingUserId(getLinkedKairoUserId(user))?.trim() || "Not set";
  const clerkId = user?.id?.trim() || "—";

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
        <Text style={styles.lead}>
          API base URL comes from Expo env. Linked Kairo id is read from Clerk{" "}
          <Text style={styles.footerEm}>publicMetadata.kairoUserId</Text> or{" "}
          <Text style={styles.footerEm}>unsafeMetadata.kairoUserId</Text> (Prisma{" "}
          <Text style={styles.footerEm}>User.id</Text>) and sent as{" "}
          <Text style={styles.footerEm}>x-kairo-user-id</Text> on API requests.
        </Text>

        <Text style={styles.sectionLabel}>API base URL</Text>
        <View style={styles.card}>
          <Text style={styles.mono} selectable>
            {apiUrl}
          </Text>
        </View>

        <Text style={styles.sectionLabel}>Clerk user id</Text>
        <View style={styles.card}>
          <Text style={styles.mono} selectable>
            {clerkId}
          </Text>
        </View>

        <Text style={styles.sectionLabel}>Linked Kairo user id (Clerk metadata)</Text>
        <View style={styles.card}>
          <Text style={styles.mono} selectable>
            {linked}
          </Text>
        </View>

        <Text style={styles.sectionLabel}>Dev fallback (EXPO_PUBLIC_KAIRO_DEV_USER_ID)</Text>
        <View style={styles.card}>
          <Text style={styles.mono} selectable>
            {devFallback}
          </Text>
        </View>

        <Text style={styles.sectionLabel}>Effective API user (x-kairo-user-id)</Text>
        <View style={styles.card}>
          <Text style={styles.mono} selectable>
            {effectiveApiUser}
          </Text>
        </View>

        <Text style={styles.footer}>
          Set <Text style={styles.footerEm}>EXPO_PUBLIC_API_URL</Text> in <Text style={styles.footerEm}>.env</Text>{" "}
          (see <Text style={styles.footerEm}>.env.example</Text>). Run <Text style={styles.footerEm}>npm run db:seed</Text>{" "}
          from the repo root, then paste Alice’s Prisma id into{" "}
          <Text style={styles.footerEm}>EXPO_PUBLIC_KAIRO_DEV_USER_ID</Text> or into Clerk{" "}
          <Text style={styles.footerEm}>publicMetadata.kairoUserId</Text>.
        </Text>
      </ScrollView>
      <SettingsStackHeader title="Developer" />
    </View>
  );
}
