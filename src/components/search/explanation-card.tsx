"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { ExplanationResult } from "@/modules/explanations/types";

/**
 * On-demand explanation card. The user clicks "Explain these results" —
 * we don't auto-generate, so nothing is spent or sent to an AI API
 * without an explicit action (and so the demo has a nice moment).
 *
 * The card always shows WHO wrote the text (AI model vs rule-based
 * template) and the matching disclaimer. That labelling is non-negotiable:
 * a reader must never wonder whether they're reading a human, a machine,
 * or a template.
 */
export function ExplanationCard({ goal }: { goal: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ExplanationResult | null>(null);

  async function handleExplain() {
    if (loading) return;
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goal }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Explanation failed.");
      setResult(data as ExplanationResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Explanation failed.");
    } finally {
      setLoading(false);
    }
  }

  if (!result) {
    return (
      <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-border bg-muted/30 px-4 py-3">
        <p className="text-xs text-muted-foreground">
          Get a short, grounded summary of why these results fit your goal —
          generated from the same data as the list below.
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => void handleExplain()}
          disabled={loading}
        >
          {loading ? "Explaining…" : "Explain these results"}
        </Button>
      </div>
    );
  }

  return (
    <div className="mt-4 rounded-xl border border-border bg-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="rounded-full border border-border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider">
            {result.provider === "llm"
              ? `AI · ${result.model ?? "model"}`
              : "Rule-based template"}
          </span>
          {result.fallbackReason && (
            <span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[10px] text-amber-700">
              AI unavailable — fell back to template
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => setResult(null)}
          className="text-xs text-muted-foreground underline hover:text-foreground"
        >
          dismiss
        </button>
      </div>

      <p className="mt-3 text-sm leading-relaxed">{result.text}</p>

      {result.fallbackReason && (
        <p className="mt-3 font-mono text-[10px] text-muted-foreground">
          Fallback reason: {result.fallbackReason}
        </p>
      )}

      <p className="mt-3 text-[10px] uppercase tracking-wider text-muted-foreground">
        {result.disclaimer}
      </p>

      {error && (
        <p className="mt-3 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
