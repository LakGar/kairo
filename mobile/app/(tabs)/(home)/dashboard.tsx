import { useRouter, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { TabScreenHeader } from "@/components/tab-screen-header";
import { useColorScheme } from "@/hooks/useColorScheme";
import { HomeDashboard } from "@/src/features/home/home-dashboard";
import { useHomeColors } from "@/src/features/home/home-theme";
import {
  loadPersonalCommitment,
  loadPersonalCommitmentFlowDismissed,
} from "@/src/features/personal-commitment/personal-commitment-store";
import { createKairoApiFromEnv } from "@/src/api";

const TAB_BAR_SPACE = 128;

/**
 * Home tab — accountability command center.
 * Global chrome: `TabScreenHeader` (not duplicated in scroll content).
 * First-time users without a personal commitment are guided through `personal-commit-onboarding`.
 */
export default function DashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const headerPad = insets.top + 58;
  const colors = useHomeColors();
  const colorScheme = useColorScheme() ?? "light";
  const headerChrome = colorScheme === "dark" ? "feedDark" : "default";

  const [gateReady, setGateReady] = useState(false);
  const [notificationBadgeCount, setNotificationBadgeCount] = useState(0);

  const refreshNotificationBadge = useCallback(async () => {
    try {
      const api = createKairoApiFromEnv();
      const data = await api.getMyNotifications();
      setNotificationBadgeCount(data.unreadCount);
    } catch {
      // Keep last count; Home stays usable without notifications API.
    }
  }, []);

  const runPersonalCommitmentGate = useCallback(async () => {
    const [commitment, dismissed] = await Promise.all([
      loadPersonalCommitment(),
      loadPersonalCommitmentFlowDismissed(),
    ]);
    if (!commitment && !dismissed) {
      router.replace("/(tabs)/personal-commit-onboarding");
      return;
    }
    setGateReady(true);
  }, [router]);

  useEffect(() => {
    void runPersonalCommitmentGate();
  }, [runPersonalCommitmentGate]);

  useEffect(() => {
    if (!gateReady) return;
    void refreshNotificationBadge();
  }, [gateReady, refreshNotificationBadge]);

  useFocusEffect(
    useCallback(() => {
      if (!gateReady) return;
      void refreshNotificationBadge();
    }, [gateReady, refreshNotificationBadge]),
  );

  if (!gateReady) {
    return (
      <View style={[styles.root, styles.centered, { backgroundColor: colors.bg }]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <HomeDashboard
        contentPaddingTop={headerPad}
        contentPaddingBottom={TAB_BAR_SPACE + insets.bottom}
        onRequestPersonalCommitmentFlow={() =>
          router.push("/(tabs)/personal-commit-onboarding")
        }
      />
      <View style={styles.headerLayer} pointerEvents="box-none">
        <TabScreenHeader
          variant="home"
          chrome={headerChrome}
          notificationBadgeCount={notificationBadgeCount}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  centered: {
    alignItems: "center",
    justifyContent: "center",
  },
  headerLayer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
});
