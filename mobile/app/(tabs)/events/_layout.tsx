import { Stack } from "expo-router";

export default function EventsStackLayout() {
  return (
    <Stack
      screenOptions={{
        headerTitleAlign: "center",
      }}
    >
      <Stack.Screen name="index" options={{ title: "My events" }} />
      <Stack.Screen
        name="[eventId]"
        options={{
          title: "Event",
          headerBackTitle: "My events",
        }}
      />
      <Stack.Screen name="create" options={{ headerShown: false, title: "Create event" }} />
    </Stack>
  );
}
