import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { useRouter } from "expo-router";
import { useMemo } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  type SettingsChrome,
  useSettingsChrome,
} from "@/src/settings/settings-chrome";

const androidBlur =
  Platform.OS === "android"
    ? { experimentalBlurMethod: "dimezisBlurView" as const }
    : {};

function createHeaderStyles(c: SettingsChrome) {
  return StyleSheet.create({
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
  });
}

export function SettingsStackHeader({ title }: { title: string }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const chrome = useSettingsChrome();
  const styles = useMemo(() => createHeaderStyles(chrome), [chrome]);

  return (
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
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={22} color={chrome.headerIcon} />
        </Pressable>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {title}
          </Text>
        </View>
        <View style={styles.headerRightSpacer} />
      </View>
    </View>
  );
}
