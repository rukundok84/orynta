"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { SearchOutcome } from "@/modules/recommendations";
import { formatRwf, labelProvince } from "@/modules/recommendations/format";
import { AssistantCard } from "./assistant-card";

const EXAMPLE_GOALS = [
  "I want to learn robotics in Rwanda without spending much money.",
  "I'm looking for cultural tourism experiences in the Western Province.",
  "I want to find networking events for entrepreneurs in Kigali.",
];

function PriceLabel({
  isFree,
  priceRwf,
}: {
  isFree: boolean;
  priceRwf: number | null;
}) {
  if (isFree) return <span className="text-green-600">Free</span>;
  if (priceRwf === null) return <span className="text-muted-foreground">Price not published</span>;
  return <span>{formatRwf(priceRwf)}</span>;
}

export function GoalSearch() {
  const [goal, setGoal] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<SearchOutcome | null>(null);

  async function handleSearch() {
    const trimmed = goal.trim();
    if (trimmed.length < 3 || loading) return;

    setLoading(true);
    setError(null);
    setOutcome(null);

    try {
      const response = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goal: trimmed }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Search failed.");
      }
      setOutcome(data as SearchOutcome);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <label htmlFor="goal" className="text-sm font-medium text-foreground">
        What do you want to achieve? (or ask anything)
      </label>
      <textarea
        id="goal"
        rows={3}
        value={goal}
        onChange={(e) => setGoal(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) void handleSearch();
        }}
        placeholder={
          "e.g. I want to learn robotics in Rwanda without spending much money."
        }
        className="mt-3 w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      />
      <div className="mt-3 flex items-center justify-between gap-4">
        <p className="text-xs text-muted-foreground">
          Press Ctrl+Enter to search. Records are labelled by verification
          status. Questions that aren&apos;t goals are answered by the AI
          assistant too.
        </p>
        <Button onClick={() => void handleSearch()} disabled={loading}>
          {loading ? "Searching…" : "Find opportunities"}
        </Button>
      </div>

      <ul className="mt-4 flex flex-wrap gap-2">
        {EXAMPLE_GOALS.map((example) => (
          <li key={example}>
            <button
              type="button"
              onClick={() => setGoal(example)}
              className="rounded-full border border-border px-3 py-1 text-left text-xs text-muted-foreground hover:bg-muted"
            >
              “{example}”
            </button>
          </li>
        ))}
      </ul>

      {error && (
        <p className="mt-4 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      )}

      {outcome && (
        <div className="mt-8">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h3 className="text-lg font-semibold">
              {outcome.results.length === 0
                ? "No matching opportunities"
                : `${outcome.results.length} opportunit${outcome.results.length === 1 ? "y" : "ies"} found`}
            </h3>
            <span className="text-xs text-muted-foreground">
              scanned {outcome.scannedCount} records
            </span>
          </div>

          {outcome.notes.length > 0 && (
            <ul className="mt-2 list-inside list-disc text-xs text-muted-foreground">
              {outcome.notes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          )}

          <AssistantCard question={outcome.criteria.rawGoal} />

          <ol className="mt-4 space-y-4">
            {outcome.results.map(({ opportunity, score, reasons }) => (
              <li
                key={opportunity.id}
                className="rounded-xl border border-border bg-card p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h4 className="font-medium">{opportunity.name}</h4>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {opportunity.locationName} · {labelProvince(opportunity.province)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="rounded-full border border-border px-2 py-0.5 font-mono uppercase tracking-wider">
                      {opportunity.category}
                    </span>
                    <span className="rounded-full border border-border px-2 py-0.5 font-mono">
                      score {score}
                    </span>
                  </div>
                </div>

                <p className="mt-3 text-sm text-muted-foreground">
                  {opportunity.description}
                </p>

                <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm">
                  <span>
                    <span className="text-xs text-muted-foreground">Budget: </span>
                    <PriceLabel
                      isFree={opportunity.isFree}
                      priceRwf={opportunity.priceRwf}
                    />
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Source: {opportunity.source.name}
                    {opportunity.source.url && (
                      <>
                        {" — "}
                        <a
                          href={opportunity.source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline hover:text-foreground"
                        >
                          view
                        </a>
                      </>
                    )}
                  </span>
                </div>

                <div className="mt-3 rounded-lg bg-muted/60 p-3">
                  <p className="text-xs font-medium">Why this matches</p>
                  <ul className="mt-1 list-inside list-disc space-y-0.5 text-xs text-muted-foreground">
                    {reasons.map((reason) => (
                      <li key={reason}>{reason}</li>
                    ))}
                  </ul>
                </div>

                {opportunity.isSampleData && (
                  <p className="mt-3 font-mono text-[10px] uppercase tracking-wider text-amber-600">
                    Development sample record — not yet verified
                  </p>
                )}
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
