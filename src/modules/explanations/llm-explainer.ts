import type { ExplanationFactPack } from "./types";

/**
 * AI explainer — talks to any OpenAI-compatible chat completions API.
 *
 * Works with: OpenAI (default), DeepSeek, Groq, OpenRouter, Mistral,
 * or a local Ollama server — anything that serves
 * POST {baseUrl}/chat/completions with a Bearer token.
 *
 * Configuration (all in .env.local, never committed):
 *   AI_API_KEY   — required to activate; without it the template provider
 *                  is used and this module is never called.
 *   AI_BASE_URL  — default https://api.openai.com/v1
 *   AI_MODEL     — default gpt-4o-mini (cheap + good enough for this task)
 *
 * Safety design:
 * - The model receives ONLY the fact pack built server-side; it is told in
 *   the system prompt to use no other facts. It cannot browse, and it is
 *   asked to say "not enough information" instead of guessing.
 * - Low temperature for stable, non-creative output.
 * - Hard timeout so a slow API can never hang the search page.
 * - Any failure throws; the caller falls back to the template explainer.
 */

const DEFAULT_BASE_URL = "https://api.openai.com/v1";
const DEFAULT_MODEL = "gpt-4o-mini";
const TIMEOUT_MS = 20_000;
const MAX_TOKENS = 300;

export function llmConfig(): { baseUrl: string; model: string; hasKey: boolean } {
  const baseUrl = (process.env.AI_BASE_URL ?? DEFAULT_BASE_URL).replace(/\/+$/, "");
  const model = process.env.AI_MODEL ?? DEFAULT_MODEL;
  const hasKey = Boolean(process.env.AI_API_KEY);
  return { baseUrl, model, hasKey };
}

function systemPrompt(): string {
  return [
    "You are the explanation assistant of ORYNTA, a platform that recommends",
    "opportunities (education, tourism, events, business, research) in Rwanda.",
    "",
    "You will receive: the user's goal, the parsed criteria, and a FACTS list",
    "of matching opportunities with their categories, provinces, prices, and",
    "match reasons.",
    "",
    "Hard rules:",
    "- Use ONLY facts from the provided list. Never invent opportunities,",
    "  prices, dates, statistics, or organizations.",
    "- If the facts are insufficient to answer, say what is missing instead",
    "  of guessing.",
    "- Keep it under 130 words, plain English, friendly but factual.",
    "- Structure: 1-2 sentences summarizing what fits and why; optionally one",
    "  sentence of trade-offs or honest caveats; end with one concrete next",
    "  step for the user.",
    "- If records are marked as development samples, remind the user briefly",
    "  that details need verification.",
    "- No markdown headers. No emoji.",
  ].join("\n");
}

function userPrompt(pack: ExplanationFactPack): string {
  const facts = pack.facts
    .map(
      (f, i) =>
        `${i + 1}. ${f.name} | category: ${f.category} | province: ${f.province} | price: ${f.priceLabel}` +
        `${f.isSample ? " | [DEVELOPMENT SAMPLE — unverified]" : ""}` +
        `\n   Reasons: ${f.topReasons.join(" / ") || "top overall score"}`,
    )
    .join("\n");

  const notes = pack.notes.length > 0 ? `\nSearch notes: ${pack.notes.join(" ")}` : "";
  const context = pack.tourismContext
    ? `\nPublished context (do not repeat the numbers unless relevant): ${pack.tourismContext}`
    : "";

  return [
    `User goal: "${pack.rawGoal}"`,
    `Parsed criteria: ${pack.criteriaSummary}`,
    `Matches: ${pack.matchedCount} out of ${pack.scannedCount} scanned records.`,
    "",
    "FACTS (the only information you may use):",
    pack.facts.length > 0 ? facts : "(no matching records)",
    notes,
    context,
  ].join("\n");
}

/**
 * Calls the chat completions API and returns the generated text.
 * Throws on any error (network, HTTP status, empty response) — the caller
 * decides how to fall back.
 */
export async function explainWithLlm(pack: ExplanationFactPack): Promise<{
  text: string;
  model: string;
}> {
  const { baseUrl, model } = llmConfig();
  const apiKey = process.env.AI_API_KEY;
  if (!apiKey) throw new Error("AI_API_KEY not configured");

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.3,
      max_tokens: MAX_TOKENS,
      messages: [
        { role: "system", content: systemPrompt() },
        { role: "user", content: userPrompt(pack) },
      ],
    }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(
      `AI request failed: HTTP ${response.status} ${response.statusText}${
        body ? ` — ${body.slice(0, 200)}` : ""
      }`,
    );
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const text = data.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error("AI returned an empty response");

  return { text, model };
}
