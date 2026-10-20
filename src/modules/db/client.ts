import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

/**
 * Creates a Prisma Client wired to PostgreSQL through the `pg` driver adapter.
 *
 * Prisma 7 no longer ships its own database driver — it delegates connections
 * to a driver adapter package (`@prisma/adapter-pg` for PostgreSQL, backed by
 * the popular `pg` npm package). The adapter and client versions must match
 * the Prisma major version (7.x here).
 */
function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Copy .env.example to .env and fill in your database credentials.",
    );
  }

  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
}

/**
 * Global singleton.
 *
 * In Next.js development mode, hot-reloading can re-evaluate this module many
 * times. Without this guard every reload would create a NEW PrismaClient,
 * each holding its own connection pool, until PostgreSQL runs out of
 * connections. Storing the instance on `globalThis` survives module reloads.
 * In production there is no hot-reloading, so the guard is skipped.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
