/**
 * Expo Push Notification API (HTTPS) — batching, ticket handling, receipt helper.
 *
 * @see https://docs.expo.dev/push-notifications/sending-notifications/
 *
 * TODO: rate limiting / retries with backoff; honor full per-user notification preferences.
 */
import { prisma, Prisma } from "@/lib/db";
import { isLikelyExpoPushToken } from "@kairo/shared";

const EXPO_PUSH_SEND_URL = "https://exp.host/--/api/v2/push/send";
const EXPO_PUSH_GET_RECEIPTS_URL = "https://exp.host/--/api/v2/push/getReceipts";
/** Expo allows up to 100 messages per send request. */
const EXPO_PUSH_MAX_MESSAGES_PER_REQUEST = 100;
/** Expo allows up to 1000 ticket ids per getReceipts request. */
const EXPO_RECEIPTS_MAX_IDS_PER_REQUEST = 1000;

export type ExpoPushMessage = {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
};

type ExpoPushTicket = {
  status: "ok" | "error";
  id?: string;
  message?: string;
  details?: { error?: string };
};

type ExpoPushSendResponse = {
  data?: ExpoPushTicket | ExpoPushTicket[];
  errors?: unknown[];
};

type ExpoPushReceipt = {
  status: string;
  message?: string;
  details?: { error?: string };
};

type ExpoReceiptsResponse = {
  data?: Record<string, ExpoPushReceipt>;
  errors?: unknown[];
};

export type PushSendItem = {
  message: ExpoPushMessage;
  /** When set, ticket errors map to this row for `DeviceNotRegistered` + {@link checkExpoPushReceipts}. */
  pushTokenId: string | null;
};

function chunkArray<T>(items: T[], size: number): T[][] {
  if (size <= 0) return [items];
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) chunks.push(items.slice(i, i + size));
  return chunks;
}

function normalizeSendTickets(data: ExpoPushSendResponse["data"]): ExpoPushTicket[] {
  if (data == null) return [];
  if (Array.isArray(data)) return data;
  if (typeof data === "object" && "status" in data) return [data as ExpoPushTicket];
  return [];
}

function isDeviceNotRegistered(source: {
  details?: { error?: string };
  message?: string;
}): boolean {
  if (source.details?.error === "DeviceNotRegistered") return true;
  return Boolean(source.message?.includes("DeviceNotRegistered"));
}

function logPushFailure(context: string, ticket: ExpoPushTicket, to: string) {
  const detail = ticket.message ?? ticket.details?.error ?? "unknown";
  console.warn(`[push] ${context} failed for ${to.slice(0, 24)}…: ${detail}`);
}

async function disablePushTokenById(pushTokenId: string): Promise<void> {
  try {
    await prisma.pushToken.update({
      where: { id: pushTokenId },
      data: { enabled: false },
    });
  } catch (e) {
    console.warn(
      "[push] disable token failed",
      pushTokenId,
      e instanceof Error ? e.message : e,
    );
  }
}

async function upsertOkPushTicket(
  ticketId: string,
  pushTokenId: string | null,
  ticket: ExpoPushTicket,
): Promise<void> {
  try {
    await prisma.pushTicket.upsert({
      where: { ticketId },
      create: {
        ticketId,
        pushTokenId,
        status: "ok",
        message: ticket as unknown as Prisma.InputJsonValue,
      },
      update: {
        pushTokenId,
        status: "ok",
        message: ticket as unknown as Prisma.InputJsonValue,
      },
    });
  } catch (e) {
    console.warn("[push] upsert PushTicket failed", e instanceof Error ? e.message : e);
  }
}

/**
 * Sends up to 100 messages per HTTP request. Disables `PushToken` on ticket-level
 * `DeviceNotRegistered` when {@link PushSendItem.pushTokenId} is set. Persists `ok`
 * tickets that include an `id` for {@link checkExpoPushReceipts}.
 */
export async function sendExpoPushMessagesWithMeta(
  items: PushSendItem[],
): Promise<{ attempted: number; succeeded: number }> {
  const attempted = items.length;
  let succeeded = 0;

  const valid: PushSendItem[] = [];
  for (const item of items) {
    if (!isLikelyExpoPushToken(item.message.to)) {
      console.warn("[push] rejected send: invalid Expo push token shape");
      continue;
    }
    valid.push(item);
  }

  for (const batch of chunkArray(valid, EXPO_PUSH_MAX_MESSAGES_PER_REQUEST)) {
    if (batch.length === 0) continue;
    const messages = batch.map((b) => b.message);
    let json: ExpoPushSendResponse;
    try {
      const res = await fetch(EXPO_PUSH_SEND_URL, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(messages),
      });
      if (!res.ok) {
        const t = await res.text().catch(() => "");
        console.warn(`[push] HTTP ${res.status}: ${t.slice(0, 500)}`);
        for (const b of batch) {
          logPushFailure(
            "send-http",
            { status: "error", message: `HTTP ${res.status}` },
            b.message.to,
          );
        }
        continue;
      }
      json = (await res.json()) as ExpoPushSendResponse;
    } catch (e) {
      console.warn("[push] network error", e instanceof Error ? e.message : e);
      continue;
    }

    if (json.errors?.length) {
      console.warn(
        "[push] Expo send returned errors field",
        JSON.stringify(json.errors).slice(0, 300),
      );
    }

    const tickets = normalizeSendTickets(json.data);
    for (let i = 0; i < batch.length; i++) {
      const b = batch[i];
      const ticket =
        tickets[i] ??
        ({ status: "error", message: "missing ticket in Expo response" } as ExpoPushTicket);

      if (ticket.status === "error") {
        if (isDeviceNotRegistered(ticket) && b.pushTokenId) {
          await disablePushTokenById(b.pushTokenId);
        }
        logPushFailure("send", ticket, b.message.to);
        continue;
      }

      if (ticket.status === "ok") {
        succeeded += 1;
        if (ticket.id) {
          await upsertOkPushTicket(ticket.id, b.pushTokenId, ticket);
        }
      }
    }
  }

  return { attempted, succeeded };
}

/**
 * Sends the same alert to all enabled Expo tokens for a user (best-effort; batched HTTP).
 */
export async function sendPushToUser(
  userId: string,
  message: { title: string; body: string; data?: Record<string, unknown> },
): Promise<{ attempted: number; succeeded: number }> {
  const tokens = await prisma.pushToken.findMany({
    where: { userId, enabled: true },
    select: { id: true, token: true },
  });

  const items: PushSendItem[] = tokens.map((row) => ({
    pushTokenId: row.id,
    message: {
      to: row.token,
      title: message.title,
      body: message.body,
      data: message.data,
    },
  }));

  return sendExpoPushMessagesWithMeta(items);
}

export type CheckExpoPushReceiptsResult = {
  requested: number;
  receiptsReturned: number;
  tokensDisabled: number;
  unmappedTicketIds: string[];
};

/**
 * POST `getReceipts` for ticket ids from prior sends. Updates {@link PushTicket} rows;
 * disables tokens on receipt-level `DeviceNotRegistered` when a ticket row maps to `pushTokenId`.
 * Not scheduled yet — call from a job or script when ready.
 */
export async function checkExpoPushReceipts(
  receiptIds: string[],
): Promise<CheckExpoPushReceiptsResult> {
  const unique = [...new Set(receiptIds.filter(Boolean))];
  const unmapped = new Set<string>();
  const result: CheckExpoPushReceiptsResult = {
    requested: unique.length,
    receiptsReturned: 0,
    tokensDisabled: 0,
    unmappedTicketIds: [],
  };

  if (unique.length === 0) return result;

  const seenReturned = new Set<string>();

  for (const chunk of chunkArray(unique, EXPO_RECEIPTS_MAX_IDS_PER_REQUEST)) {
    let json: ExpoReceiptsResponse;
    try {
      const res = await fetch(EXPO_PUSH_GET_RECEIPTS_URL, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ids: chunk }),
      });
      if (!res.ok) {
        const t = await res.text().catch(() => "");
        console.warn(`[push] getReceipts HTTP ${res.status}: ${t.slice(0, 300)}`);
        continue;
      }
      json = (await res.json()) as ExpoReceiptsResponse;
    } catch (e) {
      console.warn("[push] getReceipts network error", e instanceof Error ? e.message : e);
      continue;
    }

    if (json.errors?.length) {
      console.warn(
        "[push] getReceipts errors field",
        JSON.stringify(json.errors).slice(0, 300),
      );
    }

    const map = json.data ?? {};
    for (const [ticketId, receipt] of Object.entries(map)) {
      if (!seenReturned.has(ticketId)) {
        seenReturned.add(ticketId);
        result.receiptsReturned += 1;
      }

      let row: { pushTokenId: string | null } | null;
      try {
        row = await prisma.pushTicket.findUnique({
          where: { ticketId },
          select: { pushTokenId: true },
        });
      } catch (e) {
        console.warn("[push] find PushTicket failed", ticketId, e);
        continue;
      }

      if (!row) {
        unmapped.add(ticketId);
        continue;
      }

      try {
        await prisma.pushTicket.update({
          where: { ticketId },
          data: {
            status: receipt.status,
            message: receipt as unknown as Prisma.InputJsonValue,
          },
        });
      } catch (e) {
        console.warn("[push] update PushTicket from receipt failed", ticketId, e);
      }

      if (
        receipt.status === "error" &&
        isDeviceNotRegistered(receipt) &&
        row.pushTokenId
      ) {
        await disablePushTokenById(row.pushTokenId);
        result.tokensDisabled += 1;
      }
    }
  }

  result.unmappedTicketIds = [...unmapped];
  if (unmapped.size > 0) {
    console.info(
      "[push] getReceipts: ticket ids with no local PushTicket row (cannot disable token)",
      [...unmapped].slice(0, 20),
      unmapped.size > 20 ? `…+${unmapped.size - 20} more` : "",
    );
  }

  return result;
}
