import Constants from "expo-constants";

type Extra = {
  apiUrl?: string;
  devUserId?: string;
};

function readExtra(): Extra {
  const extra = Constants.expoConfig?.extra;
  if (extra && typeof extra === "object") {
    return extra as Extra;
  }
  return {};
}

/**
 * Base URL for the Next.js site (no trailing slash), e.g. `http://192.168.1.5:3000`.
 * Uses `expo.extra.apiUrl` from `app.config.ts` (EAS / local env), then `process.env.EXPO_PUBLIC_API_URL`.
 */
export function getApiBaseUrl(): string {
  const extra = readExtra();
  const raw = (extra.apiUrl ?? process.env.EXPO_PUBLIC_API_URL ?? "").trim();
  return raw.replace(/\/$/, "");
}

/**
 * Dev-only user id for `x-kairo-user-id` until Clerk is wired on the website API.
 */
export function getDevUserId(): string | undefined {
  const extra = readExtra();
  const raw = (extra.devUserId ?? process.env.EXPO_PUBLIC_KAIRO_DEV_USER_ID ?? "").trim();
  return raw || undefined;
}

export function requireApiBaseUrl(): string {
  const base = getApiBaseUrl();
  if (!base) {
    throw new Error(
      "Missing API base URL. Set EXPO_PUBLIC_API_URL in mobile/.env (see .env.example) or pass baseUrl to createKairoApi().",
    );
  }
  return base;
}
