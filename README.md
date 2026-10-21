# ORYNTA

**Rwanda Opportunity & Tourism Intelligence Platform** — built for the NISR Big Data Hackathon 2026, Track 3 (Open Innovation).

ORYNTA turns a plain-language goal ("I want to learn robotics without spending much money") into explained, mapable, statistically-grounded recommendations — using only data it can trace to a named source.

**Core promise: nothing shown is fabricated.** Sample records are labelled as samples. Statistics carry their citation, coverage, and reference period. AI-generated text is labelled as AI and grounded in the same data you see on screen.

---

## What it does

| Page | What you get |
|------|-------------|
| **`/`** — Goal search | Type a goal in plain English → rule-based parser extracts purpose, budget, and location → deterministic ranking → each result explains *why* it matches. Optional AI-generated summary (clearly labelled). |
| **`/map`** — Interactive map | All opportunities on an OpenStreetMap view of Rwanda, filterable by category and province, with popups showing price and source. |
| **`/analytics`** — Tourism insights | Real NISR statistics: national park visits 2005–2024 by park and by visitor nationality, with full source citation. |

---

## Quick start

### Prerequisites

- **Node.js 20+** and npm
- **PostgreSQL 14+** running locally (or a connection string to any Postgres)

### Setup

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env.local
# Edit .env.local: set DATABASE_URL to your Postgres instance.
# AI_API_KEY is optional — see "AI explanations" below.

# 3. Create the database (once)
createdb oryntra          # or: psql -c 'CREATE DATABASE oryntra;'

# 4. Apply migrations and load data
npm run db:migrate
npm run db:seed           # loads sample opportunities + real NISR statistics

# 5. Start the dev server
npm run dev
# → http://localhost:3000
```

### Useful scripts

| Command | What it does |
|---------|-------------|
| `npm run dev` | Start dev server (Turbopack) |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm run db:migrate` | Apply Prisma migrations |
| `npm run db:seed` | Load / reload seed data (idempotent) |
| `npm run db:studio` | Open Prisma Studio (DB browser) |
| `npm run db:generate` | Regenerate Prisma client |

---

## Data honesty

ORYNTA uses two kinds of data, and never mixes them up:

### 1. Sample opportunity records (labelled, not verified)

The 13 opportunity records in `prisma/seed.ts` are **development samples** to demonstrate the pipeline. Every one carries:
- `isSampleData: true`
- A `[SAMPLE]` prefix in the name
- `verificationStatus: UNVERIFIED`

They exist so the platform is functional out of the box. **They are not evidence of real, current opportunities.** Before a real deployment, they would be replaced by records collected and verified from real sources (RDB, district offices, event organizers, etc.).

### 2. Published NISR statistics (real, cited)

The tourism dashboard uses **real data** from the [NISR Statistical Yearbook 2025](https://statistics.gov.rw/sites/default/files/documents/2026-01/RWANDA_STATISTICAL_YEARBOOK_2025.pdf), Chapter 9: Travel and Tourism. Original data collected by the Rwanda Development Board (RDB).

- **Provenance chain:** PDF → text extraction (`data/scripts/extract-tourism.ts`) → cleaned CSVs (`data/nisr/`) → database (`TourismStat` table) → dashboard.
- **Full audit trail:** the extracted text and both CSVs are committed alongside the loading scripts.
- **Source quirks preserved:** the Yearbook's two tables disagree slightly for 2011 totals (57,552 vs 58,153). Both are loaded as published — silently correcting a source would be data fabrication.
- The raw PDF is git-ignored (6.6 MB); the re-download command is documented in the extraction script header.

---

## AI explanations (optional)

ORYNTA can generate a short, grounded explanation of why search results fit your goal. This works in two modes:

### Without an AI key (default — free, always works)

A deterministic **template explainer** composes a summary from the exact same data as the results on screen. It is labelled **"Rule-based template"** in the UI.

### With an AI key (OpenAI-compatible)

Set `AI_API_KEY` in `.env.local` to activate the AI path. Works with any OpenAI-compatible API:
- **OpenAI** (default base URL)
- **DeepSeek**, **Groq**, **OpenRouter**, **Mistral**
- A local **Ollama** server

```bash
# .env.local
AI_API_KEY=sk-...
AI_BASE_URL=https://api.openai.com/v1   # default; change for other providers
AI_MODEL=gpt-4o-mini                     # default; change for other providers
```

No code changes needed — the next explanation is AI-generated and labelled with the model name.

### How the AI stays honest

1. **Server-side fact pack:** the client only sends the goal text. The server re-runs the deterministic pipeline and builds a fact pack (top results + reasons + real NISR context). The AI receives only these facts — it cannot invent opportunities, prices, or statistics.
2. **Strict system prompt:** the model is instructed to use only the provided facts, say "not enough information" rather than guess, and stay under 130 words.
3. **Graceful fallback:** if the AI call fails for any reason (bad key, rate limit, network), the template explainer takes over automatically. The user sees an honest "AI unavailable" note — never an error screen.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Browser (React 19)                       │
│  / ─── GoalSearch + ExplanationCard                          │
│  /map ── Leaflet + CircleMarkers (SVG, no broken pin assets) │
│  /analytics ── Recharts (line + stacked bar)                │
└──────────────────────────┬──────────────────────────────────┘
                           │ fetch / RSC
┌──────────────────────────▼──────────────────────────────────┐
│                 Next.js 16 Route Handlers                    │
│  POST /api/search  ── parse → rank → explain                │
│  POST /api/explain ── same pipeline + template/LLM           │
│  GET  /api/health  ── liveness check                         │
└──────────────────────────┬──────────────────────────────────┘
                           │ Prisma 7 (driver adapter: @prisma/adapter-pg)
┌──────────────────────────▼──────────────────────────────────┐
│                      PostgreSQL 18                           │
│  Opportunity ── sample records (labelled)                    │
│  DataSource  ── provenance metadata                          │
│  TourismStat ── 148 real observations from NISR SYB 2025    │
└─────────────────────────────────────────────────────────────┘
```

### Key modules

| Module | Role |
|--------|------|
| `src/modules/recommendations/` | Goal parser, ranking engine, explanation builder |
| `src/modules/explanations/` | AI + template explainers with graceful fallback |
| `src/modules/opportunities/` | Zod schemas for criteria and API validation |
| `src/modules/db/` | Prisma client singleton (server-only) |
| `data/scripts/` | Data extraction and loading (audit trail) |

---

## Tech stack

- **Framework:** Next.js 16 (App Router, React 19, Turbopack, Cache Components)
- **Styling:** Tailwind CSS v4 + shadcn/ui
- **Database:** PostgreSQL 18 + Prisma 7 (driver adapter pattern)
- **Map:** Leaflet + OpenStreetMap (CircleMarker SVGs — no broken default pin assets)
- **Charts:** Recharts
- **AI:** OpenAI-compatible API (optional; template fallback always available)
- **Language:** TypeScript (strict)

---

## Project structure

```
oryntra/
├── data/
│   ├── nisr/                    # Cleaned CSVs (committed, audit trail)
│   ├── raw/                     # PDF (git-ignored) + extracted text
│   └── scripts/                 # Extraction + loading scripts
├── prisma/
│   ├── migrations/              # SQL migrations
│   ├── schema.prisma            # Data model
│   └── seed.ts                  # Sample opportunity records
├── src/
│   ├── app/
│   │   ├── api/                 # Route handlers (search, explain, health)
│   │   ├── analytics/           # Tourism dashboard page
│   │   ├── map/                 # Interactive map page
│   │   └── page.tsx             # Landing + goal search
│   ├── components/
│   │   ├── analytics/           # Recharts dashboard
│   │   ├── map/                 # Leaflet map
│   │   ├── search/              # GoalSearch + ExplanationCard
│   │   └── ui/                  # shadcn/ui primitives
│   └── modules/
│       ├── db/                  # Prisma client singleton
│       ├── explanations/        # AI + template explainers
│       ├── opportunities/       # Zod schemas
│       └── recommendations/     # Parser, ranker, formatter
└── .env.example                 # Configuration template
```

---

## Demo script (3-minute walkthrough)

1. **Open `/`** → type: *"I want to learn robotics in Rwanda without spending much money."*
2. **Results appear** → 3 ranked matches, each with a "Why this matches" box. Point out the `[SAMPLE]` labels.
3. **Click "Explain these results"** → card appears with "Rule-based template" badge. Show the disclaimer.
4. **Open `/map`** → 13 markers colored by category. Filter to TOURISM → 3 markers in the west.
5. **Open `/analytics`** → two charts from real NISR data. Point to the COVID dip (2020) and recovery. Show the source card at the bottom.
6. **Say:** "Every figure traces to the NISR Statistical Yearbook 2025. Sample records are labelled. The AI layer is optional and always grounded in the same data."

---

## License & attribution

Built for the NISR Big Data Hackathon 2026. Tourism statistics: National Institute of Statistics of Rwanda (NISR), Statistical Yearbook 2025, Chapter 9. Original data: Rwanda Development Board (RDB).

Opportunity records are development samples and do not represent verified, current opportunities.
