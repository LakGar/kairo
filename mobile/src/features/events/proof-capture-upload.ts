import { File } from "expo-file-system";

import type { KairoApi } from "@/src/api/kairo-client";

import type { ProofCaptureMode } from "./proof-capture.types";
import type { ProofMediaContentType, ProofMediaUploadRequestInput } from "@kairo/shared";

export function inferProofMediaContentType(
  uri: string,
  proofType: ProofCaptureMode,
): ProofMediaContentType {
  const lower = uri.toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".mov")) return "video/quicktime";
  if (lower.endsWith(".mp4")) return "video/mp4";
  return proofType === "VIDEO" ? "video/mp4" : "image/jpeg";
}

/**
 * Presigned PUT to object storage, then returns the public HTTPS URL for `submitProof`.
 * TODO: If `submitProof` fails after this succeeds, delete the orphan object (lifecycle rule or explicit delete API).
 */
export async function uploadCapturedProofToStorage(params: {
  api: KairoApi;
  eventId: string;
  localUri: string;
  proofType: ProofCaptureMode;
  promptId: string | null;
  matchId: string | null;
}): Promise<string> {
  const { api, eventId, localUri, proofType, promptId, matchId } = params;
  const file = new File(localUri);
  if (!file.exists) {
    throw new Error("Captured file is missing.");
  }
  const fileSize = file.size;
  if (fileSize <= 0) {
    throw new Error("Captured file is empty.");
  }

  const contentType = inferProofMediaContentType(localUri, proofType);
  const body: ProofMediaUploadRequestInput = {
    eventId,
    proofType,
    contentType,
    fileSize,
    promptId,
    matchId,
  };

  const instructions = await api.createProofMediaUploadUrl(body);

  const headers = new Headers();
  for (const [k, v] of Object.entries(instructions.headers)) {
    headers.set(k, v);
  }

  const putRes = await fetch(instructions.uploadUrl, {
    method: instructions.method,
    headers,
    body: file as unknown as Blob,
  });

  if (!putRes.ok) {
    const hint = await putRes.text();
    throw new Error(`Upload failed (${putRes.status}). ${hint.slice(0, 200)}`);
  }

  return instructions.publicUrl;
}
