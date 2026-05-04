import { ProofStatus, RegistrationStatus } from "@prisma/client";

import { prisma } from "@/lib/db";
import { err, ok, type Result } from "@/src/lib/result";
import { ActivityAction } from "@/server/activity/activity-actions";
import { logActivity } from "@/server/activity/activity.service";
import { sendPushToUsersBestEffort } from "@/server/notifications/push-triggers";
import {
  queryProofPromptsForEvent,
  queryProofSubmissionById,
  queryProofSubmissionsForEvent,
  queryProofSubmissionsForMatch,
} from "@/server/proof/proof.queries";
import {
  parseCreateProofPrompt,
  parseSubmitProof,
} from "@/server/proof/proof.validators";

async function assertOrganizer(eventId: string, userId: string) {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { organizerId: true },
  });
  if (!event) return err("Event not found", "NOT_FOUND");
  if (event.organizerId !== userId) {
    return err("Only the organizer can perform this action", "FORBIDDEN");
  }
  return ok(null);
}

/** Organizer or APPROVED participant may request proof-media upload URLs and submit proof. */
export async function assertUserMaySubmitProofForEvent(
  eventId: string,
  userId: string,
): Promise<Result<null>> {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { organizerId: true },
  });
  if (!event) return err("Event not found", "NOT_FOUND");
  if (event.organizerId === userId) return ok(null);

  const participant = await prisma.eventParticipant.findFirst({
    where: {
      eventId,
      userId,
      status: RegistrationStatus.APPROVED,
    },
  });
  if (!participant) {
    return err("You must be part of this event to submit proof.", "FORBIDDEN");
  }
  return ok(null);
}

function isLocalhostHttpUrl(u: URL): boolean {
  if (u.protocol !== "http:") return false;
  const h = u.hostname.toLowerCase();
  return h === "localhost" || h === "127.0.0.1" || h === "[::1]";
}

export async function createProofPrompt(
  eventId: string,
  input: unknown,
  currentUserId: string,
) {
  const org = await assertOrganizer(eventId, currentUserId);
  if (!org.success) return org;

  const parsed = parseCreateProofPrompt(input);
  if (!parsed.success) {
    const msg = parsed.error.flatten().fieldErrors
      ? JSON.stringify(parsed.error.flatten().fieldErrors)
      : parsed.error.message;
    return err(msg, "VALIDATION_ERROR");
  }
  const d = parsed.data;

  const prompt = await prisma.proofPrompt.create({
    data: {
      eventId,
      title: d.title,
      description: d.description?.trim() || null,
      proofType: d.proofType,
      isRequired: d.isRequired ?? false,
    },
  });

  await logActivity({
    eventId,
    userId: currentUserId,
    action: ActivityAction.PROOF_PROMPT_CREATED,
    metadata: { promptId: prompt.id },
  });

  return ok(prompt);
}

// TODO(proof media): virus scanning; content moderation; EXIF/location metadata policy;
// TODO(proof media): delete orphan storage objects when submitProof fails after a successful upload.
export async function submitProof(
  eventId: string,
  input: unknown,
  currentUserId: string,
) {
  const parsed = parseSubmitProof(input);
  if (!parsed.success) {
    const msg = parsed.error.flatten().fieldErrors
      ? JSON.stringify(parsed.error.flatten().fieldErrors)
      : parsed.error.message;
    return err(msg, "VALIDATION_ERROR");
  }
  const d = parsed.data;
  if (d.eventId !== eventId) {
    return err("eventId mismatch", "VALIDATION_ERROR");
  }

  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) return err("Event not found", "NOT_FOUND");

  const can = await assertUserMaySubmitProofForEvent(eventId, currentUserId);
  if (!can.success) return can;

  if (d.matchId) {
    const m = await prisma.match.findFirst({
      where: { id: d.matchId, eventId },
    });
    if (!m) return err("Match not found for this event", "NOT_FOUND");
  }
  if (d.promptId) {
    const pr = await prisma.proofPrompt.findFirst({
      where: { id: d.promptId, eventId },
    });
    if (!pr) return err("Proof prompt not found for this event", "NOT_FOUND");
  }

  const urlTrim = d.url?.trim() ?? "";
  const isProd = process.env.NODE_ENV === "production";
  const allowFileUrl =
    process.env.PROOF_ALLOW_FILE_URL === "1" && !isProd;

  if (d.type === "PHOTO" || d.type === "VIDEO") {
    if (!urlTrim) {
      return err("PHOTO and VIDEO proof require a media URL.", "VALIDATION_ERROR");
    }
    try {
      const u = new URL(urlTrim);
      if (u.protocol === "file:") {
        if (isProd) {
          return err(
            "PHOTO and VIDEO proof must use an HTTPS URL from the upload flow (file URLs are not allowed in production).",
            "VALIDATION_ERROR",
          );
        }
        if (!allowFileUrl) {
          return err(
            "Temporary file:// URLs are disabled. Use the in-app upload flow, or set PROOF_ALLOW_FILE_URL=1 for trusted local development only.",
            "VALIDATION_ERROR",
          );
        }
      } else if (u.protocol === "https:") {
        // preferred durable URL
      } else if (u.protocol === "http:") {
        if (isProd) {
          return err(
            "PHOTO and VIDEO proof must use an HTTPS URL in production.",
            "VALIDATION_ERROR",
          );
        }
        if (!isLocalhostHttpUrl(u)) {
          return err(
            "PHOTO and VIDEO http:// URLs are only allowed for localhost in non-production (e.g. local MinIO). Use https in production.",
            "VALIDATION_ERROR",
          );
        }
      } else {
        return err(
          "Proof media URL must be https, or file:// when explicitly allowed for local dev.",
          "VALIDATION_ERROR",
        );
      }
    } catch {
      return err("Invalid proof media URL.", "VALIDATION_ERROR");
    }
  }

  const submission = await prisma.proofSubmission.create({
    data: {
      eventId,
      matchId: d.matchId ?? undefined,
      promptId: d.promptId ?? undefined,
      userId: currentUserId,
      type: d.type,
      url: d.url?.trim() || null,
      text: d.text?.trim() || null,
      status: ProofStatus.PENDING,
    },
  });

  await logActivity({
    eventId,
    userId: currentUserId,
    action: ActivityAction.PROOF_SUBMITTED,
    metadata: { proofSubmissionId: submission.id },
  });

  const organizerId = event.organizerId;
  if (organizerId && organizerId !== currentUserId) {
    try {
      const data: Record<string, string> = {
        type: "REVIEW_PROOF",
        eventId,
        proofSubmissionId: submission.id,
        focus: "organizer",
      };
      if (d.matchId) data.matchId = d.matchId;
      await sendPushToUsersBestEffort([organizerId], {
        title: "Proof needs review",
        body: "A participant submitted proof for your event.",
        data,
      });
    } catch (e) {
      console.warn("[push] proof submitted notify", e instanceof Error ? e.message : e);
    }
  }

  return ok(submission);
}

export async function approveProof(
  proofSubmissionId: string,
  currentUserId: string,
) {
  return setProofReviewStatus(
    proofSubmissionId,
    currentUserId,
    ProofStatus.APPROVED,
    ActivityAction.PROOF_APPROVED,
  );
}

export async function rejectProof(
  proofSubmissionId: string,
  currentUserId: string,
) {
  return setProofReviewStatus(
    proofSubmissionId,
    currentUserId,
    ProofStatus.REJECTED,
    ActivityAction.PROOF_REJECTED,
  );
}

async function setProofReviewStatus(
  proofSubmissionId: string,
  currentUserId: string,
  status: ProofStatus,
  action: string,
): Promise<Result<{ id: string; status: ProofStatus }>> {
  const sub = await queryProofSubmissionById(proofSubmissionId);
  if (!sub) return err("Proof submission not found", "NOT_FOUND");

  const org = await assertOrganizer(sub.eventId, currentUserId);
  if (!org.success) return org;

  const updated = await prisma.proofSubmission.update({
    where: { id: proofSubmissionId },
    data: { status },
  });

  await logActivity({
    eventId: sub.eventId,
    userId: currentUserId,
    action,
    metadata: { proofSubmissionId },
  });

  const submitterId = sub.user.id;
  if (submitterId) {
    try {
      const approved = status === ProofStatus.APPROVED;
      const data: Record<string, string> = {
        type: approved ? "PROOF_APPROVED" : "PROOF_REJECTED",
        eventId: sub.eventId,
        proofSubmissionId,
        focus: "proof",
      };
      if (sub.matchId) data.matchId = sub.matchId;
      await sendPushToUsersBestEffort([submitterId], {
        title: approved ? "Proof approved" : "Proof rejected",
        body: approved
          ? "Your proof was approved."
          : "Your proof was rejected. Review the event for details.",
        data,
      });
    } catch (e) {
      console.warn("[push] proof review notify", e instanceof Error ? e.message : e);
    }
  }

  return ok({ id: updated.id, status: updated.status });
}

export async function getProofPromptsForEvent(eventId: string) {
  const list = await queryProofPromptsForEvent(eventId);
  return ok(list);
}

export async function getProofForEvent(eventId: string) {
  const list = await queryProofSubmissionsForEvent(eventId);
  return ok(list);
}

export async function getProofForMatch(matchId: string) {
  const list = await queryProofSubmissionsForMatch(matchId);
  return ok(list);
}
