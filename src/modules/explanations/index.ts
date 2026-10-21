import type { SearchOutcome } from "@/modules/recommendations";
import { buildFactPack } from "./build-context";
import { explainWithTemplate } from "./template-explainer";
import { explainWithLlm, llmConfig } from "./llm-explainer";
import type { ExplanationResult } from "./types";

export type { ExplanationResult } from "./types";

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
    const reason =
      error instanceof Error ? error.message : "Unknown AI error";
    console.warn("AI explainer failed, using template:", reason);
    return {
      ...explainWithTemplate(pack),
      fallbackReason: reason,
    };
  }
}
