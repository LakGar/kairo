import { Stack } from "expo-router";

export default function PaymentsStackLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
        contentStyle: { backgroundColor: "#000" },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="add-payment" />
      <Stack.Screen name="history" />
    </Stack>
  );
}
