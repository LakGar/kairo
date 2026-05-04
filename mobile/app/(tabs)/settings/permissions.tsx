import { useMemo } from "react";
import { Ionicons } from "@expo/vector-icons";
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

import { SettingsStackHeader } from "@/components/settings-stack-header";
import {
  type SettingsChrome,
  useSettingsChrome,
} from "@/src/settings/settings-chrome";

const ITEMS: { icon: keyof typeof Ionicons.glyphMap; title: string; body: string }[] =
  [
    {
      icon: "images-outline",
      title: "Photos",
      body: "Used when you change your profile picture from your library.",
    },
    {
      icon: "notifications-outline",
      title: "Notifications",
      body: "Optional push alerts for commitments, proofs, and circle activity.",
    },
    {
      icon: "mic-outline",
      title: "Microphone & camera",
      body: "Not required today. Kairo may request them later for proof capture.",
    },
  ];

function createPermissionsStyles(c: SettingsChrome) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: c.screen },
    scroll: { paddingHorizontal: 16 },
    lead: {
      fontSize: 15,
      lineHeight: 22,
      color: c.muted,
      marginBottom: 18,
    },
    primaryBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      backgroundColor: c.primaryBtnBg,
      borderRadius: 14,
      paddingVertical: 16,
      marginBottom: 28,
    },
    primaryBtnText: {
      color: c.primaryBtnText,
      fontSize: 16,
      fontWeight: "700",
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
    group: {
      backgroundColor: c.card,
      borderRadius: 14,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.cardBorder,
      overflow: "hidden",
    },
    itemRow: {
      flexDirection: "row",
      paddingVertical: 14,
      paddingHorizontal: 14,
      gap: 14,
    },
    itemRowBorder: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: c.cardBorder,
    },
    iconWrap: {
      width: 40,
      height: 40,
      borderRadius: 10,
      backgroundColor: c.headerBackBtnBg,
      alignItems: "center",
      justifyContent: "center",
    },
    itemText: { flex: 1, minWidth: 0 },
    itemTitle: {
      color: c.label,
      fontSize: 16,
      fontWeight: "600",
    },
    itemBody: {
      marginTop: 4,
      fontSize: 14,
      lineHeight: 20,
      color: c.muted,
    },
  });
}

export default function PermissionsScreen() {
  const insets = useSafeAreaInsets();
  const headerPad = insets.top + 52;
  const bottomPad = Math.max(insets.bottom, 16) + 32;
  const chrome = useSettingsChrome();
  const styles = useMemo(() => createPermissionsStyles(chrome), [chrome]);

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
          Kairo only asks for access when a feature needs it. You can grant or revoke
          permissions anytime in {Platform.OS === "ios" ? "iOS Settings" : "Android Settings"}.
        </Text>

        <Pressable
          style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.9 }]}
          onPress={() => void Linking.openSettings()}
        >
          <Ionicons name="open-outline" size={20} color={chrome.primaryBtnText} />
          <Text style={styles.primaryBtnText}>Open app settings</Text>
        </Pressable>

        <Text style={styles.sectionLabel}>What we use</Text>
        <View style={styles.group}>
          {ITEMS.map((item, i) => (
            <View
              key={item.title}
              style={[styles.itemRow, i > 0 && styles.itemRowBorder]}
            >
              <View style={styles.iconWrap}>
                <Ionicons name={item.icon} size={22} color={chrome.label} />
              </View>
              <View style={styles.itemText}>
                <Text style={styles.itemTitle}>{item.title}</Text>
                <Text style={styles.itemBody}>{item.body}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
      <SettingsStackHeader title="Permissions" />
    </View>
  );
}
