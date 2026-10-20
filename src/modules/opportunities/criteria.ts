import { z } from "zod";

/**
 * Structured search criteria — the bridge between a fuzzy natural-language
 * goal and a concrete database query.
 *
 * The goal parser (parse-goal.ts) produces this shape from free text; the
 * ranking module consumes it. Zod validates it at the API boundary so a bad
 * request never reaches the database layer.
 */
export const searchCriteriaSchema = z.object({
  /** The user's original goal text — kept for display and auditing. */
  rawGoal: z.string().min(1).max(500),

  /** Purpose categories inferred from the goal (may be empty). */
  categories: z.array(
    z.enum(["EDUCATION", "TOURISM", "EVENT", "BUSINESS", "RESEARCH"]),
  ),

  /** Budget constraint inferred from the goal. */
  budget: z.enum(["FREE_ONLY", "BUDGET", "UNSPECIFIED"]),

  /** Max price the user is willing to pay, in RWF (only for BUDGET mode). */
  maxPriceRwf: z.number().int().positive().nullable(),

  /** Provinces the user mentioned (empty = no location preference). */
  provinces: z.array(
    z.enum([
      "KIGALI_CITY",
      "SOUTHERN",
      "NORTHERN",
      "EASTERN",
      "WESTERN",
    ]),
  ),

  /** Meaningful keywords extracted from the goal, for tag matching. */
  keywords: z.array(z.string().min(2)).max(20),
});

export type SearchCriteria = z.infer<typeof searchCriteriaSchema>;

/** Zod schema for the /api/search request body. */
export const searchRequestSchema = z.object({
  goal: z.string().min(3, "Tell us what you want to achieve.").max(500),
});

export type SearchRequest = z.infer<typeof searchRequestSchema>;
