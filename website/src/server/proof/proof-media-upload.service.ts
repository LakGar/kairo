import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomBytes } from "crypto";

import { prisma } from "@/lib/db";
import { err, ok, type Result } from "@/src/lib/result";
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

type StorageEnv =
  | { ok: false; message: string }
  | {
      ok: true;
      bucket: string;
      region: string;
      accessKeyId: string;
      secretAccessKey: string;
      endpoint: string | undefined;
      publicBaseUrl: string;
      forcePathStyle: boolean;
    };

function readProofStorageEnv(): StorageEnv {
  const bucket = process.env.PROOF_STORAGE_BUCKET?.trim();
  const accessKeyId = process.env.PROOF_STORAGE_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.PROOF_STORAGE_SECRET_ACCESS_KEY?.trim();
  const publicBaseUrl = process.env.PROOF_STORAGE_PUBLIC_BASE_URL?.trim();
  const endpoint = process.env.PROOF_STORAGE_ENDPOINT?.trim() || undefined;
  const regionRaw = process.env.PROOF_STORAGE_REGION?.trim();

  if (!bucket || !accessKeyId || !secretAccessKey || !publicBaseUrl) {
    return {
      ok: false,
      message:
        "Proof object storage is not configured. Set PROOF_STORAGE_BUCKET, PROOF_STORAGE_ACCESS_KEY_ID, PROOF_STORAGE_SECRET_ACCESS_KEY, and PROOF_STORAGE_PUBLIC_BASE_URL (see website/.env.example).",
    };
  }

  const region =
    regionRaw ||
    (endpoint ? "auto" : "us-east-1");

  return {
    ok: true,
    bucket,
    region,
    accessKeyId,
    secretAccessKey,
    endpoint,
    publicBaseUrl,
    forcePathStyle: Boolean(endpoint),
  };
}

/**
 * Returns a presigned PUT URL and the eventual HTTPS public URL for proof media.
 * TODO: virus scanning / content moderation before treating uploads as trusted.
 * TODO: verify participant is allowed to upload for this event (currently only checks event exists).
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

  const storage = readProofStorageEnv();
  if (!storage.ok) {
    return err(storage.message, "NOT_CONFIGURED");
  }

  const event = await prisma.event.findUnique({
    where: { id: d.eventId },
    select: { id: true },
  });
  if (!event) {
    return err("Event not found", "NOT_FOUND");
  }

  const ext = extensionForContentType(d.contentType);
  const nonce = randomBytes(10).toString("hex");
  const key = `proof/${d.eventId}/${userId}/${Date.now()}-${nonce}.${ext}`;

  const client = new S3Client({
    region: storage.region,
    endpoint: storage.endpoint,
    credentials: {
      accessKeyId: storage.accessKeyId,
      secretAccessKey: storage.secretAccessKey,
    },
    forcePathStyle: storage.forcePathStyle,
  });

  const command = new PutObjectCommand({
    Bucket: storage.bucket,
    Key: key,
    ContentType: d.contentType,
    ...(d.fileSize !== undefined ? { ContentLength: d.fileSize } : {}),
  });

  const uploadUrl = await getSignedUrl(client, command, { expiresIn: 3600 });
  const publicUrl = `${storage.publicBaseUrl.replace(/\/$/, "")}/${key}`;

  const headers: Record<string, string> = {
    "Content-Type": d.contentType,
  };
  if (d.fileSize !== undefined) {
    headers["Content-Length"] = String(d.fileSize);
  }

  return ok({
    uploadUrl,
    publicUrl,
    method: "PUT",
    headers,
  });
}
