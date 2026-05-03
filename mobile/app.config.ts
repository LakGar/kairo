import type { ConfigContext, ExpoConfig } from "expo/config";

// eslint-disable-next-line @typescript-eslint/no-require-imports -- Expo evaluates this file in Node; JSON import keeps app.json as source of truth.
const { expo } = require("./app.json") as { expo: ExpoConfig };

export default ({}: ConfigContext): ExpoConfig => ({
  ...expo,
  extra: {
    ...(expo.extra && typeof expo.extra === "object" ? expo.extra : {}),
    apiUrl: process.env.EXPO_PUBLIC_API_URL ?? "",
    devUserId: process.env.EXPO_PUBLIC_KAIRO_DEV_USER_ID ?? "",
  },
});
