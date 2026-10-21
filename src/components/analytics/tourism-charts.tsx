"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

/** Pre-shaped on the server: one row per year. */
export interface ParkVisitRow {
  year: number;
  volcanoes: number;
  akagera: number;
  nyungwe: number;
}

export interface NationalityRow {
  year: number;
  rwandanResidents: number;
  foreignResidents: number;
  foreignVisits: number;
}

export interface TourismSourceInfo {
  citation: string;
  coverage: string;
  period: string;
  url: string;
}

const PARK_COLORS = {
  volcanoes: "#16a34a",
  akagera: "#2563eb",
  nyungwe: "#9333ea",
};

const fmt = (n: number) => n.toLocaleString("en-US");

function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-card p-5">
      <h2 className="font-medium">{title}</h2>
      <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
      <div className="mt-4 h-80">{children}</div>
    </section>
  );
}

export function TourismCharts({
  parkVisits,
  byNationality,
  source,
}: {
  parkVisits: ParkVisitRow[];
  byNationality: NationalityRow[];
  source: TourismSourceInfo;
}) {
  return (
    <div className="space-y-6">
      <ChartCard
        title="Visits to Rwanda's national parks, 2005–2024"
        subtitle="The 2020–21 dip is the COVID-19 travel collapse; 2024 reached an all-time high of 150,525 total visits."
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={parkVisits}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="year" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} tickFormatter={fmt} />
            <Tooltip formatter={(value) => fmt(Number(value))} />
            <Legend />
            <Line
              type="monotone"
              dataKey="volcanoes"
              name="Volcanoes"
              stroke={PARK_COLORS.volcanoes}
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="akagera"
              name="Akagera"
              stroke={PARK_COLORS.akagera}
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="nyungwe"
              name="Nyungwe"
              stroke={PARK_COLORS.nyungwe}
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard
        title="Who visits the parks? 2008–2024"
        subtitle="Visitor composition: Rwandan residents, foreign residents living in Rwanda, and foreign visits."
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={byNationality}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="year" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} tickFormatter={fmt} />
            <Tooltip formatter={(value) => fmt(Number(value))} />
            <Legend />
            <Bar
              dataKey="rwandanResidents"
              name="Rwandan residents"
              stackId="visitors"
              fill="#d97706"
            />
            <Bar
              dataKey="foreignResidents"
              name="Foreign residents"
              stackId="visitors"
              fill="#0891b2"
            />
            <Bar
              dataKey="foreignVisits"
              name="Foreign visits"
              stackId="visitors"
              fill="#16a34a"
            />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Source card — provenance must be visible, not buried. */}
      <section className="rounded-xl border border-border bg-muted/40 p-5 text-sm">
        <h2 className="font-medium">Data source</h2>
        <dl className="mt-2 space-y-1 text-xs text-muted-foreground">
          <div>
            <dt className="inline font-medium">Source: </dt>
            <dd className="inline">{source.citation}</dd>
          </div>
          <div>
            <dt className="inline font-medium">Geographic coverage: </dt>
            <dd className="inline">{source.coverage}</dd>
          </div>
          <div>
            <dt className="inline font-medium">Reference period: </dt>
            <dd className="inline">{source.period}</dd>
          </div>
          <div>
            <dt className="inline font-medium">Original publication: </dt>
            <dd className="inline">
              <a
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-foreground"
              >
                NISR Statistical Yearbook 2025 (PDF)
              </a>
            </dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
