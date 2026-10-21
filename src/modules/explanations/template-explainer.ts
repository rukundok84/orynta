import type { ExplanationFactPack, ExplanationResult } from "./types";

/**
 * Template explainer — 100% deterministic, zero cost, works offline.
 *
 * This is the always-available fallback. It composes plain English strictly
 * from the fact pack; it cannot mention anything that isn't in the pack.
 * If the AI layer is unavailable (no key, rate limit, network down), the
 * user still gets a useful — if less fluent — explanation.
 */
export function explainWithTemplate(pack: ExplanationFactPack): ExplanationResult {
  const lines: string[] = [];

  // --- Sentence 1: what we understood -------------------------------------
  lines.push(
    `ORYNTA understood your goal as: “${pack.rawGoal}” — parsed as ${pack.criteriaSummary}.`,
  );

  // --- Sentence 2: what we found ------------------------------------------
  if (pack.matchedCount === 0) {
    lines.push(
      `Out of ${pack.scannedCount} records scanned, nothing matched all of your constraints. ` +
        `The filter rules are strict on purpose: over-budget options, wrong provinces, and ` +
        `records with no connection to your stated purpose are excluded rather than padded in.`,
    );
  } else {
    const top = pack.facts[0];
    lines.push(
      `Out of ${pack.scannedCount} records scanned, ${pack.matchedCount} matched. ` +
        `The strongest fit is ${top.name} (${top.category}, ${top.province}, ${top.priceLabel}) — ` +
        `${top.topReasons[0] ?? "highest overall score"}`,
    );
    if (pack.facts.length > 1) {
      const runnerUps = pack.facts
        .slice(1, 3)
        .map((f) => `${f.name} (${f.province}, ${f.priceLabel})`)
        .join("; ");
      lines.push(`Other strong matches: ${runnerUps}.`);
    }
  }

  // --- Sentence 3: real-world context (only if we have published data) -----
  if (pack.tourismContext) {
    lines.push(`For context from published statistics: ${pack.tourismContext}`);
  }

  // --- Closing: honest caveat + next step ---------------------------------
  const sampleWarning = pack.facts.some((f) => f.isSample)
    ? " Some records are labelled as development samples — treat their details as unverified until confirmed with the source."
    : "";
  lines.push(
    `Always verify current details (price, dates, eligibility) directly with the listed source before committing.${sampleWarning}`,
  );

  return {
    text: lines.join(" "),
    provider: "template",
    model: null,
    disclaimer:
      "Rule-based summary generated offline from the same data as your results — no AI involved.",
    generatedAt: new Date().toISOString(),
  };
}
