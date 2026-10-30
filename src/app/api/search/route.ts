import { z } from "zod";
import { runSearch } from "@/modules/recommendations";
import { searchRequestSchema } from "@/modules/opportunities/criteria";

/**
 * POST /api/search
 *
 * Body: { "goal": "I want to learn robotics without spending much money" }
 *
 * Runs the deterministic pipeline: parse goal → retrieve records → rank.
 * Validation happens here with Zod; malformed requests get a 400 and never
 * reach the database. This endpoint stays AI-free — the list of results is
 * always pure data; AI answers come from /api/ask.
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
    return Response.json(outcome);
  } catch (error) {
    console.error("Search failed:", error);
    return Response.json(
      { error: "Search failed unexpectedly. Please try again." },
      { status: 500 },
    );
  }
}
