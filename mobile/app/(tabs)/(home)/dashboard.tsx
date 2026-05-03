import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { TabScreenHeader } from "@/components/tab-screen-header";
import { HomeDashboard } from "@/src/features/home/home-dashboard";
import { HomeColors } from "@/src/features/home/home-tokens";

const TAB_BAR_SPACE = 120;

/**
 * Home tab — accountability command center (mock data; see `src/features/home/`).
 * Global chrome: `TabScreenHeader` (not duplicated in scroll content).
 */
export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const headerPad = insets.top + 58;

  return (
    <View style={[styles.root, { backgroundColor: HomeColors.bg }]}>
      <HomeDashboard
        contentPaddingTop={headerPad}
        contentPaddingBottom={TAB_BAR_SPACE + insets.bottom}
      />
      <View style={styles.headerLayer} pointerEvents="box-none">
        <TabScreenHeader variant="home" chrome="feedDark" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  headerLayer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
});
