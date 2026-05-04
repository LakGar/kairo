import { Stack } from "expo-router";
import { useMemo } from "react";

import { useColorScheme } from "@/hooks/useColorScheme";

export default function SettingsStackLayout() {
  const scheme = useColorScheme() ?? "light";
  const bg = scheme === "dark" ? "#000000" : "#FFFFFF";
  const screenOptions = useMemo(
    () => ({
      headerShown: false,
      animation: "slide_from_right" as const,
      contentStyle: { backgroundColor: bg },
    }),
    [bg],
  );

  return (
    <Stack
      screenOptions={screenOptions}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="profile" />
      <Stack.Screen name="account" />
      <Stack.Screen name="payments" />
      <Stack.Screen name="edit-profile" />
      <Stack.Screen name="kairo-profile" />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="permissions" />
      <Stack.Screen name="appearance" />
      <Stack.Screen name="developer" />
    </Stack>
  );
}
