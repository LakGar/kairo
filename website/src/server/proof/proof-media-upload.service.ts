import { createClient } from "@supabase/supabase-js";
import { randomBytes } from "crypto";

import { prisma } from "@/lib/db";
import { err, ok, type Result } from "@/src/lib/result";
import { assertUserMaySubmitProofForEvent } from "@/server/proof/proof.service";
import {
  proofMediaUploadRequestSchema,
  type ProofMediaUploadInstructions,
} from "@kairo/shared";

function extensionForContentType(ct: string): string {
  switch (ct) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "video/mp4":
      return "mp4";
    case "video/quicktime":
      return "mov";
    default:
      return "bin";
  }
}

const PHOTO_MAX_BYTES = 10 * 1024 * 1024;
const VIDEO_MAX_BYTES = 100 * 1024 * 1024;

type SupabaseProofEnv =
  | { ok: false; message: string }
  | {
      ok: true;
      supabaseUrl: string;
      serviceRoleKey: string;
      bucket: string;
      publicBaseOverride?: string;
    };

function readProofSupabaseEnv(): SupabaseProofEnv {
  const supabaseUrl = process.env.SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const bucket =
    process.env.SUPABASE_PROOF_BUCKET?.trim() || "kairo-proof-media";
  const publicBaseOverride =
    process.env.SUPABASE_PROOF_PUBLIC_BASE_URL?.trim() || undefined;

  if (!supabaseUrl || !serviceRoleKey) {
    return {
      ok: false,
      message:
        "Proof storage is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (see website/.env.example).",
    };
  }

  return {
    ok: true,
    supabaseUrl,
    serviceRoleKey,
    bucket,
    publicBaseOverride,
  };
}

function applyPublicUrlOriginOverride(
  publicUrl: string,
  overrideBase: string,
): Result<string> {
  try {
    const parsed = new URL(publicUrl);
    const trimmed = overrideBase.replace(/\/$/, "");
    const override = new URL(trimmed.includes("://") ? trimmed : `https://${trimmed}`);
    return ok(`${override.origin}${parsed.pathname}${parsed.search}`);
  } catch {
    return err("Invalid SUPABASE_PROOF_PUBLIC_BASE_URL.", "VALIDATION_ERROR");
  }
}

/**
 * Returns a Supabase Storage signed upload URL and the durable HTTPS public URL for proof media.
 * Upload uses PUT with raw body (ArrayBuffer) per Supabase Storage signed-upload contract.
 *
 * MVP: bucket should allow **public read** for `getPublicUrl` links to work in the app (see docs).
 * Service role key is server-only; mobile never sees it.
 *
 * TODO: virus scanning / content moderation before treating uploads as trusted.
 * TODO: EXIF / location metadata policy (strip or document).
 * TODO: delete orphan storage objects when submitProof fails after upload.
 */
export async function createProofMediaUploadUrl(
  input: unknown,
  userId: string,
): Promise<Result<ProofMediaUploadInstructions>> {
  const parsed = proofMediaUploadRequestSchema.safeParse(input);
  if (!parsed.success) {
    const msg = parsed.error.flatten().fieldErrors
      ? JSON.stringify(parsed.error.flatten().fieldErrors)
      : parsed.error.message;
    return err(msg, "VALIDATION_ERROR");
  }
  const d = parsed.data;

  const maxBytes =
    d.proofType === "PHOTO" ? PHOTO_MAX_BYTES : VIDEO_MAX_BYTES;
  if (d.fileSize > maxBytes) {
    return err(
      d.proofType === "PHOTO"
        ? "Photo must be at most 10 MB."
        : "Video must be at most 100 MB.",
      "VALIDATION_ERROR",
    );
  }

  const env = readProofSupabaseEnv();
  if (!env.ok) {
    return err(env.message, "NOT_CONFIGURED");
  }

  const event = await prisma.event.findUnique({
    where: { id: d.eventId },
    select: { id: true },
  });
  if (!event) {
    return err("Event not found", "NOT_FOUND");
  }

  if (d.matchId) {
    const m = await prisma.match.findFirst({
      where: { id: d.matchId, eventId: d.eventId },
    });
    if (!m) {
      return err("Match not found for this event", "NOT_FOUND");
    }
  }
  if (d.promptId) {
    const pr = await prisma.proofPrompt.findFirst({
      where: { id: d.promptId, eventId: d.eventId },
    });
    if (!pr) {
      return err("Proof prompt not found for this event", "NOT_FOUND");
    }
  }

  const access = await assertUserMaySubmitProofForEvent(d.eventId, userId);
  if (!access.success) return access;

  const ext = extensionForContentType(d.contentType);
  const nonce = randomBytes(10).toString("hex");
  const objectPath = `proof/${d.eventId}/${userId}/${Date.now()}-${nonce}.${ext}`;

  const supabase = createClient(env.supabaseUrl, env.serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });

  const { data: signData, error: signError } = await supabase.storage
    .from(env.bucket)
    .createSignedUploadUrl(objectPath, { upsert: false });

  if (signError || !signData?.signedUrl) {
    return err(
      signError?.message ?? "Could not create signed upload URL.",
      "STORAGE_ERROR",
    );
  }

  const { data: pub } = supabase.storage
    .from(env.bucket)
    .getPublicUrl(objectPath);
  let publicUrl = pub.publicUrl;

  if (env.publicBaseOverride) {
    const overridden = applyPublicUrlOriginOverride(
      publicUrl,
      env.publicBaseOverride,
    );
    if (!overridden.success) return overridden;
    publicUrl = overridden.data;
  }

  const headers: Record<string, string> = {
    "Content-Type": d.contentType,
    "cache-control": "max-age=3600",
    "x-upsert": "false",
  };

  return ok({
    uploadUrl: signData.signedUrl,
    publicUrl,
    method: "PUT",
    headers,
  });
}
