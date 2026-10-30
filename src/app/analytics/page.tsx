import { NavBar } from "@/components/shared/navbar"
import { Suspense } from "react"
import type { Metadata } from "next"
import { db } from "@/modules/db/client"
import { TourismCharts } from "@/components/analytics/tourism-charts"

export const metadata: Metadata = {
  title: "Tourism Insights — ORYNTA",
  description:
    "National park visitor statistics for Rwanda, from the NISR Statistical Yearbook 2025.",
}

const PARK_INDICATOR = "National park visits by park"
const NATIONALITY_INDICATOR = "National park visits by nationality"

async function DashboardData() {
  const [parkStats, nationalityStats, source] = await Promise.all([
    db.tourismStat.findMany({
      where: { indicator: PARK_INDICATOR },
      orderBy: { year: "asc" },
    }),
    db.tourismStat.findMany({
      where: { indicator: NATIONALITY_INDICATOR },
      orderBy: { year: "asc" },
    }),
    db.dataSource.findFirst({
      where: { name: { contains: "Statistical Yearbook 2025" } },
    }),
  ])

  // Pivot: rows (subject, year) -> one object per year for Recharts.
  const parkByYear = new Map<number, { year: number; volcanoes: number; akagera: number; nyungwe: number }>()
  for (const stat of parkStats) {
    const row = parkByYear.get(stat.year) ?? { year: stat.year, volcanoes: 0, akagera: 0, nyungwe: 0 }
    if (stat.subject === "Volcanoes National Park") row.volcanoes = stat.value
    if (stat.subject === "Akagera National Park") row.akagera = stat.value
    if (stat.subject === "Nyungwe National Park") row.nyungwe = stat.value
    parkByYear.set(stat.year, row)
  }

  const nationalityByYear = new Map<number, { year: number; rwandanResidents: number; foreignResidents: number; foreignVisits: number }>()
  for (const stat of nationalityStats) {
    const row =
      nationalityByYear.get(stat.year) ??
      { year: stat.year, rwandanResidents: 0, foreignResidents: 0, foreignVisits: 0 }
    if (stat.subject === "Rwandan residents") row.rwandanResidents = stat.value
    if (stat.subject === "Foreign residents") row.foreignResidents = stat.value
    if (stat.subject === "Foreign visits") row.foreignVisits = stat.value
    nationalityByYear.set(stat.year, row)
  }

  return (
    <TourismCharts
      parkVisits={[...parkByYear.values()]}
      byNationality={[...nationalityByYear.values()]}
      source={{
        citation:
          source?.citation ?? "NISR, Rwanda Statistical Yearbook 2025, Chapter 9 (data: RDB)",
        coverage: source?.geographicCoverage ?? "National",
        period: source?.referencePeriod ?? "2005–2024",
        url:
          source?.url ?? "https://statistics.gov.rw/sites/default/files/documents/2026-01/RWANDA_STATISTICAL_YEARBOOK_2025.pdf",
      }}
    />
  )
}

export default function AnalyticsPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10">
      <NavBar />

      <h1 className="text-2xl font-semibold tracking-tight">
        Tourism insights
      </h1>
      <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
        Rwanda&apos;s national park visitation over two decades — real data
        published by NISR. Every figure below traces back to the Statistical
        Yearbook, cited under the charts.
      </p>

      <div className="mt-6">
        <Suspense
          fallback={
            <div className="h-96 animate-pulse rounded-xl border border-bg bg-muted" />
          }>
          <DashboardData />
        </Suspense>
      </div>
    </div>
  )
}