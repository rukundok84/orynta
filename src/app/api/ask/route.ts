import { z } from "zod";
import { runSearch } from "@/modules/recommendations";
import { answerQuestion } from "@/modules/explanations";
import { searchRequestSchema } from "@/modules/opportunities/criteria";

// The AI explainer allows up to 25s for the model to respond; give the
// function headroom so Vercel doesn't kill it first. (Hobby plans cap
// this lower — the client shows a friendly failure and the user can hit
// "try again".)
export const maxDuration = 30;

/**
 * POST /api/ask
 *
 * Body: { "goal": "anything — a goal, a question, chit-chat" }
 *
 * The general-purpose assistant endpoint. The server runs the
 * deterministic pipeline itself (so the AI is always grounded in our own
 * data for anything about opportunities), then lets DeepSeek answer the
 * user's actual input — including questions that have nothing to do with
 * the dataset, which are answered from general knowledge and labelled as
 * such by the UI.
 *
 * The client cannot supply facts; it can only supply the question.
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
    const answer = await answerQuestion(outcome);
    return Response.json(answer);
  } catch (error) {
    console.error("Ask failed:", error);
    return Response.json(
      { error: "The assistant failed unexpectedly. Please try again." },
      { status: 500 },
    );
  }
}
