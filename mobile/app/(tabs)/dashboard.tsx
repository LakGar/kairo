import { useUser } from "@clerk/expo";
import { LinearGradient } from "expo-linear-gradient";
import { type Href, useRouter } from "expo-router";
import { Pressable, StyleSheet, View, type ViewStyle, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useThemeColor } from "@/hooks/use-theme-color";
import { useUIPalette } from "@/hooks/use-ui-palette";
import { useMyEvents } from "@/src/features/events/use-my-events";
import { useUpcomingEvents } from "@/src/features/events/use-upcoming-events";

function StatCard({
  label,
  value,
  onPress,
  pressableStyle,
}: {
  label: string;
  value: number;
  onPress?: () => void;
  pressableStyle?: ViewStyle;
}) {
  const ui = useUIPalette();
  const content = (
    <ThemedView
      style={[
        styles.card,
        {
          backgroundColor: ui.card,
          borderColor: ui.cardBorder,
        },
        Platform.select({
          ios: {
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 6,
          },
          android: { elevation: 2 },
          default: {},
        }),
      ]}
    >
      <ThemedText type="small" style={styles.cardLabel}>
        {label}
      </ThemedText>
      <ThemedText type="title" style={styles.statNum}>
        {value}
      </ThemedText>
    </ThemedView>
  );
  if (onPress) {
    return (
      <Pressable onPress={onPress} style={pressableStyle ?? styles.cardPress}>
        {content}
      </Pressable>
    );
  }
  return content;
}

export default function DashboardScreen() {
  const { user } = useUser();
  const router = useRouter();
  const ui = useUIPalette();
  const tint = useThemeColor({}, "tint");
  const { hosting, attending, loading } = useMyEvents();
  const { events: upcoming, loading: upcomingLoading } = useUpcomingEvents();

  const first = user?.firstName?.trim() || "there";

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: ui.groupedBackground }]} edges={["bottom"]}>
      <LinearGradient
        colors={[ui.heroTintWash, ui.groupedBackground]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroGradient}
      >
        <View style={styles.hero}>
          <ThemedText type="title">Hi, {first}</ThemedText>
          <ThemedText type="muted" style={styles.heroSub}>
            Your Kairo home — manage what you host, what you join, and what is live in the
            community.
          </ThemedText>
        </View>
      </LinearGradient>

      <View style={styles.row}>
        <StatCard
          label="Hosting"
          value={loading ? 0 : hosting.length}
          onPress={() => router.push("/(tabs)/events")}
        />
        <StatCard
          label="Attending"
          value={loading ? 0 : attending.length}
          onPress={() => router.push("/(tabs)/events")}
        />
      </View>

      <View style={styles.wideCard}>
        <StatCard
          label="Upcoming in Discover"
          value={upcomingLoading ? 0 : upcoming.length}
          pressableStyle={styles.cardPressFull}
          onPress={() => router.push("/(tabs)/index" as Href)}
        />
      </View>

      <View style={styles.actions}>
        <Pressable
          style={[
            styles.primaryBtn,
            { backgroundColor: tint },
            Platform.select({
              ios: {
                shadowColor: tint,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.35,
                shadowRadius: 8,
              },
              android: { elevation: 4 },
              default: {},
            }),
          ]}
          onPress={() => router.push("/(tabs)/create")}
        >
          <ThemedText style={[styles.primaryBtnLabel, { color: ui.linkOnTint }]}>
            Create event
          </ThemedText>
        </Pressable>
        <Pressable
          style={[
            styles.secondaryBtn,
            { borderColor: tint, backgroundColor: ui.card },
          ]}
          onPress={() => router.push("/(tabs)/index" as Href)}
        >
          <ThemedText style={[styles.secondaryLabel, { color: tint }]}>
            Browse Discover
          </ThemedText>
        </Pressable>
        <Pressable
          style={[
            styles.secondaryBtn,
            { borderColor: ui.cardBorder, backgroundColor: ui.card },
          ]}
          onPress={() => router.push("/(tabs)/events")}
        >
          <ThemedText type="default" style={styles.secondaryMuted}>
            Open My events
          </ThemedText>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  heroGradient: {
    paddingBottom: 8,
  },
  hero: {
    paddingHorizontal: 20,
    paddingTop: 12,
    gap: 8,
  },
  heroSub: {
    lineHeight: 22,
  },
  row: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 20,
  },
  wideCard: {
    paddingHorizontal: 20,
    marginTop: 12,
  },
  cardPress: {
    flex: 1,
  },
  cardPressFull: {
    alignSelf: "stretch",
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 4,
    minHeight: 100,
    justifyContent: "center",
  },
  cardLabel: {
    textTransform: "uppercase",
    letterSpacing: 0.8,
    opacity: 0.75,
  },
  statNum: {
    marginTop: 4,
  },
  actions: {
    paddingHorizontal: 20,
    marginTop: 28,
    gap: 12,
  },
  primaryBtn: {
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: "center",
  },
  primaryBtnLabel: {
    fontWeight: "700",
    fontSize: 16,
  },
  secondaryBtn: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    borderWidth: 2,
  },
  secondaryLabel: {
    fontWeight: "600",
    fontSize: 16,
  },
  secondaryMuted: {
    fontWeight: "600",
    fontSize: 16,
    opacity: 0.9,
  },
});
