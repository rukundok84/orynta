"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import type { ExplanationResult } from "@/modules/explanations/types";

/**
 * Auto-answering assistant card. Fires as soon as a search completes and
 * shows DeepSeek's answer to whatever the user typed — a goal, a question
 * about an opportunity, or anything else entirely.
 *
 * State is keyed by the question it answers, so a new question shows the
 * loading state and swaps the answer without any setState-in-effect resets.
 *
 * The card always shows WHO wrote the text (AI model vs rule-based
 * template) and the matching disclaimer. That labelling is non-negotiable:
 * a reader must never wonder whether they're reading a human, a machine,
 * or a template.
 */

type AnswerState = {
  question: string;
  result: ExplanationResult | null;
  failed: boolean;
  dismissed: boolean;
};

export function AssistantCard({ question }: { question: string }) {
  const [state, setState] = useState<AnswerState | null>(null);
  // Bumped by the "Try again" buttons to re-fire the same question —
  // useful when the AI was briefly unavailable (e.g. out of credit at
  // deploy time, rate limited, network blip).
  const [retryToken, setRetryToken] = useState(0);

  function retry() {
    setState(null); // show the thinking state immediately
    setRetryToken((t) => t + 1);
  }

  useEffect(() => {
    // The cancelled flag drops stale responses (unmount, StrictMode
    // double-invoke in dev, or a newer question arriving first).
    let cancelled = false;

    fetch("/api/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ goal: question }),
      signal: AbortSignal.timeout(30_000),
    })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error ?? "The assistant failed.");
        if (!cancelled) setState({ question, result: data as ExplanationResult, failed: false, dismissed: false });
      })
      .catch(() => {
        // Timeouts and network errors land here; the server has its own
        // template fallback, so reaching this point means a real outage.
        if (!cancelled) setState({ question, result: null, failed: true, dismissed: false });
      });

    return () => {
      cancelled = true;
    };
  }, [question, retryToken]);

  // Only the state that answers the CURRENT question counts — anything
  // older means we're waiting on a fresh response.
  const current = state?.question === question ? state : null;

  // Dismissed (or answered and then dismissed): render nothing at all.
  if (current?.dismissed) return null;

  if (current?.failed) {
    return (
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3">
        <p className="text-sm text-destructive">
          The assistant couldn&apos;t answer right now. Your results below are
          unaffected — they come straight from the dataset.
        </p>
        <Button variant="outline" size="sm" onClick={retry}>
          Try again
        </Button>
      </div>
    );
  }

  if (!current) {
    return (
      <div className="mt-4 animate-pulse rounded-xl border border-border bg-muted/30 px-4 py-3">
        <p className="text-xs text-muted-foreground">
          ORYNTA assistant is thinking…
        </p>
      </div>
    );
  }

  if (!current.result) return null;

  const result = current.result;

  return (
    <div className="mt-4 rounded-xl border border-border bg-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
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
        <div className="flex items-center gap-3">
          {result.fallbackReason && (
            <button
              type="button"
              onClick={retry}
              className="text-xs text-muted-foreground underline hover:text-foreground"
            >
              try again
            </button>
          )}
          <button
            type="button"
            onClick={() => setState({ ...current, dismissed: true })}
            className="text-xs text-muted-foreground underline hover:text-foreground"
          >
            dismiss
          </button>
        </div>
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
    </div>
  );
}
