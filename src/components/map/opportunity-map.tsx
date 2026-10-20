"use client";

import { useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import type { Map as LeafletMap } from "leaflet";
import "leaflet/dist/leaflet.css";
import { formatRwf, labelProvince } from "@/modules/recommendations/format";

/**
 * A client-safe, serialized shape of an opportunity.
 * Deliberately NOT the Prisma type: the server page passes only these
 * fields, which keeps the payload small and the boundary explicit.
 */
export interface MapOpportunity {
  id: string;
  name: string;
  category: "EDUCATION" | "TOURISM" | "EVENT" | "BUSINESS" | "RESEARCH";
  locationName: string;
  province: "KIGALI_CITY" | "SOUTHERN" | "NORTHERN" | "EASTERN" | "WESTERN";
  latitude: number | null;
  longitude: number | null;
  isFree: boolean;
  priceRwf: number | null;
  tags: string[];
  isSampleData: boolean;
  sourceName: string;
}

const CATEGORY_COLORS: Record<MapOpportunity["category"], string> = {
  EDUCATION: "#2563eb",
  TOURISM: "#16a34a",
  EVENT: "#d97706",
  BUSINESS: "#9333ea",
  RESEARCH: "#dc2626",
};

const CATEGORIES = Object.keys(CATEGORY_COLORS) as Array<
  MapOpportunity["category"]
>;
const PROVINCES: Array<MapOpportunity["province"]> = [
  "KIGALI_CITY",
  "SOUTHERN",
  "NORTHERN",
  "EASTERN",
  "WESTERN",
];

/** Rwanda's rough geographic center — a sensible initial view. */
const RWANDA_CENTER: [number, number] = [-1.94, 29.87];

function PriceLabel({ isFree, priceRwf }: { isFree: boolean; priceRwf: number | null }) {
  if (isFree) return <span className="text-green-600">Free</span>;
  if (priceRwf === null) return <span className="text-muted-foreground">Price not published</span>;
  return <span>{formatRwf(priceRwf)}</span>;
}

export function OpportunityMap({ opportunities }: { opportunities: MapOpportunity[] }) {
  const [category, setCategory] = useState<MapOpportunity["category"] | "ALL">("ALL");
  const [province, setProvince] = useState<MapOpportunity["province"] | "ALL">("ALL");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);

  const filtered = useMemo(
    () =>
      opportunities.filter(
        (o) =>
          (category === "ALL" || o.category === category) &&
          (province === "ALL" || o.province === province),
      ),
    [opportunities, category, province],
  );

  const withCoords = filtered.filter(
    (o): o is MapOpportunity & { latitude: number; longitude: number } =>
      o.latitude !== null && o.longitude !== null,
  );

  function focusOpportunity(opportunity: MapOpportunity) {
    setSelectedId(opportunity.id);
    if (opportunity.latitude !== null && opportunity.longitude !== null) {
      mapRef.current?.flyTo([opportunity.latitude, opportunity.longitude], 12, {
        duration: 0.8,
      });
    }
  }

  return (
    <div>
      {/* ---- Filters ---- */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setCategory("ALL")}
            className={`rounded-full border px-3 py-1 text-xs ${category === "ALL" ? "bg-foreground text-background" : "border-border text-muted-foreground hover:bg-muted"}`}
          >
            All categories
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs ${category === c ? "bg-foreground text-background" : "border-border text-muted-foreground hover:bg-muted"}`}
            >
              <span
                className="size-2 rounded-full"
                style={{ backgroundColor: CATEGORY_COLORS[c] }}
              />
              {c}
            </button>
          ))}
        </div>
        <select
          value={province}
          onChange={(e) => setProvince(e.target.value as typeof province)}
          className="rounded-lg border border-input bg-background px-2 py-1 text-xs outline-none"
        >
          <option value="ALL">All provinces</option>
          {PROVINCES.map((p) => (
            <option key={p} value={p}>
              {labelProvince(p)}
            </option>
          ))}
        </select>
      </div>

      {/* ---- Map + list side by side ---- */}
      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="h-[560px] overflow-hidden rounded-xl border border-border">
          <MapContainer
            center={RWANDA_CENTER}
            zoom={8}
            className="h-full w-full"
            ref={mapRef}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {withCoords.map((opportunity) => (
              <CircleMarker
                key={opportunity.id}
                center={[opportunity.latitude, opportunity.longitude]}
                radius={selectedId === opportunity.id ? 12 : 9}
                pathOptions={{
                  color: CATEGORY_COLORS[opportunity.category],
                  weight: selectedId === opportunity.id ? 3 : 2,
                  fillColor: CATEGORY_COLORS[opportunity.category],
                  fillOpacity: 0.85,
                }}
                eventHandlers={{
                  click: () => setSelectedId(opportunity.id),
                }}
              >
                <Popup>
                  <strong>{opportunity.name}</strong>
                  <br />
                  {opportunity.locationName}
                  <br />
                  <PriceLabel isFree={opportunity.isFree} priceRwf={opportunity.priceRwf} />
                  {opportunity.isSampleData && (
                    <>
                      <br />
                      <em>Sample record — not verified</em>
                    </>
                  )}
                </Popup>
              </CircleMarker>
            ))}
          </MapContainer>
        </div>

        {/* ---- List ---- */}
        <div className="h-[560px] overflow-y-auto rounded-xl border border-border">
          <p className="border-b border-border px-4 py-2 text-xs text-muted-foreground">
            {filtered.length} shown · {withCoords.length} on map
          </p>
          <ul>
            {filtered.map((opportunity) => (
              <li key={opportunity.id}>
                <button
                  type="button"
                  onClick={() => focusOpportunity(opportunity)}
                  className={`w-full border-b border-border px-4 py-3 text-left hover:bg-muted ${selectedId === opportunity.id ? "bg-muted" : ""}`}
                >
                  <span className="flex items-center gap-2">
                    <span
                      className="size-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: CATEGORY_COLORS[opportunity.category] }}
                    />
                    <span className="text-sm font-medium">{opportunity.name}</span>
                  </span>
                  <span className="mt-1 block text-xs text-muted-foreground">
                    {opportunity.locationName}
                    {opportunity.latitude === null && " · not geocoded"}
                  </span>
                </button>
              </li>
            ))}
            {filtered.length === 0 && (
              <li className="px-4 py-6 text-sm text-muted-foreground">
                No opportunities match these filters.
              </li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
