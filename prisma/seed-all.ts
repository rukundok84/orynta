/**
 * Seed orchestrator — runs every seed step in order, in one process.
 *
 * Why this file exists: Prisma runs the configured seed command through a
 * shell, and on Windows the `a && b` form did NOT reliably execute the
 * second command — the NISR tourism statistics were silently skipped.
 * Running both steps from a single tsx entry point removes the shell
 * dependency entirely and propagates failures (non-zero exit) so a broken
 * step can never hide behind a success message.
 *
 * Order matters only for readability; the two steps are independent
 * (opportunities vs. tourism statistics) and each is idempotent.
 */
import { spawnSync } from "node:child_process";

const STEPS = [
  "tsx prisma/seed.ts",
  "tsx data/scripts/load-tourism-stats.ts",
] as const;

for (const step of STEPS) {
  console.log(`\n> ${step}`);
  const result = spawnSync(step, { shell: true, stdio: "inherit" });
  if (result.status !== 0) {
    console.error(`\nSeed step failed: ${step}`);
    process.exit(result.status ?? 1);
  }
}

console.log("\nAll seed steps completed.");
