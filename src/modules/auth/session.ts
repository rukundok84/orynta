import "server-only";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";

/**
 * Stateless session management: a signed JWT stored in an httpOnly cookie.
 *
 * The cookie name matches the `oryntra_session` stub the app was built with.
 * The cookie only carries the user id — everything else (name, email) is
 * fetched fresh from the database in the DAL, so a renamed user is never
 * stale and revoking access is just deleting the user row.
 */

export const SESSION_COOKIE = "oryntra_session";
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // one week

type SessionPayload = {
  userId: string;
};

function getEncodedKey() {
  const secretKey = process.env.SESSION_SECRET;
  if (!secretKey) {
    throw new Error(
      "SESSION_SECRET is not set. Add it to .env (e.g. `openssl rand -base64 32`).",
    );
  }
  return new TextEncoder().encode(secretKey);
}

export async function encrypt(payload: SessionPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getEncodedKey());
}

/** Verifies the signature and expiry. Returns null for anything invalid. */
export async function decrypt(
  session: string | undefined,
): Promise<SessionPayload | null> {
  if (!session) return null;
  try {
    const { payload } = await jwtVerify(session, getEncodedKey(), {
      algorithms: ["HS256"],
    });
    return payload as SessionPayload;
  } catch {
    return null;
  }
}

export async function getSessionCookie(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE)?.value;
}

export async function createSession(userId: string): Promise<void> {
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
  const session = await encrypt({ userId });
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE, session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    sameSite: "lax",
    path: "/",
  });
}

export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}
