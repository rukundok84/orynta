import type { SearchOutcome } from "@/modules/recommendations";
import { buildFactPack } from "./build-context";
import { explainWithTemplate } from "./template-explainer";
import { explainWithLlm, llmConfig } from "./llm-explainer";
import { askWithLlm } from "./ask-explainer";
import type { ExplanationResult } from "./types";

export type { ExplanationResult } from "./types";

/**
 * Reduces an exception to a short, human-readable line safe to show in
 * the UI. API response bodies (which can contain raw JSON, account
 * details, request ids…) are stripped — the full message is always logged
 * server-side instead.
 */
function shortReason(error: unknown): string {
  const raw = error instanceof Error ? error.message : "Unknown AI error";
  // Error messages embed response bodies after an em dash; keep the head.
  const head = raw.split("—")[0].trim();
  return head.length > 140 ? `${head.slice(0, 137)}…` : head;
}

/**
 * Honest fallback for QUESTION-LIKE input when the AI is unavailable.
 * The goal-explainer template would read as gibberish here ("ORYNTA
 * understood your goal as: 'who is the president of Rwanda?'…"), so we
 * say plainly what happened instead.
 */
function offlineAssistantMessage(): ExplanationResult {
  return {
    text:
      "The ORYNTA assistant is offline right now, so it can't answer questions " +
      "outside ORYNTA's own dataset. Try again in a moment — or browse the " +
      "search results below, which come straight from ORYNTA's data.",
    provider: "template",
    model: null,
    disclaimer: "Rule-based message — no AI involved.",
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Heuristic: did the user state something goal-like (a purpose, place, or
 * budget was detected, or records matched)? If nothing at all was detected
 * and nothing matched, treat the input as a general question.
 */
function looksLikeGoal(outcome: SearchOutcome): boolean {
  return (
    outcome.results.length > 0 ||
    outcome.criteria.categories.length > 0 ||
    outcome.criteria.provinces.length > 0 ||
    outcome.criteria.budget !== "UNSPECIFIED"
  );
}

/**
 * Generates a short explanation of a search outcome.
 *
 * Provider selection (decided per request, nothing cached across users):
 *   1. No AI_API_KEY configured  → template explainer, no attempt at AI.
 *   2. AI_API_KEY configured     → AI explainer; if it fails for ANY reason
 *      (bad key, rate limit, network, timeout), we fall back to the template
 *      and record why in `fallbackReason` — the request never errors out.
 *
 * Both providers work from the same server-built fact pack, so the story
 * the user reads always matches the results they see on screen.
 */
export async function explainRecommendations(
  outcome: SearchOutcome,
): Promise<ExplanationResult> {
  const pack = await buildFactPack(outcome);
  const { hasKey } = llmConfig();

  if (!hasKey) {
    return explainWithTemplate(pack);
  }

  try {
    const { text, model: usedModel } = await explainWithLlm(pack);
    return {
      text,
      provider: "llm",
      model: usedModel,
      disclaimer:
        "AI-generated from the same data as your results — verify important details with the listed source.",
      generatedAt: new Date().toISOString(),
    };
  } catch (error) {
    // Never surface a raw exception to the UI; explain the fallback honestly.
    console.warn("AI explainer failed, using template:", error);
    return {
      ...explainWithTemplate(pack),
      fallbackReason: shortReason(error),
    };
  }
}

/**
 * Answers the user's input — anything from a goal to a random question.
 *
 * Same provider selection as explainRecommendations, but through the ask
 * explainer, which may use general knowledge for topics outside the
 * dataset. Grounding rules for ORYNTA data still apply (see ask-explainer).
 *
 * When the AI is unavailable, goal-like input still gets the grounded
 * template summary; question-like input gets an honest "assistant is
 * offline" message instead of goal-parse gibberish.
 */
export async function answerQuestion(
  outcome: SearchOutcome,
): Promise<ExplanationResult> {
  const pack = await buildFactPack(outcome);
  const { hasKey } = llmConfig();

  const offline = looksLikeGoal(outcome)
    ? explainWithTemplate(pack)
    : offlineAssistantMessage();

  if (!hasKey) {
    return offline;
  }

  try {
    const { text, model: usedModel } = await askWithLlm(pack);
    return {
      text,
      provider: "llm",
      model: usedModel,
      disclaimer:
        "AI-generated. Details about ORYNTA opportunities come from the dataset above — verify important facts with the listed source.",
      generatedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.warn("Ask explainer failed:", error);
    return {
      ...offline,
      fallbackReason: shortReason(error),
    };
  }
}
