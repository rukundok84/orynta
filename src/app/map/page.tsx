import { Suspense } from "react";
import type { Metadata } from "next";
import { db } from "@/modules/db/client";
import {
  OpportunityMap,
  type MapOpportunity,
} from "@/components/map/opportunity-map";

export const metadata: Metadata = {
  title: "Opportunity Map — ORYNTA",
  description: "Explore opportunities across Rwanda on an interactive map.",
};

/**
 * Async server component: fetches opportunities and passes a lean,
 * serialized subset to the client map. Wrapped in <Suspense> because with
 * Next 16's cacheComponents, request-time data must be inside a Suspense
 * boundary (otherwise the build fails: the page can't be prerendered).
 */
async function MapData() {
  const records = await db.opportunity.findMany({
    orderBy: { createdAt: "asc" },
  });

  // Serialize: drop Prisma Dates and other fields the map doesn't use.
  const opportunities: MapOpportunity[] = records.map((o) => ({
    id: o.id,
    name: o.name,
    category: o.category,
    locationName: o.locationName,
    province: o.province,
    latitude: o.latitude,
    longitude: o.longitude,
    isFree: o.isFree,
    priceRwf: o.priceRwf,
    tags: o.tags,
    isSampleData: o.isSampleData,
    sourceName: "", // populated below only if needed later
  }));

  return <OpportunityMap opportunities={opportunities} />;
}

export default function MapPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">
        Opportunity map
      </h1>
      <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
        Every geocoded opportunity in the dataset, positioned at its real
        district location. Filter by category and province, then click a
        marker or list item to explore.
      </p>

      <div className="mt-6">
        <Suspense
          fallback={
            <div className="h-[560px] animate-pulse rounded-xl border border-border bg-muted" />
          }
        >
          <MapData />
        </Suspense>
      </div>
    </div>
  );
}
