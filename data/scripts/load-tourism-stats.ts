/**
 * Loads the cleaned NISR/RDB tourism CSVs into the TourismStat table.
 *
 * Provenance chain (documented end to end):
 *   RDB (Rwanda Development Board) collects park visit data
 *     -> NISR publishes it in the Statistical Yearbook 2025 (Chapter 9)
 *       -> we extracted the tables (data/scripts/extract-tourism.ts)
 *         -> cleaned CSVs in data/nisr/ (thousands separators removed)
 *           -> this script loads them with a traceable DataSource row.
 *
 * Run: npx prisma db seed   (configured to run this file)
 * Idempotent: safe to re-run; upserts on the [indicator, subject, year] key.
 *
 * NOTE ON SOURCE QUIRKS: the Yearbook's two tables disagree slightly for
 * 2011 totals (57,552 in the by-park table vs 58,153 in the by-nationality
 * table). We load BOTH as published — correcting a source silently would
 * be data fabrication. The discrepancy is documented here for transparency.
 */
import "dotenv/config";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const root = join(__dirname, "..", "..");

const SOURCE = {
  name: "NISR Statistical Yearbook 2025 — Chapter 9: Travel and Tourism (data: RDB)",
  url: "https://statistics.gov.rw/sites/default/files/documents/2026-01/RWANDA_STATISTICAL_YEARBOOK_2025.pdf",
  description:
    "National park visitor statistics collected by the Rwanda Development Board (RDB) and published by the National Institute of Statistics of Rwanda (NISR) in the Statistical Yearbook 2025.",
  citation:
    "National Institute of Statistics of Rwanda (NISR), Rwanda Statistical Yearbook 2025, Chapter 9: Travel and Tourism. Original data: RDB.",
  referencePeriod: "2005–2024",
  geographicCoverage:
    "National — Volcanoes, Akagera and Nyungwe National Parks",
};

/** Parses a simple CSV: header row, comma-separated, no quoted fields. */
function parseCsv(text: string): Array<Record<string, string>> {
  const lines = text.trim().split(/\r?\n/);
  const headers = lines[0].split(",");
  return lines.slice(1).map((line) => {
    const values = line.split(",");
    const row: Record<string, string> = {};
    headers.forEach((h, i) => (row[h] = values[i]));
    return row;
  });
}

interface LoadPlan {
  indicator: string;
  csvFile: string;
  /** CSV column -> subject label shown in the UI. */
  subjects: Record<string, string>;
}

const PLANS: LoadPlan[] = [
  {
    indicator: "National park visits by park",
    csvFile: "data/nisr/park_visits_by_park_2005_2024.csv",
    subjects: {
      volcanoes_national_park: "Volcanoes National Park",
      akagera_national_park: "Akagera National Park",
      nyungwe_national_park: "Nyungwe National Park",
      total: "Total (all parks)",
    },
  },
  {
    indicator: "National park visits by nationality",
    csvFile: "data/nisr/park_visitors_by_nationality_2008_2024.csv",
    subjects: {
      rwandan_residents: "Rwandan residents",
      foreign_residents: "Foreign residents",
      foreign_visits: "Foreign visits",
      total: "Total (all visitors)",
    },
  },
];

async function main() {
  const source = await prisma.dataSource.upsert({
    where: { name: SOURCE.name },
    update: {},
    create: SOURCE,
  });

  let rows = 0;
  for (const plan of PLANS) {
    const csvPath = join(root, plan.csvFile);
    const records = parseCsv(readFileSync(csvPath, "utf8"));

    for (const record of records) {
      const year = Number(record.year);
      for (const [column, subject] of Object.entries(plan.subjects)) {
        const value = Number(record[column]);
        if (!Number.isFinite(year) || !Number.isFinite(value)) {
          throw new Error(
            `Bad value in ${plan.csvFile}: year=${record.year} ${column}=${record[column]}`,
          );
        }

        await prisma.tourismStat.upsert({
          where: {
            indicator_subject_year: {
              indicator: plan.indicator,
              subject,
              year,
            },
          },
          update: { value }, // republishing fixes values; keep idempotent
          create: {
            indicator: plan.indicator,
            subject,
            year,
            value,
            sourceId: source.id,
          },
        });
        rows++;
      }
    }
  }

  const total = await prisma.tourismStat.count();
  console.log(`Tourism stats loaded: ${rows} observations written.`);
  console.log(`TourismStat table now holds ${total} rows.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
