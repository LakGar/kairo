import * as Notifications from "expo-notifications";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import Constants from "expo-constants";

import { createKairoApiFromEnv } from "@/src/api";
import { KairoApiConfigurationError, KairoApiError } from "@/src/api/types";

/** SecureStore key for last registered Expo push token (used to PATCH `enabled`). */
export const STORED_EXPO_PUSH_TOKEN_KEY = "kairo_last_expo_push_token_v1";

let handlerInstalled = false;

function ensureDefaultHandler() {
  if (handlerInstalled) return;
  handlerInstalled = true;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

export type RegisterPushTokenResult =
  | { ok: true; id: string; expoToken: string }
  | { ok: false; reason: string };

/**
 * Requests notification permission (when `requestPermission`), resolves Expo push token,
 * and POSTs to `POST /api/me/push-tokens`. Does not throw — callers show UI from `reason`.
 */
export async function registerPushTokenWithBackend(options?: {
  /** When false, only proceeds if permission already granted (e.g. silent session hook). */
  requestPermission?: boolean;
}): Promise<RegisterPushTokenResult> {
  ensureDefaultHandler();

  if (Platform.OS === "web") {
    return { ok: false, reason: "Push is not available on web." };
  }

  const requestPermission = options?.requestPermission !== false;

  try {
    const { status: existing } = await Notifications.getPermissionsAsync();
    let final = existing;
    if (existing !== "granted") {
      if (!requestPermission) {
        return { ok: false, reason: "permission_needed" };
      }
      const { status } = await Notifications.requestPermissionsAsync();
      final = status;
    }
    if (final !== "granted") {
      return { ok: false, reason: "permission_denied" };
    }

    const projectId =
      (Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined)?.eas
        ?.projectId ?? Constants.easConfig?.projectId;

    const expo = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId: String(projectId) } : {},
    );
    const expoToken = expo.data;

    const api = createKairoApiFromEnv();
    const saved = await api.registerPushToken({
      token: expoToken,
      platform: Platform.OS === "ios" ? "ios" : Platform.OS === "android" ? "android" : "native",
      deviceId:
        "sessionId" in Constants && typeof Constants.sessionId === "string"
          ? Constants.sessionId
          : undefined,
    });

    await SecureStore.setItemAsync(STORED_EXPO_PUSH_TOKEN_KEY, expoToken);

    return { ok: true, id: saved.id, expoToken };
  } catch (e) {
    if (e instanceof KairoApiConfigurationError) {
      return { ok: false, reason: "not_configured" };
    }
    if (e instanceof KairoApiError) {
      return { ok: false, reason: e.message };
    }
    const msg = e instanceof Error ? e.message : "unknown_error";
    return { ok: false, reason: msg };
  }
}

export async function disableRegisteredPushTokenOnBackend(): Promise<void> {
  const expoToken = await SecureStore.getItemAsync(STORED_EXPO_PUSH_TOKEN_KEY);
  if (!expoToken?.trim()) return;
  try {
    const api = createKairoApiFromEnv();
    await api.patchPushToken({ token: expoToken, enabled: false });
  } catch {
    /* best-effort */
  }
}
