import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE, decrypt } from "@/modules/auth/session";

/**
 * Next.js 16's middleware (the `middleware` file convention is renamed
 * `proxy`). Runs before any route renders, so signed-out visitors are sent
 * to /login before they can see or do anything else.
 *
 * This is the *optimistic* check: it only reads the cookie and verifies the
 * JWT signature — no database lookups, because proxy runs on every request,
 * including prefetches. The *secure* check against the database lives in the
 * Data Access Layer (src/modules/auth/dal.ts), close to the data.
 */

// The only pages reachable without an account.
const PUBLIC_ROUTES = ["/login", "/signup"];

export default async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isPublicRoute = PUBLIC_ROUTES.includes(pathname);

  const cookie = req.cookies.get(SESSION_COOKIE)?.value;
  const session = await decrypt(cookie);
  const isAuthed = Boolean(session?.userId);

  // Signed-out users may only see the auth pages.
  if (!isAuthed && !isPublicRoute) {
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }

  // Signed-in users don't need the auth pages.
  if (isAuthed && isPublicRoute) {
    return NextResponse.redirect(new URL("/", req.nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  // Run on every route except API routes and static assets.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$).*)"],
};
