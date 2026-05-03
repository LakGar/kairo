import { StakeStatus } from "@prisma/client";

import { prisma } from "@/lib/db";
import { err, ok, type Result } from "@/src/lib/result";
import { ActivityAction } from "@/server/activity/activity-actions";
import { logActivity } from "@/server/activity/activity.service";
import {
  queryStakeById,
  queryStakesForEvent,
  queryStakesForMatch,
} from "@/server/stakes/stake.queries";
import { parseCreateStake } from "@/server/stakes/stake.validators";

async function assertOrganizer(eventId: string, userId: string) {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { organizerId: true },
  });
  if (!event) return err("Event not found", "NOT_FOUND");
  if (event.organizerId !== userId) {
    return err("Only the organizer can manage stakes", "FORBIDDEN");
  }
  return ok(null);
}

export async function createStake(
  eventId: string,
  input: unknown,
  currentUserId: string,
) {
  const org = await assertOrganizer(eventId, currentUserId);
  if (!org.success) return org;

  const parsed = parseCreateStake(input);
  if (!parsed.success) {
    const msg = parsed.error.flatten().fieldErrors
      ? JSON.stringify(parsed.error.flatten().fieldErrors)
      : parsed.error.message;
    return err(msg, "VALIDATION_ERROR");
  }
  const d = parsed.data;

  if (d.matchId) {
    const m = await prisma.match.findFirst({
      where: { id: d.matchId, eventId },
    });
    if (!m) return err("Match not found for this event", "NOT_FOUND");
  }

  const stake = await prisma.stake.create({
    data: {
      eventId,
      matchId: d.matchId ?? undefined,
      type: d.type,
      title: d.title,
      description: d.description?.trim() || null,
      amountCents: d.amountCents ?? null,
      currency: d.currency ?? "USD",
      status: StakeStatus.PENDING,
    },
  });

  await logActivity({
    eventId,
    userId: currentUserId,
    action: ActivityAction.STAKE_CREATED,
    metadata: { stakeId: stake.id },
  });

  return ok(stake);
}

async function updateStakeStatus(
  stakeId: string,
  currentUserId: string,
  status: StakeStatus,
  action: string,
): Promise<Result<{ id: string; status: StakeStatus }>> {
  const stake = await queryStakeById(stakeId);
  if (!stake) return err("Stake not found", "NOT_FOUND");

  const org = await assertOrganizer(stake.eventId, currentUserId);
  if (!org.success) return org;

  const updated = await prisma.stake.update({
    where: { id: stakeId },
    data: { status },
  });

  await logActivity({
    eventId: stake.eventId,
    userId: currentUserId,
    action,
    metadata: { stakeId },
  });

  return ok({ id: updated.id, status: updated.status });
}

export async function markStakeCompleted(
  stakeId: string,
  currentUserId: string,
) {
  return updateStakeStatus(
    stakeId,
    currentUserId,
    StakeStatus.COMPLETED,
    ActivityAction.STAKE_COMPLETED,
  );
}

export async function markStakeFailed(stakeId: string, currentUserId: string) {
  return updateStakeStatus(
    stakeId,
    currentUserId,
    StakeStatus.FAILED,
    ActivityAction.STAKE_FAILED,
  );
}

export async function getStakesForEvent(eventId: string) {
  const list = await queryStakesForEvent(eventId);
  return ok(list);
}

export async function getStakesForMatch(matchId: string) {
  const list = await queryStakesForMatch(matchId);
  return ok(list);
}
