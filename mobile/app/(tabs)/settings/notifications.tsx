import { useCallback, useEffect, useMemo, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import * as Notifications from "expo-notifications";
import { useFocusEffect } from "expo-router";
import * as SecureStore from "expo-secure-store";
import {
  ActivityIndicator,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SettingsStackHeader } from "@/components/settings-stack-header";
import {
  disableRegisteredPushTokenOnBackend,
  registerPushTokenWithBackend,
  STORED_EXPO_PUSH_TOKEN_KEY,
} from "@/src/features/notifications/register-push-token";
import {
  defaultNotificationPrefs,
  loadNotificationPrefs,
  saveNotificationPrefs,
  type NotificationPrefs,
} from "@/src/settings/preferences-store";
import {
  type SettingsChrome,
  useSettingsChrome,
} from "@/src/settings/settings-chrome";

type NotificationsStyles = ReturnType<typeof createNotificationsStyles>;

function ToggleRow({
  title,
  subtitle,
  value,
  onValueChange,
  showDivider,
  styles,
  chrome,
}: {
  title: string;
  subtitle: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
  showDivider?: boolean;
  styles: NotificationsStyles;
  chrome: SettingsChrome;
}) {
  return (
    <View style={[styles.row, showDivider && styles.rowDivider]}>
      <View style={styles.rowText}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowSub}>{subtitle}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: chrome.switchTrackOff, true: "#34C759" }}
        thumbColor={Platform.OS === "ios" ? "#fff" : "#f4f4f5"}
      />
    </View>
  );
}

function createNotificationsStyles(c: SettingsChrome) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: c.screen },
    scroll: { paddingHorizontal: 16 },
    sectionLabel: {
      marginTop: 20,
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
    rowText: { flex: 1, minWidth: 0, paddingRight: 8 },
    rowTitle: {
      color: c.label,
      fontSize: 16,
      fontWeight: "600",
    },
    rowSub: {
      marginTop: 4,
      color: c.muted,
      fontSize: 13,
      lineHeight: 18,
    },
    loading: {
      paddingVertical: 40,
      alignItems: "center",
    },
    hint: {
      marginTop: 18,
      marginHorizontal: 4,
      fontSize: 13,
      lineHeight: 19,
      color: c.hint,
    },
    linkRow: {
      marginTop: 22,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingVertical: 12,
      paddingHorizontal: 4,
    },
    linkText: {
      flex: 1,
      color: c.modalLink,
      fontSize: 16,
      fontWeight: "600",
    },
    pushPrimaryBtn: {
      marginTop: 10,
      borderRadius: 14,
      paddingVertical: 14,
      alignItems: "center",
      backgroundColor: c.primaryBtnBg,
    },
    pushPrimaryBtnText: {
      color: c.primaryBtnText,
      fontSize: 16,
      fontWeight: "700",
    },
    pushStatus: {
      marginTop: 8,
      fontSize: 14,
      lineHeight: 20,
      color: c.hintEmphasis,
    },
  });
}

export default function NotificationsSettingsScreen() {
  const insets = useSafeAreaInsets();
  const headerPad = insets.top + 52;
  const bottomPad = Math.max(insets.bottom, 16) + 32;
  const chrome = useSettingsChrome();
  const styles = useMemo(() => createNotificationsStyles(chrome), [chrome]);

  const [prefs, setPrefs] = useState<NotificationPrefs>(defaultNotificationPrefs);
  const [loading, setLoading] = useState(true);
  const [pushStatusLine, setPushStatusLine] = useState<string>("");
  const [registeringPush, setRegisteringPush] = useState(false);

  const refreshPushDeviceState = useCallback(async () => {
    if (Platform.OS === "web") {
      setPushStatusLine("Push is not available on web.");
      return;
    }
    const { status } = await Notifications.getPermissionsAsync();
    const stored = await SecureStore.getItemAsync(STORED_EXPO_PUSH_TOKEN_KEY);
    if (status === "granted" && stored?.trim()) {
      setPushStatusLine("Push permission granted · device token saved on Kairo.");
    } else if (status === "granted") {
      setPushStatusLine("Push permission granted · tap below to register this device.");
    } else if (status === "denied") {
      setPushStatusLine("Notifications blocked for Kairo — use system settings to enable.");
    } else {
      setPushStatusLine("Permission not granted yet — use Enable push or the Push toggle.");
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    void loadNotificationPrefs().then((p) => {
      if (!cancelled) {
        setPrefs(p);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refreshPushDeviceState();
    }, [refreshPushDeviceState]),
  );

  const persist = useCallback(async (next: NotificationPrefs) => {
    setPrefs(next);
    await saveNotificationPrefs(next);
    if (next.push) {
      await registerPushTokenWithBackend({ requestPermission: true });
    } else {
      await disableRegisteredPushTokenOnBackend();
    }
    await refreshPushDeviceState();
  }, [refreshPushDeviceState]);

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
        <Text style={styles.sectionLabel}>This device (Expo push)</Text>
        <View style={styles.group}>
          <View style={[styles.row, styles.rowDivider]}>
            <View style={styles.rowText}>
              <Text style={styles.rowTitle}>Status</Text>
              <Text style={styles.pushStatus}>{pushStatusLine || "…"}</Text>
            </View>
          </View>
          <Pressable
            disabled={registeringPush || Platform.OS === "web"}
            onPress={async () => {
              setRegisteringPush(true);
              try {
                const r = await registerPushTokenWithBackend({ requestPermission: true });
                await refreshPushDeviceState();
                if (!r.ok && r.reason !== "permission_denied" && r.reason !== "permission_needed") {
                  setPushStatusLine(
                    r.reason === "not_configured"
                      ? "API not configured — set EXPO_PUBLIC_API_URL and sign in."
                      : `Could not register: ${r.reason}`,
                  );
                }
              } finally {
                setRegisteringPush(false);
              }
            }}
            style={({ pressed }) => [
              styles.pushPrimaryBtn,
              (registeringPush || Platform.OS === "web") && { opacity: 0.45 },
              pressed && !registeringPush && { opacity: 0.9 },
            ]}
          >
            {registeringPush ? (
              <ActivityIndicator color={chrome.primaryBtnText} />
            ) : (
              <Text style={styles.pushPrimaryBtnText}>Enable push notifications</Text>
            )}
          </Pressable>
        </View>

        <Text style={styles.sectionLabel}>Channels</Text>
        {loading ? (
          <View style={styles.loading}>
            <ActivityIndicator color="#FF6A2A" />
          </View>
        ) : (
          <View style={styles.group}>
            <ToggleRow
              title="Email"
              subtitle="Commitment reminders, proof reviews, and account updates."
              value={prefs.email}
              onValueChange={(email) => void persist({ ...prefs, email })}
              showDivider
              styles={styles}
              chrome={chrome}
            />
            <ToggleRow
              title="Text (SMS)"
              subtitle="Urgent nudges and verification codes when you opt in."
              value={prefs.sms}
              onValueChange={(sms) => void persist({ ...prefs, sms })}
              showDivider
              styles={styles}
              chrome={chrome}
            />
            <ToggleRow
              title="Push"
              subtitle="When on, registers this device with Kairo for Expo push (physical device recommended)."
              value={prefs.push}
              onValueChange={(push) => void persist({ ...prefs, push })}
              styles={styles}
              chrome={chrome}
            />
          </View>
        )}

        <Text style={styles.hint}>
          Channel toggles are stored on this device. Expo push delivery requires a physical
          device (simulators usually cannot obtain a push token). The server stores your Expo
          token for future sends — event automation is not wired yet.
        </Text>

        <Pressable
          style={({ pressed }) => [styles.linkRow, pressed && { opacity: 0.75 }]}
          onPress={() => void Linking.openSettings()}
        >
          <Ionicons name="settings-outline" size={20} color={chrome.modalLink} />
          <Text style={styles.linkText}>Open system notification settings</Text>
          <Ionicons name="chevron-forward" size={18} color={chrome.chevron} />
        </Pressable>
      </ScrollView>
      <SettingsStackHeader title="Notifications" />
    </View>
  );
}
