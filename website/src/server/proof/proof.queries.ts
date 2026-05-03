import { prisma } from "@/lib/db";

export async function queryProofSubmissionsForEvent(eventId: string) {
  return prisma.proofSubmission.findMany({
    where: { eventId },
    include: {
      user: { select: { id: true, email: true, profile: true } },
      prompt: { select: { id: true, title: true, proofType: true } },
      match: { select: { id: true, round: true, matchNumber: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function queryProofSubmissionsForMatch(matchId: string) {
  return prisma.proofSubmission.findMany({
    where: { matchId },
    include: {
      user: { select: { id: true, email: true, profile: true } },
      prompt: { select: { id: true, title: true, proofType: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function queryProofSubmissionById(id: string) {
  return prisma.proofSubmission.findUnique({
    where: { id },
    include: {
      event: { select: { id: true, organizerId: true } },
      user: { select: { id: true } },
    },
  });
}
