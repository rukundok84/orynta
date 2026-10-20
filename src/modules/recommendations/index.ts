import { db } from "@/modules/db/client";
import { parseGoal } from "./parse-goal";
import { formatRwf, labelProvince } from "./format";
import type { SearchCriteria } from "@/modules/opportunities/criteria";
import type { Opportunity, DataSource } from "@/generated/prisma/client";

export { formatRwf, labelProvince } from "./format";

/** An opportunity joined with its source, as stored in the database. */
export type OpportunityWithSource = Opportunity & { source: DataSource };

/** One ranked recommendation with human-readable reasons. */
export interface Recommendation {
  opportunity: OpportunityWithSource;
  score: number;
  reasons: string[];
}

/** Full outcome of a search — everything the UI needs to explain itself. */
export interface SearchOutcome {
  criteria: SearchCriteria;
  results: Recommendation[];
  /** How many records existed before filtering (context for the UI). */
  scannedCount: number;
  /** Honest caveats, e.g. "No strong purpose signal found". */
  notes: string[];
}

/** Hard score components — each maps to a visible explanation. */
const SCORE = {
  CATEGORY_MATCH: 40,
  PROVINCE_MATCH: 20,
  BUDGET_FIT: 25,
  TAG_MATCH: 6,
  TAG_MATCH_CAP: 18,
  UNKNOWN_PRICE_PARTIAL: 5,
  VERIFIED_BONUS: 3,
} as const;

interface ScoredResult {
  score: number;
  reasons: string[];
  /** Reason the record was excluded, if any (not shown as a result). */
  excluded?: string;
}

/**
 * Scores one opportunity against the criteria.
 *
 * Rules (deliberately simple and deterministic):
 * - Hard filters: known price over the budget ceiling; known paid price when
 *   the goal demands free; province stated but record is elsewhere.
 * - Missing data never invents a value: unknown price gets a small partial
 *   score and an honest "price not published" reason.
 */
function scoreOpportunity(
  opportunity: OpportunityWithSource,
  criteria: SearchCriteria,
): ScoredResult {
  const reasons: string[] = [];
  let score = 0;

  // --- Purpose match ------------------------------------------------------
  let categoryMatched = false;
  if (criteria.categories.length > 0) {
    if (criteria.categories.includes(opportunity.category)) {
      categoryMatched = true;
      score += SCORE.CATEGORY_MATCH;
      reasons.push(
        `Purpose fit: its category (${opportunity.category}) matches your goal.`,
      );
    }
  }

  // --- Keyword / tag relevance -------------------------------------------
  const matchedKeywords = criteria.keywords.filter((k) =>
    opportunity.tags.some((t) => tagMatches(t, k)),
  );
  if (matchedKeywords.length > 0) {
    const tagScore = Math.min(
      matchedKeywords.length * SCORE.TAG_MATCH,
      SCORE.TAG_MATCH_CAP,
    );
    score += tagScore;
    reasons.push(
      `Interests: matches your keywords — ${matchedKeywords.join(", ")}.`,
    );
  }

  // --- Budget fit (hard filter for over-budget / paid-when-free) ----------
  if (criteria.budget === "FREE_ONLY") {
    if (opportunity.isFree) {
      score += SCORE.BUDGET_FIT;
      reasons.push("Budget: listed as free — fits your zero-cost goal.");
    } else if (opportunity.priceRwf !== null) {
      return {
        score: 0,
        reasons: [],
        excluded: `costs ${formatRwf(opportunity.priceRwf)} but the goal requires free`,
      };
    } else {
      score += SCORE.UNKNOWN_PRICE_PARTIAL;
      reasons.push(
        "Budget: price not published by the source — verify before assuming it is free.",
      );
    }
  } else if (criteria.budget === "BUDGET" && criteria.maxPriceRwf !== null) {
    if (opportunity.priceRwf === null) {
      if (!opportunity.isFree) {
        score += SCORE.UNKNOWN_PRICE_PARTIAL;
        reasons.push(
          "Budget: price not published — it may fit your budget, but verify.",
        );
      }
    } else if (opportunity.priceRwf <= criteria.maxPriceRwf) {
      score += SCORE.BUDGET_FIT;
      reasons.push(
        `Budget: costs ${formatRwf(opportunity.priceRwf)}, within your limit of ${formatRwf(criteria.maxPriceRwf)}.`,
      );
    } else {
      return {
        score: 0,
        reasons: [],
        excluded: `costs ${formatRwf(opportunity.priceRwf)}, above your limit of ${formatRwf(criteria.maxPriceRwf)}`,
      };
    }
  }

  // --- Location match (hard filter when a place was stated) ---------------
  if (criteria.provinces.length > 0) {
    if (criteria.provinces.includes(opportunity.province)) {
      score += SCORE.PROVINCE_MATCH;
      reasons.push(`Location: in ${labelProvince(opportunity.province)}, which you asked for.`);
    } else {
      return {
        score: 0,
        reasons: [],
        excluded: `in ${labelProvince(opportunity.province)}, outside the area you asked for`,
      };
    }
  }

  // --- Trust signal -------------------------------------------------------
  if (!opportunity.isSampleData && opportunity.verificationStatus === "VERIFIED") {
    score += SCORE.VERIFIED_BONUS;
    reasons.push("Trust: this record has been verified against its source.");
  }

  // A result with no positive signals is not a recommendation.
  if (score === 0) return { score: 0, reasons: [], excluded: "no matching signals" };

  // When a purpose was stated, budget/location points alone are not enough:
  // an unrelated cheap item in the right province is still irrelevant.
  if (
    criteria.categories.length > 0 &&
    !categoryMatched &&
    matchedKeywords.length === 0
  ) {
    return {
      score: 0,
      reasons: [],
      excluded: "no connection to your stated purpose",
    };
  }

  return { score, reasons };
}

/** Case-insensitive, tolerant of partial words ("robot" ~ "robotics"). */
function tagMatches(tag: string, keyword: string): boolean {
  const t = tag.toLowerCase();
  const k = keyword.toLowerCase();
  return t === k || t.includes(k) || k.includes(t);
}

/**
 * Runs the full deterministic pipeline: parse → retrieve → rank → explain.
 */
export async function runSearch(rawGoal: string): Promise<SearchOutcome> {
  const criteria = parseGoal(rawGoal);

  const notes: string[] = [];
  if (criteria.categories.length === 0) {
    notes.push(
      "No strong purpose category was detected — ranking leans on your keywords.",
    );
  }
  if (criteria.provinces.length === 0) {
    notes.push("No specific location mentioned — showing all provinces.");
  }

  // Retrieval: the dataset is small (hackathon scale), so we fetch all
  // records and filter in memory. With a large dataset this becomes a SQL
  // WHERE clause — the module boundary keeps that change local.
  const opportunities = await db.opportunity.findMany({
    include: { source: true },
    orderBy: { createdAt: "asc" },
  });

  const ranked: Recommendation[] = [];
  let excluded = 0;

  for (const opportunity of opportunities) {
    const scored = scoreOpportunity(opportunity, criteria);
    if (scored.excluded) {
      excluded++;
      continue;
    }
    ranked.push({ opportunity, score: scored.score, reasons: scored.reasons });
  }

  // Deterministic ordering: score DESC, then name ASC for stable ties.
  ranked.sort((a, b) =>
    b.score !== a.score
      ? b.score - a.score
      : a.opportunity.name.localeCompare(b.opportunity.name),
  );

  if (ranked.length > 0) {
    notes.push(`${excluded} record(s) were filtered out by budget/location rules.`);
  }

  return { criteria, results: ranked, scannedCount: opportunities.length, notes };
}
