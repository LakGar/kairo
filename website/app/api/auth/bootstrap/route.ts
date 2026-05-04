import { bootstrapClerkUser } from "@/server/auth/bootstrap.service";
import { fromServiceResult, parseJsonBody } from "@/src/lib/api-http";

/**
 * POST /api/auth/bootstrap
 *
 * Mobile sends Clerk identity; website upserts Prisma `User` + `Profile`.
 * TODO(production): Verify Clerk session token (e.g. `@clerk/backend` `verifyToken`) and reject unsigned callers.
 * Current behavior trusts the JSON body — acceptable for local/staging with network isolation; not production-secure.
 */
export async function POST(request: Request) {
  const body = await parseJsonBody(request);
  if (body instanceof Response) return body;

  const result = await bootstrapClerkUser(body);
  return fromServiceResult(result, 200);
}
