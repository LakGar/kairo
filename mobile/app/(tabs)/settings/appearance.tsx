import { useCallback, useEffect, useMemo, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import {
  Appearance,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SettingsStackHeader } from "@/components/settings-stack-header";
import {
  loadAppearancePref,
  saveAppearancePref,
  type AppearancePref,
} from "@/src/settings/preferences-store";
import {
  type SettingsChrome,
  useSettingsChrome,
} from "@/src/settings/settings-chrome";

const OPTIONS: { id: AppearancePref; title: string; subtitle: string }[] = [
  {
    id: "system",
    title: "Match system",
    subtitle: "Follow your device light or dark mode.",
  },
  {
    id: "light",
    title: "Light",
    subtitle: "Always use light navigation chrome where supported.",
  },
  {
    id: "dark",
    title: "Dark",
    subtitle: "Always use dark navigation chrome where supported.",
  },
];

function createAppearanceStyles(c: SettingsChrome) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: c.screen },
    scroll: { paddingHorizontal: 16 },
    lead: {
      fontSize: 14,
      lineHeight: 21,
      color: c.muted,
      marginBottom: 18,
    },
    group: {
      backgroundColor: c.card,
      borderRadius: 14,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.cardBorder,
      overflow: "hidden",
    },
    optionRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 14,
      paddingHorizontal: 14,
      gap: 12,
    },
    optionRowBorder: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: c.cardBorder,
    },
    optionText: { flex: 1, minWidth: 0 },
    optionTitle: {
      color: c.label,
      fontSize: 16,
      fontWeight: "600",
    },
    optionSub: {
      marginTop: 4,
      fontSize: 13,
      lineHeight: 18,
      color: c.muted,
    },
  });
}

export default function AppearanceScreen() {
  const insets = useSafeAreaInsets();
  const headerPad = insets.top + 52;
  const bottomPad = Math.max(insets.bottom, 16) + 32;
  const chrome = useSettingsChrome();
  const styles = useMemo(() => createAppearanceStyles(chrome), [chrome]);

  const [selected, setSelected] = useState<AppearancePref>("system");

  useEffect(() => {
    void loadAppearancePref().then(setSelected);
  }, []);

  const onSelect = useCallback(async (id: AppearancePref) => {
    setSelected(id);
    Appearance.setColorScheme(id === "system" ? null : id);
    await saveAppearancePref(id);
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
        <Text style={styles.lead}>
          Match system, or lock light or dark. Home, Discover, Chat, Create Event, and
          settings screens follow this choice (pure black dark mode).
        </Text>

        <View style={styles.group}>
          {OPTIONS.map((opt, i) => {
            const active = selected === opt.id;
            return (
              <Pressable
                key={opt.id}
                onPress={() => void onSelect(opt.id)}
                style={({ pressed }) => [
                  styles.optionRow,
                  i > 0 && styles.optionRowBorder,
                  pressed && { opacity: 0.85 },
                ]}
              >
                <View style={styles.optionText}>
                  <Text style={styles.optionTitle}>{opt.title}</Text>
                  <Text style={styles.optionSub}>{opt.subtitle}</Text>
                </View>
                <Ionicons
                  name={active ? "checkmark-circle" : "ellipse-outline"}
                  size={24}
                  color={active ? "#34C759" : chrome.inactiveIcon}
                />
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
      <SettingsStackHeader title="Appearance" />
    </View>
  );
}
