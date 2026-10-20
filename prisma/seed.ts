/**
 * ORYNTA development seed data.
 *
 * ⚠️  HONESTY RULE: every record created here is a DEVELOPMENT PLACEHOLDER.
 * - `isSampleData` is TRUE and `verificationStatus` is UNVERIFIED on all rows.
 * - Names are prefixed "[SAMPLE]" so they can never be mistaken for real
 *   listings in the UI or in a demo.
 * - BEFORE THE FINAL DEMONSTRATION these records must be replaced with
 *   verified entries sourced from official institutions (RDB, RISA, NISR...).
 *
 * Coordinates used are the real geographic locations of Rwandan district
 * towns (public geographic facts), so the map behaves realistically.
 *
 * Run with: npx prisma db seed
 * The script is idempotent — safe to run repeatedly (skips existing records).
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import type {
  OpportunityCategory,
  RwandaProvince,
} from "../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

interface SampleOpportunity {
  name: string;
  description: string;
  category: OpportunityCategory;
  locationName: string;
  province: RwandaProvince;
  district: string;
  latitude: number;
  longitude: number;
  priceRwf: number | null;
  isFree: boolean;
  tags: string[];
  websiteUrl: string | null;
}

const opportunities: SampleOpportunity[] = [
  // ---------------- EDUCATION ----------------
  {
    name: "[SAMPLE] Intro to Robotics Workshop",
    description:
      "Placeholder record: a beginner-friendly weekend robotics workshop covering sensors, motors, and basic programming. Used to test goal matching for students interested in robotics on a small budget.",
    category: "EDUCATION",
    locationName: "Kigali City",
    province: "KIGALI_CITY",
    district: "Nyarugenge",
    latitude: -1.9441,
    longitude: 30.0619,
    priceRwf: 15000,
    isFree: false,
    tags: ["robotics", "workshop", "beginner", "students"],
    websiteUrl: null,
  },
  {
    name: "[SAMPLE] Free Introduction to Artificial Intelligence",
    description:
      "Placeholder record: an introductory AI course covering machine learning fundamentals, offered at no cost. Used to test free-resource matching for budget-conscious learners.",
    category: "EDUCATION",
    locationName: "Huye District, Southern Province",
    province: "SOUTHERN",
    district: "Huye",
    latitude: -2.6167,
    longitude: 29.75,
    priceRwf: null,
    isFree: true,
    tags: ["ai", "machine-learning", "course", "free"],
    websiteUrl: null,
  },
  {
    name: "[SAMPLE] University STEM Scholarship Program",
    description:
      "Placeholder record: a partial scholarship program for STEM undergraduates. Used to test matching for students seeking affordable higher education.",
    category: "EDUCATION",
    locationName: "Eastern Province",
    province: "EASTERN",
    district: "Rwamagana",
    latitude: -1.949,
    longitude: 30.4348,
    priceRwf: null,
    isFree: false,
    tags: ["scholarship", "stem", "university", "students"],
    websiteUrl: null,
  },

  // ---------------- TOURISM ----------------
  {
    name: "[SAMPLE] Volcano Scenic Viewpoint Trail",
    description:
      "Placeholder record: a guided half-day hike to a volcano viewpoint. Used to test tourism matching for nature and adventure goals.",
    category: "TOURISM",
    locationName: "Musanze District, Northern Province",
    province: "NORTHERN",
    district: "Musanze",
    latitude: -1.4996,
    longitude: 29.634,
    priceRwf: 25000,
    isFree: false,
    tags: ["hiking", "nature", "volcanoes", "adventure"],
    websiteUrl: null,
  },
  {
    name: "[SAMPLE] Lakeside Cultural Village Visit",
    description:
      "Placeholder record: a community-led cultural experience with traditional music, food, and crafts by the lake. Used to test cultural-experience matching for tourists.",
    category: "TOURISM",
    locationName: "Rubavu District, Western Province",
    province: "WESTERN",
    district: "Rubavu",
    latitude: -1.6792,
    longitude: 29.2228,
    priceRwf: 10000,
    isFree: false,
    tags: ["culture", "music", "food", "crafts", "community"],
    websiteUrl: null,
  },
  {
    name: "[SAMPLE] Free City Heritage Walking Tour",
    description:
      "Placeholder record: a self-guided walking tour of historic city landmarks, published as a free map. Used to test free tourism matching.",
    category: "TOURISM",
    locationName: "Kigali City",
    province: "KIGALI_CITY",
    district: "Kicukiro",
    latitude: -1.9498,
    longitude: 30.0946,
    priceRwf: null,
    isFree: true,
    tags: ["heritage", "walking-tour", "history", "free"],
    websiteUrl: null,
  },

  // ---------------- EVENT ----------------
  {
    name: "[SAMPLE] Annual Startup Founders Meetup",
    description:
      "Placeholder record: a one-day meetup connecting early-stage founders with mentors and investors. Used to test entrepreneur and networking goals.",
    category: "EVENT",
    locationName: "Kigali City",
    province: "KIGALI_CITY",
    district: "Gasabo",
    latitude: -1.9309,
    longitude: 30.1127,
    priceRwf: 5000,
    isFree: false,
    tags: ["startup", "networking", "entrepreneurs", "mentors"],
    websiteUrl: null,
  },
  {
    name: "[SAMPLE] Free Open-Source Tech Community Day",
    description:
      "Placeholder record: a free community day of talks and hands-on labs about open-source tools. Used to test developer and student goal matching.",
    category: "EVENT",
    locationName: "Kigali City",
    province: "KIGALI_CITY",
    district: "Nyarugenge",
    latitude: -1.9537,
    longitude: 30.0606,
    priceRwf: null,
    isFree: true,
    tags: ["open-source", "tech", "community", "free", "developers"],
    websiteUrl: null,
  },
  {
    name: "[SAMPLE] Agricultural Innovation Trade Fair",
    description:
      "Placeholder record: a regional fair where agri-tech startups showcase tools for farmers. Used to test business and innovation matching outside the capital.",
    category: "EVENT",
    locationName: "Nyagatare District, Eastern Province",
    province: "EASTERN",
    district: "Nyagatare",
    latitude: -1.2926,
    longitude: 30.3268,
    priceRwf: 2000,
    isFree: false,
    tags: ["agri-tech", "trade-fair", "innovation", "farmers"],
    websiteUrl: null,
  },

  // ---------------- BUSINESS ----------------
  {
    name: "[SAMPLE] Young Entrepreneurs Cooperative Network",
    description:
      "Placeholder record: a cooperative offering members shared equipment, training, and group savings. Used to test business-network goals.",
    category: "BUSINESS",
    locationName: "Muhanga District, Southern Province",
    province: "SOUTHERN",
    district: "Muhanga",
    latitude: -2.079,
    longitude: 29.755,
    priceRwf: null,
    isFree: false,
    tags: ["cooperative", "networking", "training", "youth"],
    websiteUrl: null,
  },
  {
    name: "[SAMPLE] Free Business Registration Clinic",
    description:
      "Placeholder record: free monthly sessions helping small businesses formalize their registration. Used to test entrepreneur support matching.",
    category: "BUSINESS",
    locationName: "Karongi District, Western Province",
    province: "WESTERN",
    district: "Karongi",
    latitude: -2.002,
    longitude: 29.347,
    priceRwf: null,
    isFree: true,
    tags: ["business", "registration", "support", "free", "sme"],
    websiteUrl: null,
  },

  // ---------------- RESEARCH ----------------
  {
    name: "[SAMPLE] Renewable Energy Research Center",
    description:
      "Placeholder record: a research center focused on solar and micro-grid projects, open to visiting researchers. Used to test researcher goal matching.",
    category: "RESEARCH",
    locationName: "Musanze District, Northern Province",
    province: "NORTHERN",
    district: "Musanze",
    latitude: -1.5021,
    longitude: 29.6085,
    priceRwf: null,
    isFree: false,
    tags: ["research", "renewable-energy", "solar", "academia"],
    websiteUrl: null,
  },
  {
    name: "[SAMPLE] Public Health Data Research Group",
    description:
      "Placeholder record: a group running community health surveys with public datasets. Used to test data-science and public-health research goals.",
    category: "RESEARCH",
    locationName: "Kigali City",
    province: "KIGALI_CITY",
    district: "Gasabo",
    latitude: -1.9586,
    longitude: 30.0932,
    priceRwf: null,
    isFree: false,
    tags: ["research", "health", "data", "surveys", "public-health"],
    websiteUrl: null,
  },
];

async function main() {
  // One dedicated source so every seed row is traceable to its origin.
  const source = await prisma.dataSource.upsert({
    where: { name: "ORYNTA Development Seed (placeholder data)" },
    update: {},
    create: {
      name: "ORYNTA Development Seed (placeholder data)",
      url: null,
      description:
        "Synthetic records created by the ORYNTA team solely for development and testing of the recommendation engine. Not real-world evidence.",
      citation:
        "ORYNTA Development Seed — replace with verified institutional sources before demonstration.",
      referencePeriod: "n/a (development data)",
      geographicCoverage:
        "Illustrative locations across all five provinces of Rwanda",
    },
  });

  let created = 0;
  for (const opportunity of opportunities) {
    // Note: no upsert here — `Opportunity.name` is intentionally NOT unique
    // (real programs could share a name), and upsert requires a unique key.
    // findFirst + create is still idempotent for seeding purposes.
    const existing = await prisma.opportunity.findFirst({
      where: { name: opportunity.name },
    });

    if (!existing) {
      await prisma.opportunity.create({
        data: {
          ...opportunity,
          sourceId: source.id,
          verificationStatus: "UNVERIFIED",
          isSampleData: true,
        },
      });
      created++;
    }
  }

  const total = await prisma.opportunity.count();
  const samples = await prisma.opportunity.count({
    where: { isSampleData: true },
  });

  console.log(`Seed finished: ${created} records processed.`);
  console.log(`Database now holds ${total} opportunities (${samples} sample).`);
}

main()
  .catch(async (e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
