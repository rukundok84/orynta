import { db } from "@/modules/db/client";

/**
 * GET /api/health
 *
 * A health check: proves the app can reach PostgreSQL through Prisma.
 * Route Handlers in Next.js live in `route.ts` files and export one async
 * function per HTTP method (GET, POST, ...). They use the standard Web
 * `Request`/`Response` APIs.
 */
export async function GET() {
  try {
    // `$queryRaw` sends literal SQL. `SELECT 1` is the universal
    // "is the connection alive?" probe — it touches no application data.
    await db.$queryRaw`SELECT 1`;

    return Response.json({
      status: "ok",
      database: "connected",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Health check failed:", error);

    return Response.json(
      {
        status: "error",
        database: "unreachable",
        timestamp: new Date().toISOString(),
      },
      { status: 503 },
    );
  }
}
