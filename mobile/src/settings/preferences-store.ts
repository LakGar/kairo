import * as SecureStore from "expo-secure-store";

const NOTIF_KEY = "kairo_notification_prefs_v1";
const APPEARANCE_KEY = "kairo_appearance_pref_v1";

export type NotificationPrefs = {
  email: boolean;
  sms: boolean;
  push: boolean;
};

export const defaultNotificationPrefs: NotificationPrefs = {
  email: true,
  sms: true,
  push: true,
};

export async function loadNotificationPrefs(): Promise<NotificationPrefs> {
  try {
    const raw = await SecureStore.getItemAsync(NOTIF_KEY);
    if (!raw) return defaultNotificationPrefs;
    const p = JSON.parse(raw) as Partial<NotificationPrefs>;
    return {
      email: Boolean(p.email ?? defaultNotificationPrefs.email),
      sms: Boolean(p.sms ?? defaultNotificationPrefs.sms),
      push: Boolean(p.push ?? defaultNotificationPrefs.push),
    };
  } catch {
    return defaultNotificationPrefs;
  }
}

export async function saveNotificationPrefs(p: NotificationPrefs) {
  await SecureStore.setItemAsync(NOTIF_KEY, JSON.stringify(p));
}

export type AppearancePref = "system" | "light" | "dark";

export async function loadAppearancePref(): Promise<AppearancePref> {
  const v = await SecureStore.getItemAsync(APPEARANCE_KEY);
  if (v === "light" || v === "dark" || v === "system") return v;
  return "system";
}

export async function saveAppearancePref(p: AppearancePref) {
  await SecureStore.setItemAsync(APPEARANCE_KEY, p);
}
