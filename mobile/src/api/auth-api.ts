import { getApiBaseUrl } from "./config";
import { KairoApiConfigurationError, KairoApiError, type ApiEnvelope } from "./types";
import type { AuthBootstrapRequestInput } from "@kairo/shared";

export type AuthBootstrapProfileDto = {
  id: string;
  userId: string;
  name: string | null;
  username: string | null;
  avatarUrl: string | null;
  bio: string | null;
};

export type AuthBootstrapResponse = {
  userId: string;
  clerkUserId: string;
  email: string;
  profile: AuthBootstrapProfileDto | null;
};

/**
 * `POST /api/auth/bootstrap` — no `x-kairo-user-id`; server trusts body (see route TODOs).
 */
export async function postAuthBootstrap(
  body: AuthBootstrapRequestInput,
): Promise<AuthBootstrapResponse> {
  const baseUrl = getApiBaseUrl().trim().replace(/\/$/, "");
  if (!baseUrl) {
    throw new KairoApiConfigurationError(
      "Missing API base URL. Set EXPO_PUBLIC_API_URL in mobile/.env (see .env.example), or pass overrides.baseUrl.",
    );
  }

  const url = `${baseUrl}/api/auth/bootstrap`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
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

  const envelope = parsed as ApiEnvelope<AuthBootstrapResponse>;
  if (!envelope.success) {
    throw new KairoApiError(
      envelope.error.message,
      envelope.error.code,
      res.status,
    );
  }
  return envelope.data;
}
