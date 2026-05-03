import { ProofStatus, RegistrationStatus } from "@prisma/client";

import { prisma } from "@/lib/db";
import { err, ok, type Result } from "@/src/lib/result";
import { ActivityAction } from "@/server/activity/activity-actions";
import { logActivity } from "@/server/activity/activity.service";
import {
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

async function assertCanSubmitProof(eventId: string, userId: string) {
  const p = await prisma.eventParticipant.findFirst({
    where: {
      eventId,
      userId,
      status: { in: [RegistrationStatus.APPROVED, RegistrationStatus.PENDING] },
    },
  });
  if (!p) {
    return err("You must join the event before submitting proof", "FORBIDDEN");
  }
  return ok(null);
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

  const can = await assertCanSubmitProof(eventId, currentUserId);
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

  return ok({ id: updated.id, status: updated.status });
}

export async function getProofForEvent(eventId: string) {
  const list = await queryProofSubmissionsForEvent(eventId);
  return ok(list);
}

export async function getProofForMatch(matchId: string) {
  const list = await queryProofSubmissionsForMatch(matchId);
  return ok(list);
}
