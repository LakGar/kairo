import { useCallback, useEffect, useMemo, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
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

  const persist = useCallback(async (next: NotificationPrefs) => {
    setPrefs(next);
    await saveNotificationPrefs(next);
  }, []);

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
              subtitle="In-app alerts on this device (requires notification permission)."
              value={prefs.push}
              onValueChange={(push) => void persist({ ...prefs, push })}
              styles={styles}
              chrome={chrome}
            />
          </View>
        )}

        <Text style={styles.hint}>
          These preferences are stored on this device. When Kairo&apos;s backend
          notification service is connected, they will control what we send you.
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
