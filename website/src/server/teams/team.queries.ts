import { prisma } from "@/lib/db";

export async function queryTeamsForEvent(eventId: string) {
  return prisma.team.findMany({
    where: { eventId },
    include: {
      captain: { select: { id: true, email: true, profile: true } },
      members: {
        include: {
          user: { select: { id: true, email: true, profile: true } },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });
}

export async function queryTeamById(teamId: string) {
  return prisma.team.findUnique({
    where: { id: teamId },
    include: {
      event: { select: { id: true, organizerId: true, title: true } },
      captain: { select: { id: true, email: true, profile: true } },
      members: {
        include: {
          user: { select: { id: true, email: true, profile: true } },
        },
      },
    },
  });
}
