import type {
  SearchCriteria,
} from "@/modules/opportunities/criteria";

/**
 * Rule-based goal parser.
 *
 * Turns free text like "I want to learn robotics in Rwanda without spending
 * much money" into structured SearchCriteria. Everything here is
 * deterministic: the same input always produces the same output, which makes
 * it testable and explainable to users and judges. No AI involved (yet).
 */

type Category = SearchCriteria["categories"][number];
type Province = SearchCriteria["provinces"][number];

/**
 * Category dictionaries: words that signal a purpose.
 * Matched with word-boundary regexes so "tour" doesn't match "tournament".
 */
const CATEGORY_SIGNALS: Record<Category, string[]> = {
  EDUCATION: [
    "learn", "learning", "study", "studying", "course", "courses",
    "training", "class", "classes", "workshop", "workshops", "scholarship",
    "school", "university", "college", "education", "taught", "teach",
    "bootcamp", "certificate", "degree", "student", "students", "lesson",
    "lessons", "tutorial", "tutorials", "skill", "skills",
  ],
  TOURISM: [
    "tourism", "tourist", "tour", "tours", "visit", "visiting", "travel",
    "hike", "hiking", "safari", "wildlife", "nature", "park", "parks",
    "museum", "museums", "sights", "sightseeing", "destination",
    "destinations", "adventure", "scenic", "landscape", "landscapes",
    "cultural", "culture", "heritage", "experience", "experiences",
    "explore", "exploring", "holiday", "vacation",
  ],
  EVENT: [
    "event", "events", "meetup", "meetups", "conference", "conferences",
    "workshop", "workshops", "seminar", "seminars", "festival", "festivals",
    "fair", "fairs", "expo", "expos", "hackathon", "hackathons", "summit",
    "summits", "happening", "happenings", "workshop", "competition",
    "competitions", "meet", "gathering", "gatherings",
  ],
  BUSINESS: [
    "business", "businesses", "startup", "startups", "entrepreneur",
    "entrepreneurs", "entrepreneurship", "networking", "network", "partner",
    "partners", "partnership", "partnerships", "investor", "investors",
    "investing", "investment", "funding", "grant", "grants", "coop",
    "cooperative", "sme", "smes", "company", "companies", "commerce",
    "trade", "trading", "market", "markets", "mentor", "mentors", "founder",
    "founders", "businessmen", "businesswomen",
  ],
  RESEARCH: [
    "research", "researcher", "researchers", "academic", "academia",
    "laboratory", "laboratories", "lab", "labs", "study", "studies",
    "data", "dataset", "datasets", "statistics", "innovation", "innovation",
    "rnd", "phd", "thesis", "publication", "publications",
  ],
};

/**
 * Budget signals. Two levels:
 * - FREE_ONLY: the goal explicitly demands zero cost.
 * - BUDGET: cost-conscious but not strictly free.
 */
const FREE_ONLY_SIGNALS = [
  "free", "no cost", "without spending", "without paying", "spend nothing",
  "no money", "don't have money", "dont have money", "zero cost",
  "without any cost", "completely free", "at no cost", "unpaid",
];

const BUDGET_SIGNALS = [
  "cheap", "cheapest", "affordable", "affordably", "low budget",
  "small budget", "budget-friendly", "budget friendly", "inexpensive",
  "economical", "spending much", "spend much", "spend less", "spending less",
  "low cost", "low-cost", "save money", "economy", "pocket-friendly",
  "pocket friendly", "reasonable price", "reasonable cost",
];

/**
 * Budget ceiling (RWF) used when the goal says costs should be low but gives
 * no number. Chosen to comfortably include our sample price points
 * (2,000–25,000 RWF). Explicit numbers in the goal override this later.
 */
export const DEFAULT_BUDGET_CEILING_RWF = 25_000;

/**
 * Location dictionary. Province names plus a small map of well-known towns
 * to their provinces (public geographic facts about Rwanda).
 */
const PROVINCE_SIGNALS: Record<Province, string[]> = {
  KIGALI_CITY: ["kigali", "kigali city", "kigali province"],
  SOUTHERN: ["southern province", "southern"],
  NORTHERN: ["northern province", "northern"],
  EASTERN: ["eastern province", "eastern"],
  WESTERN: ["western province", "western"],
};

const TOWN_TO_PROVINCE: Record<string, Province> = {
  huye: "SOUTHERN", butare: "SOUTHERN", muhanga: "SOUTHERN",
  nyanza: "SOUTHERN", gidha: "SOUTHERN",
  musanze: "NORTHERN", ruhengeri: "NORTHERN", kinigi: "NORTHERN",
  byumba: "NORTHERN", gicumbi: "NORTHERN",
  nyagatare: "EASTERN", rwamagana: "EASTERN", kayonza: "EASTERN",
  kibungo: "EASTERN", bugesera: "EASTERN",
  rubavu: "WESTERN", gisenyi: "WESTERN", karongi: "WESTERN",
  kibuye: "WESTERN", rusizi: "WESTERN", nyungwe: "WESTERN",
};

/** Words too generic to help matching. */
const STOPWORDS = new Set([
  "i", "want", "to", "a", "an", "the", "in", "on", "for", "of", "and",
  "or", "with", "without", "is", "are", "was", "were", "be", "been",
  "do", "does", "did", "my", "me", "we", "our", "us", "you", "your",
  "it", "its", "this", "that", "these", "those", "at", "by", "from",
  "as", "so", "if", "can", "could", "should", "would", "will", "shall",
  "not", "no", "yes", "there", "here", "some", "any", "much", "many",
  "more", "most", "other", "into", "out", "up", "down", "about", "rwanda",
  "rwandan", "am", "is", "have", "has", "had", "get", "got", "like",
  "find", "looking", "seeking", "need", "needs", "would",
]);

/** Find `term` in the goal as a whole word (case-insensitive). */
function containsWord(goal: string, term: string): boolean {
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`\\b${escaped}\\b`, "i");
  return pattern.test(goal);
}

/** Detect which purpose categories the goal signals. */
function detectCategories(goal: string): Category[] {
  const matches: Array<{ category: Category; hits: number }> = [];

  for (const [category, signals] of Object.entries(CATEGORY_SIGNALS)) {
    const hits = signals.filter((s) => containsWord(goal, s)).length;
    if (hits > 0) matches.push({ category: category as Category, hits });
  }

  // Keep the strongest signal(s): categories tied on the highest hit count.
  // This avoids "learn data science for my research" matching everything.
  if (matches.length === 0) return [];
  const maxHits = Math.max(...matches.map((m) => m.hits));
  return matches
    .filter((m) => m.hits === maxHits)
    .map((m) => m.category);
}

/** Detect budget intent and an optional explicit price ceiling. */
function detectBudget(goal: string): {
  budget: SearchCriteria["budget"];
  maxPriceRwf: number | null;
} {
  // "without spending much/less money" is cost-conscious, NOT zero-cost.
  // Strip that phrasing before testing for free-only signals so
  // "without spending much" doesn't get misread as "without spending".
  const freeSignalText = goal.replace(
    /without\s+spending\s+(much|less|too\s+much)/gi,
    " ",
  );
  const isFree = FREE_ONLY_SIGNALS.some((s) =>
    containsWord(freeSignalText, s),
  );

  // Explicit numbers: "under 10000 RWF", "less than 5,000 francs", "max 20000"
  const explicitPrice = goal.match(
    /(?:under|below|less than|max(?:imum)?|within|up to|no more than)\s*(?:rwf|rwandan\s+francs?|francs?)?\s*([\d,]+)/i,
  );

  if (isFree) return { budget: "FREE_ONLY", maxPriceRwf: null };

  if (explicitPrice) {
    const value = Number(explicitPrice[1].replace(/,/g, ""));
    if (Number.isFinite(value) && value > 0) {
      return { budget: "BUDGET", maxPriceRwf: value };
    }
  }

  const isBudget = BUDGET_SIGNALS.some((s) => containsWord(goal, s));
  if (isBudget) {
    return { budget: "BUDGET", maxPriceRwf: DEFAULT_BUDGET_CEILING_RWF };
  }

  return { budget: "UNSPECIFIED", maxPriceRwf: null };
}

/** Detect provinces from province names and well-known towns. */
function detectProvinces(goal: string): Province[] {
  const found = new Set<Province>();
  const lower = goal.toLowerCase();

  for (const [province, signals] of Object.entries(PROVINCE_SIGNALS)) {
    if (signals.some((s) => lower.includes(s))) {
      found.add(province as Province);
    }
  }

  for (const [town, province] of Object.entries(TOWN_TO_PROVINCE)) {
    if (containsWord(goal, town)) found.add(province);
  }

  return [...found];
}

/** Extract meaningful keywords (stopwords removed, lowercase, deduped). */
function extractKeywords(goal: string): string[] {
  const tokens = goal
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length >= 3 && !STOPWORDS.has(t));

  return [...new Set(tokens)].slice(0, 20);
}

/**
 * Parse a natural-language goal into structured search criteria.
 *
 * Design principle: when in doubt, UNDER-specify rather than guess.
 * An empty category list means "no strong purpose signal" — retrieval will
 * lean on keywords instead of filtering by category.
 */
export function parseGoal(rawGoal: string): SearchCriteria {
  const goal = rawGoal.trim();
  const { budget, maxPriceRwf } = detectBudget(goal);

  return {
    rawGoal: goal,
    categories: detectCategories(goal),
    budget,
    maxPriceRwf,
    provinces: detectProvinces(goal),
    keywords: extractKeywords(goal),
  };
}
