import { prisma } from "@/lib/db";

export async function queryMatchesForEvent(eventId: string) {
  return prisma.match.findMany({
    where: { eventId },
    include: {
      homeTeam: true,
      awayTeam: true,
      winnerTeam: true,
      bracket: { select: { id: true, name: true } },
    },
    orderBy: [{ round: "asc" }, { matchNumber: "asc" }, { scheduledAt: "asc" }],
  });
}

export async function queryMatchById(matchId: string) {
  return prisma.match.findUnique({
    where: { id: matchId },
    include: {
      event: { select: { id: true, organizerId: true } },
      homeTeam: true,
      awayTeam: true,
      winnerTeam: true,
      bracket: { select: { id: true, name: true } },
    },
  });
}
