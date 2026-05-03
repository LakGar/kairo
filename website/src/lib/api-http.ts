import { NextResponse } from "next/server";

import { getCurrentUserIdFromRequest } from "@/src/lib/current-user";
import type { Result } from "@/src/lib/result";

export function jsonError(message: string, code: string, status: number) {
  return NextResponse.json({ success: false, error: { message, code } }, { status });
}

function mapCodeToHttpStatus(code: string): number {
  switch (code) {
    case "NOT_FOUND":
      return 404;
    case "FORBIDDEN":
      return 403;
    case "UNAUTHORIZED":
      return 401;
    case "VALIDATION_ERROR":
    case "BAD_STATE":
      return 400;
    case "CONFLICT":
    case "CAPACITY":
      return 409;
    default:
      return 500;
  }
}

export function fromServiceResult<T>(
  result: Result<T>,
  successStatus = 200,
): NextResponse {
  if (result.success) {
    return NextResponse.json(
      { success: true, data: result.data },
      { status: successStatus },
    );
  }
  const { message, code } = result.error;
  return NextResponse.json(
    { success: false, error: { message, code } },
    { status: mapCodeToHttpStatus(code) },
  );
}

/**
 * Dev-only user resolution until Clerk (or similar) is wired for the website.
 * TODO: replace with Clerk `auth()` and remove reliance on `x-kairo-user-id`.
 */
export function requireUserId(request: Request):
  | { ok: true; userId: string }
  | { ok: false; response: NextResponse } {
  const userId = getCurrentUserIdFromRequest(request);
  if (!userId) {
    return {
      ok: false,
      response: jsonError(
        "Missing identity header. Send x-kairo-user-id with a valid User id (dev). TODO: Clerk session.",
        "UNAUTHORIZED",
        401,
      ),
    };
  }
  return { ok: true, userId };
}

export async function parseJsonBody(request: Request): Promise<unknown | NextResponse> {
  try {
    const text = await request.text();
    if (!text.trim()) return {};
    return JSON.parse(text) as unknown;
  } catch {
    return jsonError("Invalid JSON body", "VALIDATION_ERROR", 400);
  }
}
