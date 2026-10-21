import { z } from "zod";
import { runSearch } from "@/modules/recommendations";
import { explainRecommendations } from "@/modules/explanations";
import { searchRequestSchema } from "@/modules/opportunities/criteria";

/**
 * POST /api/explain
 *
 * Body: { "goal": "I want to learn robotics without spending much money" }
 *
 * Same contract as /api/search — the server re-runs the deterministic
 * pipeline itself, then explains the outcome. The client cannot supply
 * facts; it can only supply the goal. This keeps the AI layer grounded in
 * our own data by construction.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: "Request body must be valid JSON." },
      { status: 400 },
    );
  }

  const parsed = searchRequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid request.", issues: z.treeifyError(parsed.error) },
      { status: 400 },
    );
  }

  try {
    const outcome = await runSearch(parsed.data.goal);
    const explanation = await explainRecommendations(outcome);
    return Response.json(explanation);
  } catch (error) {
    console.error("Explain failed:", error);
    return Response.json(
      { error: "Explanation failed unexpectedly. Please try again." },
      { status: 500 },
    );
  }
}
