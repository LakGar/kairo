import { getApiBaseUrl, getDevUserId } from "./config";
import {
  KairoApiConfigurationError,
  KairoApiError,
  type ApiEnvelope,
  type ApiEventPublic,
  type ApiMyEventsPayload,
  type ApiLeaveTeamResult,
  type ApiMatchPublic,
  type ApiProofPrompt,
  type ApiProofReviewResult,
  type ApiProofSubmission,
  type ApiStake,
  type ApiTeamPublic,
} from "./types";

type HttpMethod = "GET" | "POST" | "PATCH";

async function requestEnvelope<T>(
  baseUrl: string,
  path: string,
  options: {
    method?: HttpMethod;
    json?: unknown;
    devUserId?: string | null;
  } = {},
): Promise<T> {
  const method = options.method ?? "GET";
  const headers = new Headers();
  const uid = options.devUserId?.trim();
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
  getMyEvents: () => Promise<ApiMyEventsPayload>;
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
}

export function createKairoApi(config: {
  baseUrl: string;
  /** Dev: sent as `x-kairo-user-id` for mutating routes until Clerk replaces it. */
  devUserId?: string | null;
}): KairoApi {
  const base = config.baseUrl.trim().replace(/\/$/, "");
  const devUserId = config.devUserId?.trim() || undefined;

  const req = <T>(path: string, o: { method?: HttpMethod; json?: unknown } = {}) =>
    requestEnvelope<T>(base, path, { ...o, devUserId });

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
  };
}

/**
 * Builds a client from `EXPO_PUBLIC_API_URL` / `expo.extra.apiUrl` and optional dev user id.
 * @throws {KairoApiConfigurationError} when no base URL is configured.
 */
export function createKairoApiFromEnv(overrides?: {
  baseUrl?: string;
  devUserId?: string | null;
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
  const devUserId =
    overrides && "devUserId" in overrides ? overrides.devUserId : getDevUserId();

  return createKairoApi({ baseUrl, devUserId });
}
