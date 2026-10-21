import { db } from "@/modules/db/client";
import { labelProvince, formatRwf } from "@/modules/recommendations/format";
import type { SearchOutcome } from "@/modules/recommendations";
import type {
  ExplanationFact,
  ExplanationFactPack,
} from "./types";

/**
 * Builds the "grounding pack" — the complete list of facts an explainer
 * (template or AI) is allowed to mention.
 *
 * Why server-side? The client only ever sends the goal text. The server
 * re-runs the deterministic pipeline itself, so the explainer can never be
 * fed facts that didn't come from our own data + rules. This is the core
 * anti-fabrication guardrail of the whole AI layer.
 */

/** How many top results the explainer may mention (keeps prompts small). */
const TOP_N = 5;

function describeBudget(outcome: SearchOutcome): string {
  const { budget, maxPriceRwf } = outcome.criteria;
  if (budget === "FREE_ONLY") return "free options only (no cost)";
  if (budget === "BUDGET" && maxPriceRwf !== null)
    return `options within ${formatRwf(maxPriceRwf)}`;
  return "no firm budget limit stated";
}

function describePurpose(outcome: SearchOutcome): string {
  const { categories, keywords } = outcome.criteria;
  const parts: string[] = [];
  if (categories.length > 0) parts.push(`purpose: ${categories.join(", ")}`);
  else parts.push("no specific purpose category detected");
  if (keywords.length > 0) parts.push(`interests: ${keywords.join(", ")}`);
  return parts.join("; ");
}

/**
 * Fetches one line of real published context (NISR park visits) so the AI
 * can relate recommendations to verified trends. Returns null if the table
 * is empty — never fabricate a statistic to fill the slot.
 */
async function fetchTourismContext(): Promise<string | null> {
  const latest = await db.tourismStat.findFirst({
    where: { indicator: "National park visits by nationality", subject: "Total (all visitors)" },
    orderBy: { year: "desc" },
  });
  if (!latest) return null;

  const previous = await db.tourismStat.findFirst({
    where: {
      indicator: "National park visits by nationality",
      subject: "Total (all visitors)",
      year: latest.year - 1,
    },
  });

  const base = `National park visits totalled ${latest.value.toLocaleString("en-US")} in ${latest.year} (source: NISR Statistical Yearbook 2025, data: RDB)`;
  if (!previous) return `${base}.`;
  return `${base}, compared with ${previous.value.toLocaleString("en-US")} in ${previous.year}.`;
}

export async function buildFactPack(
  outcome: SearchOutcome,
): Promise<ExplanationFactPack> {
  const facts: ExplanationFact[] = outcome.results
    .slice(0, TOP_N)
    .map(({ opportunity }) => ({
      name: opportunity.name,
      category: opportunity.category,
      province: labelProvince(opportunity.province),
      priceLabel: opportunity.isFree
        ? "Free"
        : opportunity.priceRwf !== null
          ? formatRwf(opportunity.priceRwf)
          : "not published",
      // Two strongest reasons — the ranking already ordered them.
      topReasons: outcome.results
        .find((r) => r.opportunity.id === opportunity.id)!
        .reasons.slice(0, 2),
      isSample: opportunity.isSampleData,
    }));

  return {
    rawGoal: outcome.criteria.rawGoal,
    criteriaSummary: `${describePurpose(outcome)}; budget: ${describeBudget(outcome)}; location: ${
      outcome.criteria.provinces.length > 0
        ? outcome.criteria.provinces.map(labelProvince).join(", ")
        : "any province"
    }`,
    facts,
    matchedCount: outcome.results.length,
    scannedCount: outcome.scannedCount,
    notes: outcome.notes,
    tourismContext: await fetchTourismContext(),
  };
}
