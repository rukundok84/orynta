import "server-only";
import { cache } from "react";
import { db } from "@/modules/db/client";
import { decrypt, getSessionCookie } from "./session";

/**
 * Data Access Layer: the one place that answers "who is making this request?".
 *
 * Two layers of authorization exist in the app:
 *  - src/proxy.ts does the *optimistic* check on the raw cookie (fast, no DB).
 *  - This file does the *secure* check: verify the token, then look the user
 *    up in the database, close to the data it protects.
 */

export type SessionUser = {
  id: string;
  name: string;
  email: string;
};

/**
 * Returns the signed-in user for the current request, or null.
 * Memoized with React's cache() so multiple components in one render pass
 * share a single session read + query.
 *
 * Never throws or redirects — callers decide what a null user means
 * (the proxy already redirects signed-out visitors away from app pages).
 */
export const getUser = cache(async (): Promise<SessionUser | null> => {
  const session = await decrypt(await getSessionCookie());
  if (!session?.userId) return null;

  const user = await db.user.findUnique({
    where: { id: session.userId },
    select: { id: true, name: true, email: true },
  });

  return user;
});
