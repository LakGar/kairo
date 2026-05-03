import { prisma } from "@/lib/db";

export async function queryStakesForEvent(eventId: string) {
  return prisma.stake.findMany({
    where: { eventId },
    include: {
      match: { select: { id: true, round: true, matchNumber: true, status: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function queryStakesForMatch(matchId: string) {
  return prisma.stake.findMany({
    where: { matchId },
    orderBy: { createdAt: "desc" },
  });
}

export async function queryStakeById(id: string) {
  return prisma.stake.findUnique({
    where: { id },
    include: {
      event: { select: { id: true, organizerId: true } },
    },
  });
}
