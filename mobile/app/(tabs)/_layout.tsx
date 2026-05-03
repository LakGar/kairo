import { useAuth, useClerk } from "@clerk/expo";
import { Redirect, Stack } from "expo-router";
import { Pressable, StyleSheet } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useThemeColor } from "@/hooks/use-theme-color";

function HeaderSignOut() {
  const { signOut } = useClerk();
  const tint = useThemeColor({}, "tint");
  return (
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
          headerRight: () => <HeaderSignOut />,
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
  headerBtn: {
    marginRight: 12,
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
