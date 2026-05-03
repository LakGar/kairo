import { useAuth } from "@clerk/expo";
import { Stack } from "expo-router";

export default function AuthRoutesLayout() {
  const { isLoaded } = useAuth();

  if (!isLoaded) {
    return null;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    />
  );
}
