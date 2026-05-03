import { useUser } from "@clerk/expo";
import { type Href, useRouter } from "expo-router";
import { Pressable, StyleSheet, View, type ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useThemeColor } from "@/hooks/use-theme-color";
import { useMyEvents } from "@/src/features/events/use-my-events";
import { useUpcomingEvents } from "@/src/features/events/use-upcoming-events";

function StatCard({
  label,
  value,
  onPress,
  borderColor,
  surface,
  pressableStyle,
}: {
  label: string;
  value: number;
  onPress?: () => void;
  borderColor: string;
  surface: string;
  pressableStyle?: ViewStyle;
}) {
  const content = (
    <ThemedView style={[styles.card, { borderColor, backgroundColor: surface }]}>
      <ThemedText type="muted">{label}</ThemedText>
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
  const { hosting, attending, loading } = useMyEvents();
  const { events: upcoming, loading: upcomingLoading } = useUpcomingEvents();

  const borderColor = useThemeColor({ light: "#C6C6C8", dark: "#3A3A3C" }, "icon");
  const surface = useThemeColor({ light: "#F2F2F7", dark: "#2C2C2E" }, "background");
  const tint = useThemeColor({}, "tint");

  const first = user?.firstName?.trim() || "there";

  return (
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
      <ThemedView style={styles.hero}>
        <ThemedText type="title">Hi, {first}</ThemedText>
        <ThemedText type="muted" style={styles.heroSub}>
          Your Kairo home — manage what you host, what you join, and what is live in the
          community.
        </ThemedText>
      </ThemedView>

      <View style={styles.row}>
        <StatCard
          label="Hosting"
          value={loading ? 0 : hosting.length}
          borderColor={borderColor}
          surface={surface}
          onPress={() => router.push("/(tabs)/events")}
        />
        <StatCard
          label="Attending"
          value={loading ? 0 : attending.length}
          borderColor={borderColor}
          surface={surface}
          onPress={() => router.push("/(tabs)/events")}
        />
      </View>

      <View style={styles.wideCard}>
        <StatCard
          label="Upcoming in Discover"
          value={upcomingLoading ? 0 : upcoming.length}
          borderColor={borderColor}
          surface={surface}
          pressableStyle={styles.cardPressFull}
          onPress={() => router.push("/(tabs)/index" as Href)}
        />
      </View>

      <View style={styles.actions}>
        <Pressable
          style={[styles.primaryBtn, { backgroundColor: tint }]}
          onPress={() => router.push("/(tabs)/create")}
        >
          <ThemedText style={styles.primaryBtnLabel}>Create event</ThemedText>
        </Pressable>
        <Pressable
          style={[styles.secondaryBtn, { borderColor: tint }]}
          onPress={() => router.push("/(tabs)/index" as Href)}
        >
          <ThemedText style={[styles.secondaryLabel, { color: tint }]}>
            Browse Discover
          </ThemedText>
        </Pressable>
        <Pressable
          style={[styles.secondaryBtn, { borderColor: tint }]}
          onPress={() => router.push("/(tabs)/events")}
        >
          <ThemedText style={[styles.secondaryLabel, { color: tint }]}>
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
  hero: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
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
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
    gap: 4,
    minHeight: 96,
    justifyContent: "center",
  },
  statNum: {
    marginTop: 4,
  },
  actions: {
    paddingHorizontal: 20,
    marginTop: 24,
    gap: 12,
  },
  primaryBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  primaryBtnLabel: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  secondaryBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 2,
    backgroundColor: "transparent",
  },
  secondaryLabel: {
    fontWeight: "600",
    fontSize: 16,
  },
});
