import Constants from "expo-constants";

import { getBootstrappedUserIdSync } from "./bootstrap-user-id";
import { getApiBaseUrl } from "./config";
import {
  KairoApiConfigurationError,
  KairoApiError,
  type ApiEnvelope,
  type ApiEventPublic,
  type ApiMeEventsPayload,
  type ApiLeaveTeamResult,
  type ApiMatchPublic,
  type ApiProofPrompt,
  type ApiProofReviewResult,
  type ApiProofSubmission,
  type ApiStake,
  type ApiTeamPublic,
  type ApiBillingPurchase,
} from "./types";

type HttpMethod = "GET" | "POST" | "PATCH";

type ExpoExtra = { devUserId?: string };

/** Prisma `User.id` from env / app config when Clerk metadata is not linked yet. */
export function getDevFallbackKairoUserId(): string | undefined {
  const fromEnv = process.env.EXPO_PUBLIC_KAIRO_DEV_USER_ID?.trim();
  if (fromEnv) return fromEnv;
  const extra = Constants.expoConfig?.extra as ExpoExtra | undefined;
  const fromExtra = extra?.devUserId?.trim();
  return fromExtra || undefined;
}

/**
 * Prefer an explicit id (e.g. from Clerk `kairoUserId`); otherwise dev fallback from
 * `EXPO_PUBLIC_KAIRO_DEV_USER_ID` / `expo.extra.devUserId`.
 */
/**
 * Resolves Prisma `User.id` for `x-kairo-user-id`.
 * Order: explicit (e.g. Clerk metadata `kairoUserId`) → bootstrapped id from SecureStore → dev env id.
 */
export function resolveActingUserId(explicitUserId?: string | null): string | undefined {
  const trimmed = explicitUserId?.trim();
  if (trimmed) return trimmed;
  const boot = getBootstrappedUserIdSync()?.trim();
  if (boot) return boot;
  return getDevFallbackKairoUserId();
}


async function requestEnvelope<T>(
  baseUrl: string,
  path: string,
  options: {
    method?: HttpMethod;
    json?: unknown;
    userId?: string | null;
  } = {},
): Promise<T> {
  const method = options.method ?? "GET";
  const headers = new Headers();
  const uid = options.userId?.trim();
  if (uid) {
    headers.set("x-kairo-user-id", uid);
  }

  const sendJson = options.json !== undefined && method !== "GET";

  if (sendJson) {
    headers.set("Content-Type", "application/json");
  }

  const url = `${baseUrl.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
  const res = await fetch(url, {
    method,
    headers,
    body: sendJson ? JSON.stringify(options.json) : undefined,
  });

  const text = await res.text();
  let parsed: unknown;
  try {
    parsed = text ? (JSON.parse(text) as unknown) : {};
  } catch {
    throw new KairoApiError(
      text.slice(0, 200) || `HTTP ${res.status}`,
      "INVALID_RESPONSE",
      res.status,
    );
  }

  if (
    typeof parsed !== "object" ||
    parsed === null ||
    !("success" in parsed)
  ) {
    throw new KairoApiError("Unexpected response", "INVALID_RESPONSE", res.status);
  }

  const envelope = parsed as ApiEnvelope<T>;
  if (!envelope.success) {
    throw new KairoApiError(
      envelope.error.message,
      envelope.error.code,
      res.status,
    );
  }
  return envelope.data;
}

export interface KairoApi {
  listUpcomingEvents: () => Promise<ApiEventPublic[]>;
  getMyEvents: () => Promise<ApiMeEventsPayload>;
  getEvent: (eventId: string) => Promise<ApiEventPublic>;
  createEvent: (body: unknown) => Promise<ApiEventPublic>;
  updateEvent: (eventId: string, body: unknown) => Promise<ApiEventPublic>;
  publishEvent: (eventId: string) => Promise<ApiEventPublic>;
  cancelEvent: (eventId: string) => Promise<ApiEventPublic>;
  joinEvent: (eventId: string, body: unknown) => Promise<ApiEventPublic>;
  listTeams: (eventId: string) => Promise<ApiTeamPublic[]>;
  createTeam: (eventId: string, body: unknown) => Promise<ApiTeamPublic>;
  listMatches: (eventId: string) => Promise<ApiMatchPublic[]>;
  createMatch: (eventId: string, body: unknown) => Promise<ApiMatchPublic>;
  listProofPrompts: (eventId: string) => Promise<ApiProofPrompt[]>;
  createProofPrompt: (eventId: string, body: unknown) => Promise<ApiProofPrompt>;
  listProofSubmissions: (eventId: string) => Promise<ApiProofSubmission[]>;
  submitProof: (eventId: string, body: unknown) => Promise<ApiProofSubmission>;
  listStakes: (eventId: string) => Promise<ApiStake[]>;
  createStake: (eventId: string, body: unknown) => Promise<ApiStake>;
  joinTeam: (teamId: string) => Promise<ApiTeamPublic>;
  leaveTeam: (teamId: string) => Promise<ApiLeaveTeamResult>;
  updateMatchScore: (matchId: string, body: unknown) => Promise<ApiMatchPublic>;
  markMatchWinner: (matchId: string, body: unknown) => Promise<ApiMatchPublic>;
  approveProof: (proofSubmissionId: string) => Promise<ApiProofReviewResult>;
  rejectProof: (proofSubmissionId: string) => Promise<ApiProofReviewResult>;
  createBillingPortalSession: (body: {
    flow: "payment_method_update" | "default";
  }) => Promise<{ url: string }>;
  listBillingPurchases: () => Promise<ApiBillingPurchase[]>;
}

export function createKairoApi(config: {
  baseUrl: string;
  /** Linked Prisma `User.id`, sent as `x-kairo-user-id` when present. */
  userId?: string | null;
}): KairoApi {
  const base = config.baseUrl.trim().replace(/\/$/, "");
  const userId = config.userId?.trim() || undefined;

  const req = <T>(path: string, o: { method?: HttpMethod; json?: unknown } = {}) =>
    requestEnvelope<T>(base, path, { ...o, userId });

  return {
    listUpcomingEvents: () => req("/api/events"),
    getMyEvents: () => req("/api/me/events"),
    getEvent: (eventId) => req(`/api/events/${encodeURIComponent(eventId)}`),
    createEvent: (body) => req("/api/events", { method: "POST", json: body }),
    updateEvent: (eventId, body) =>
      req(`/api/events/${encodeURIComponent(eventId)}`, { method: "PATCH", json: body }),
    publishEvent: (eventId) =>
      req(`/api/events/${encodeURIComponent(eventId)}/publish`, { method: "POST" }),
    cancelEvent: (eventId) =>
      req(`/api/events/${encodeURIComponent(eventId)}/cancel`, { method: "POST" }),
    joinEvent: (eventId, body) =>
      req(`/api/events/${encodeURIComponent(eventId)}/join`, { method: "POST", json: body }),
    listTeams: (eventId) => req(`/api/events/${encodeURIComponent(eventId)}/teams`),
    createTeam: (eventId, body) =>
      req(`/api/events/${encodeURIComponent(eventId)}/teams`, { method: "POST", json: body }),
    listMatches: (eventId) => req(`/api/events/${encodeURIComponent(eventId)}/matches`),
    createMatch: (eventId, body) =>
      req(`/api/events/${encodeURIComponent(eventId)}/matches`, {
        method: "POST",
        json: body,
      }),
    listProofPrompts: (eventId) =>
      req(`/api/events/${encodeURIComponent(eventId)}/proof-prompts`),
    createProofPrompt: (eventId, body) =>
      req(`/api/events/${encodeURIComponent(eventId)}/proof-prompts`, {
        method: "POST",
        json: body,
      }),
    listProofSubmissions: (eventId) =>
      req(`/api/events/${encodeURIComponent(eventId)}/proof`),
    submitProof: (eventId, body) =>
      req(`/api/events/${encodeURIComponent(eventId)}/proof`, {
        method: "POST",
        json: body,
      }),
    listStakes: (eventId) => req(`/api/events/${encodeURIComponent(eventId)}/stakes`),
    createStake: (eventId, body) =>
      req(`/api/events/${encodeURIComponent(eventId)}/stakes`, {
        method: "POST",
        json: body,
      }),
    joinTeam: (teamId) =>
      req(`/api/teams/${encodeURIComponent(teamId)}/join`, {
        method: "POST",
        json: {},
      }),
    leaveTeam: (teamId) =>
      req(`/api/teams/${encodeURIComponent(teamId)}/leave`, { method: "POST" }),
    updateMatchScore: (matchId, body) =>
      req(`/api/matches/${encodeURIComponent(matchId)}/score`, {
        method: "PATCH",
        json: body,
      }),
    markMatchWinner: (matchId, body) =>
      req(`/api/matches/${encodeURIComponent(matchId)}/winner`, {
        method: "PATCH",
        json: body,
      }),
    approveProof: (proofSubmissionId) =>
      req(`/api/proof/${encodeURIComponent(proofSubmissionId)}/approve`, {
        method: "POST",
      }),
    rejectProof: (proofSubmissionId) =>
      req(`/api/proof/${encodeURIComponent(proofSubmissionId)}/reject`, {
        method: "POST",
      }),
    createBillingPortalSession: (body) =>
      req("/api/billing/portal/session", { method: "POST", json: body }),
    listBillingPurchases: () => req("/api/billing/purchases"),
  };
}

/**
 * Builds a client from `EXPO_PUBLIC_API_URL` / `expo.extra.apiUrl` and optional user id.
 * When `userId` is missing or blank, uses the bootstrapped Prisma id from SecureStore (see
 * `useBootstrapKairoUser`), then `EXPO_PUBLIC_KAIRO_DEV_USER_ID` / `expo.extra.devUserId`, so local dev
 * can hit the DB-backed API after `npm run db:seed` without Clerk metadata.
 * @throws {KairoApiConfigurationError} when no base URL is configured.
 */
export function createKairoApiFromEnv(overrides?: {
  baseUrl?: string;
  userId?: string | null;
}): KairoApi {
  const rawBase =
    overrides?.baseUrl !== undefined && overrides.baseUrl !== ""
      ? overrides.baseUrl
      : getApiBaseUrl();
  const baseUrl = rawBase.trim().replace(/\/$/, "");
  if (!baseUrl) {
    throw new KairoApiConfigurationError(
      "Missing API base URL. Set EXPO_PUBLIC_API_URL in mobile/.env (see .env.example), or pass overrides.baseUrl.",
    );
  }
  const explicit =
    overrides && "userId" in overrides ? (overrides.userId ?? undefined) : undefined;
  const userId = resolveActingUserId(explicit);

  return createKairoApi({ baseUrl, userId });
}
