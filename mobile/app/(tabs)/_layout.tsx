import { useAuth, useClerk } from "@clerk/expo";
import { Redirect, Stack, useRouter } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useThemeColor } from "@/hooks/use-theme-color";

function HeaderDiscoverActions() {
  const router = useRouter();
  const { signOut } = useClerk();
  const tint = useThemeColor({}, "tint");
  return (
    <View style={styles.headerRow}>
      <Pressable
        onPress={() => router.push("/(tabs)/create")}
        style={({ pressed }) => [styles.headerBtn, pressed && styles.headerBtnPressed]}
        accessibilityRole="button"
        accessibilityLabel="Create event"
      >
        <ThemedText type="small" style={[styles.headerBtnText, { color: tint }]}>
          Create
        </ThemedText>
      </Pressable>
      <Pressable
        onPress={() => void signOut()}
        style={({ pressed }) => [styles.headerBtn, pressed && styles.headerBtnPressed]}
        accessibilityRole="button"
        accessibilityLabel="Sign out"
      >
        <ThemedText type="small" style={[styles.headerBtnText, { color: tint }]}>
          Sign out
        </ThemedText>
      </Pressable>
    </View>
  );
}

export default function Layout() {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) {
    return null;
  }

  if (!isSignedIn) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  return (
    <Stack
      screenOptions={{
        headerTitleAlign: "center",
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: "Discover",
          headerRight: () => <HeaderDiscoverActions />,
        }}
      />
      <Stack.Screen
        name="create"
        options={{
          title: "New event",
          headerBackTitle: "Discover",
        }}
      />
      <Stack.Screen
        name="events/[eventId]"
        options={{
          title: "Event",
          headerBackTitle: "Back",
        }}
      />
    </Stack>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 4,
    gap: 4,
  },
  headerBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  headerBtnPressed: {
    opacity: 0.7,
  },
  headerBtnText: {
    fontWeight: "600",
  },
});
