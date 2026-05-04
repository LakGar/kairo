import { Ionicons } from "@expo/vector-icons";
import { useUser } from "@clerk/expo";
import { BlurView } from "expo-blur";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColorScheme } from "@/hooks/useColorScheme";
import { useThemeColor } from "@/hooks/use-theme-color";
import { useUIPalette } from "@/hooks/use-ui-palette";

export type TabScreenHeaderVariant = "home" | "discover" | "chat";

type Props = {
  variant: TabScreenHeaderVariant;
  /** High-contrast chrome for dark full-bleed feeds (e.g. home). */
  chrome?: "default" | "feedDark";
  /** When greater than 0 on `home`, shows a small count badge on the notification bell. */
  notificationBadgeCount?: number;
};

const AVATAR = 36;

const androidHeaderBlur =
  Platform.OS === "android"
    ? { experimentalBlurMethod: "dimezisBlurView" as const }
    : {};

function HeaderAvatar({ feedDark }: { feedDark?: boolean }) {
  const { user } = useUser();
  const tint = useThemeColor({}, "tint");
  const ui = useUIPalette();
  const uri = user?.imageUrl;

  return (
    <View
      style={[
        styles.avatarRing,
        feedDark
          ? {
              borderColor: "rgba(255,255,255,0.35)",
              backgroundColor: "transparent",
            }
          : { borderColor: ui.cardBorder, backgroundColor: ui.card },
      ]}
    >
      {uri ? (
        <Image
          source={{ uri }}
          style={styles.avatarImg}
          contentFit="cover"
          transition={120}
          accessibilityLabel="Your profile photo"
        />
      ) : (
        <View style={[styles.avatarFallback, { backgroundColor: `${tint}28` }]}>
          <Ionicons name="person" size={20} color={tint} />
        </View>
      )}
    </View>
  );
}

export function TabScreenHeader({
  variant,
  chrome = "default",
  notificationBadgeCount = 0,
}: Props) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme() ?? "light";
  const scheme = colorScheme === "dark" ? "dark" : "light";
  const themePrimary = useThemeColor({}, "text");
  const feedDark = chrome === "feedDark";
  const primary = feedDark ? "#FFFFFF" : themePrimary;

  const title =
    variant === "home" ? null : variant === "discover" ? "Discover" : "Chat";

  /** Soft frosted strip behind the bar (light touch, not a heavy panel). */
  const headerBlurTint = feedDark
    ? "dark"
    : scheme === "dark"
      ? "dark"
      : "extraLight";
  const headerBlurIntensity = feedDark ? 20 : scheme === "dark" ? 28 : 34;

  const headerMinH = insets.top + 2 + 44 + 10;

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.wrap,
        {
          paddingTop: insets.top + 2,
          minHeight: headerMinH,
        },
      ]}
    >
      <BlurView
        pointerEvents="none"
        tint={headerBlurTint}
        intensity={headerBlurIntensity}
        style={styles.headerBackdrop}
        {...androidHeaderBlur}
      />
      <View style={styles.row}>
        <View style={styles.leftTitle}>
          <View style={styles.avatarSlot}>
            <Pressable
              onPress={() => router.push("/(tabs)/settings")}
              accessibilityRole="button"
              accessibilityLabel="Open settings"
            >
              <HeaderAvatar feedDark={feedDark} />
            </Pressable>
          </View>
          {variant === "home" ? (
            <View style={styles.brandRow}>
              <Text
                numberOfLines={1}
                style={[styles.brand, styles.brandKairo, { color: primary }]}
              >
                kairo
              </Text>
              <Ionicons
                name="sparkles"
                size={15}
                color={primary}
                style={styles.brandSparkle}
              />
            </View>
          ) : (
            <Text numberOfLines={1} style={[styles.brand, { color: primary }]}>
              {title}
            </Text>
          )}
        </View>
        <View style={[styles.rightActions, styles.rightActionsShrink]}>
          {variant === "home" ? (
            <>
              <Pressable
                hitSlop={10}
                style={styles.iconBtn}
                accessibilityRole="button"
                accessibilityLabel="Create"
                onPress={() => router.push("/(tabs)/events/create")}
              >
                <Ionicons name="add" size={26} color={primary} />
              </Pressable>
              <Pressable
                hitSlop={10}
                style={styles.iconBtn}
                accessibilityRole="button"
                accessibilityLabel="Notifications"
                onPress={() => router.push("/(tabs)/notifications")}
              >
                <View style={styles.notifWrap}>
                  <Ionicons
                    name="notifications-outline"
                    size={24}
                    color={primary}
                  />
                  {notificationBadgeCount > 0 ? (
                    <View style={styles.notifBadge}>
                      <Text style={styles.notifBadgeText}>
                        {notificationBadgeCount > 9 ? "9+" : String(notificationBadgeCount)}
                      </Text>
                    </View>
                  ) : null}
                </View>
              </Pressable>
            </>
          ) : variant === "chat" ? (
            <>
              <Pressable
                hitSlop={10}
                style={styles.iconBtn}
                accessibilityRole="button"
                accessibilityLabel="Search"
              >
                <Ionicons name="search-outline" size={24} color={primary} />
              </Pressable>
              <Pressable
                hitSlop={10}
                style={styles.iconBtn}
                accessibilityRole="button"
                accessibilityLabel="Friends"
                onPress={() => router.push("/(tabs)/(home)/chat/friends")}
              >
                <Ionicons name="people-outline" size={24} color={primary} />
              </Pressable>
            </>
          ) : (
            <>
              <Pressable
                hitSlop={10}
                style={styles.iconBtn}
                accessibilityRole="button"
                accessibilityLabel="Map"
              >
                <Ionicons name="map-outline" size={24} color={primary} />
              </Pressable>
              <Pressable
                hitSlop={10}
                style={styles.iconBtn}
                accessibilityRole="button"
                accessibilityLabel="Search"
              >
                <Ionicons name="search-outline" size={24} color={primary} />
              </Pressable>
            </>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "relative",
    overflow: "hidden",
    backgroundColor: "transparent",
  },
  headerBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 10,
    minHeight: 44,
  },
  leftTitle: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    minWidth: 0,
  },
  avatarSlot: {
    flexShrink: 0,
  },
  avatarRing: {
    width: AVATAR + 4,
    height: AVATAR + 4,
    borderRadius: (AVATAR + 4) / 2,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  brand: {
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: -0.6,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    minWidth: 0,
  },
  brandKairo: {
    textTransform: "lowercase",
    letterSpacing: -0.4,
  },
  brandSparkle: {
    marginLeft: 5,
    marginTop: 1,
  },
  notifWrap: {
    position: "relative",
  },
  notifBadge: {
    position: "absolute",
    top: -4,
    right: -6,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 5,
    borderRadius: 9,
    backgroundColor: "#EF4444",
    alignItems: "center",
    justifyContent: "center",
  },
  notifBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
  },
  rightActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 4,
  },
  rightActionsShrink: {
    flexShrink: 0,
  },
  iconBtn: {
    padding: 8,
  },
  avatarImg: {
    width: AVATAR,
    height: AVATAR,
    borderRadius: AVATAR / 2,
  },
  avatarFallback: {
    width: AVATAR,
    height: AVATAR,
    borderRadius: AVATAR / 2,
    alignItems: "center",
    justifyContent: "center",
  },
});
