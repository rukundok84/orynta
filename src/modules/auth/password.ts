import "server-only";
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

/**
 * Simple password hashing with Node's built-in scrypt — no extra dependency.
 *
 * Stored format: `scrypt:<salt hex>:<hash hex>`
 * The salt is random per user, and verification uses a timing-safe compare
 * so password checks can't be shortened by measuring response time.
 */

const KEY_LENGTH = 64;

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, KEY_LENGTH).toString("hex");
  return `scrypt:${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [scheme, salt, expectedHex] = stored.split(":");
  if (scheme !== "scrypt" || !salt || !expectedHex) {
    return false;
  }

  const expected = Buffer.from(expectedHex, "hex");
  const candidate = scryptSync(password, salt, KEY_LENGTH);

  return (
    candidate.length === expected.length && timingSafeEqual(candidate, expected)
  );
}
