import { GoalSearch } from "@/components/search/goal-search";

const plannedFeatures = [
  {
    title: "Purpose-based discovery",
    description:
      "Describe a goal in plain language — learning robotics, growing a business, finding cultural experiences — and get matching opportunities instead of a generic list of places.",
    status: "Phase 2",
  },
  {
    title: "Explainable recommendations",
    description:
      "Every result explains why it matched your goal, what it costs, where it is, and which source it came from — so you can judge for yourself.",
    status: "Phase 2",
  },
  {
    title: "Interactive opportunity map",
    description:
      "Explore opportunities geographically across Rwanda's districts with an interactive OpenStreetMap view, filtered by category and location.",
    status: "Phase 3",
  },
  {
    title: "Evidence-based tourism & regional insights",
    description:
      "Tourism and regional statistics from documented NISR datasets — with the source, coverage, and reference period always visible.",
    status: "Phase 4",
  },
];

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-border">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-4">
          <span className="font-mono text-sm font-semibold tracking-widest">
            ORYNTA
          </span>
          <div className="flex items-center gap-4">
            <a href="/map" className="text-sm text-muted-foreground hover:text-foreground">
              Map
            </a>
            <a href="/analytics" className="text-sm text-muted-foreground hover:text-foreground">
              Insights
            </a>
            <span className="hidden text-xs text-muted-foreground sm:inline">
              NISR Big Data Hackathon 2026 · Track 3: Open Innovation
            </span>
          </div>
        </div>
      </header>

      <main className="flex flex-1 flex-col">
        <section className="mx-auto w-full max-w-5xl px-6 py-20 sm:py-28">
          <p className="mb-4 font-mono text-xs uppercase tracking-widest text-muted-foreground">
            Rwanda Opportunity &amp; Tourism Intelligence Platform
          </p>
          <h1 className="max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">
            Don&apos;t ask where to go.
            <br />
            Ask what you want to achieve.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            ORYNTA turns a personal goal into data-backed suggestions —
            educational programs, tourism experiences, events, and networks —
            ranked by relevance, with every recommendation traceable to its
            source.
          </p>

          <div className="mt-10 rounded-xl border border-border bg-card p-5">
            <GoalSearch />
          </div>
        </section>

        <section className="border-t border-border bg-muted/40">
          <div className="mx-auto w-full max-w-5xl px-6 py-16">
            <h2 className="text-2xl font-semibold tracking-tight">
              What ORYNTA will do
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              This is an early build. Each capability below is planned for a
              specific phase so we ship a working end-to-end demonstration
              rather than an unfinished feature list.
            </p>
            <div className="mt-8 grid gap-6 sm:grid-cols-2">
              {plannedFeatures.map((feature) => (
                <div
                  key={feature.title}
                  className="rounded-xl border border-border bg-card p-5"
                >
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-medium">{feature.title}</h3>
                    <span className="rounded-full border border-border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      {feature.status}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto w-full max-w-5xl px-6 py-6 text-xs text-muted-foreground">
          Built for the NISR Big Data Hackathon 2026. Opportunity data will be
          sourced and verified before demonstration — nothing shown here is
          fabricated evidence.
        </div>
      </footer>
    </div>
  );
}
