import { useAuth, useUser } from "@clerk/expo";
import { useEffect, useRef } from "react";

import {
  clearBootstrappedUserId,
  loadBootstrappedContext,
  postAuthBootstrap,
  saveBootstrappedContext,
  setBootstrappedUserIdSync,
} from "@/src/api";

/**
 * After Clerk session is ready, upserts Prisma `User` via `POST /api/auth/bootstrap`
 * and persists `User.id` for `x-kairo-user-id` (see `resolveActingUserId`).
 * No UI; logs failures in `__DEV__` only.
 */
export function useBootstrapKairoUser() {
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const bootstrappedClerkId = useRef<string | null>(null);

  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn) {
      bootstrappedClerkId.current = null;
      void clearBootstrappedUserId();
      return;
    }

    if (!user) {
      return;
    }

    let cancelled = false;

    void (async () => {
      const ctx = await loadBootstrappedContext();
      if (cancelled) return;

      if (ctx?.clerkUserId === user.id) {
        setBootstrappedUserIdSync(ctx.prismaUserId);
      } else if (ctx && ctx.clerkUserId !== user.id) {
        await clearBootstrappedUserId();
      }

      if (bootstrappedClerkId.current === user.id) return;

      const email = user.primaryEmailAddress?.emailAddress?.trim();
      if (!email) {
        if (__DEV__) {
          console.warn("[Kairo] Bootstrap skipped: Clerk user has no primary email.");
        }
        return;
      }

      try {
        const data = await postAuthBootstrap({
          clerkUserId: user.id,
          email,
          name: user.fullName?.trim() || null,
          username: user.username?.trim() || null,
          avatarUrl: user.imageUrl?.trim() || null,
        });
        await saveBootstrappedContext({
          prismaUserId: data.userId,
          clerkUserId: user.id,
        });
        if (!cancelled) {
          setBootstrappedUserIdSync(data.userId);
          bootstrappedClerkId.current = user.id;
        }
      } catch (e) {
        if (__DEV__) console.warn("[Kairo] Bootstrap failed:", e);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isLoaded, isSignedIn, user]);
}
