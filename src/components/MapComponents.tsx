// components/MapComponent.tsx
"use client";

import { useEffect, useState } from "react";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, Popup, GeoJSON, useMap } from "react-leaflet";
import type { GeoJsonObject } from "geojson";
import "leaflet/dist/leaflet.css";

/* ─── Types ──────────────────────────────────────────────────────────────── */
interface MarkerData {
  lat: number;
  lng: number;
  title: string;
}

interface MapComponentProps {
  center: { lat: number; lng: number };
  markers?: MarkerData[];
  routeGeoJSON?: GeoJsonObject | null;
  zoom?: number;
}

/* ─── Leaflet Global Configurations ───────────────────────────────────────── */
if (typeof window !== "undefined") {
  // Fix broken default icons
  delete (L.Icon.Default.prototype as any)._getIconUrl;

  const svgPin = encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 44">
      <path d="M16 0C9.4 0 4 5.6 4 12.5C4 22.2 16 44 16 44S28 22.2 28 12.5C28 5.6 22.6 0 16 0Z"
        fill="#0077ff" stroke="white" stroke-width="2"/>
      <circle cx="16" cy="12.5" r="5.5" fill="white"/>
    </svg>`);

  L.Marker.prototype.options.icon = L.icon({
    iconUrl: `data:image/svg+xml,${svgPin}`,
    iconSize: [32, 44],
    iconAnchor: [16, 44],
    popupAnchor: [0, -46],
  });
}

/* ─── Helpers ────────────────────────────────────────────────────────────── */
function extractCoords(geo: GeoJsonObject): number[][] {
  const g = geo as any;
  if (g.type === "LineString" && Array.isArray(g.coordinates))
    return g.coordinates as number[][];
  if (g.type === "Feature" && g.geometry?.type === "LineString")
    return g.geometry.coordinates as number[][];
  if (g.type === "FeatureCollection") {
    for (const feature of g.features ?? []) {
      if (feature.geometry?.type === "LineString")
        return feature.geometry.coordinates as number[][];
    }
  }
  return [];
}

function bearing(a: [number, number], b: [number, number]): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLng = toRad(b[0] - a[0]);
  const lat1 = toRad(a[1]);
  const lat2 = toRad(b[1]);
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

/* ─── Arrow layer ────────────────────────────────────────────────────────── */
function ArrowLayer({ routeGeoJSON }: { routeGeoJSON: GeoJsonObject }) {
  const map = useMap();

  useEffect(() => {
    const rawCoords = extractCoords(routeGeoJSON);
    if (rawCoords.length < 2) return;

    const step = Math.max(1, Math.floor(rawCoords.length / 10));
    const arrowMarkers: L.Marker[] = [];

    for (let i = step; i < rawCoords.length - 1; i += step) {
      const from = rawCoords[i - 1] as [number, number];
      const to = rawCoords[i] as [number, number];
      const deg = bearing(from, to);

      const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
          <g transform="rotate(${deg}, 12, 12)">
            <polygon points="12,2 20,22 12,17 4,22" fill="#0077ff" stroke="#fff" stroke-width="1.5"/>
          </g>
        </svg>`;

      const icon = L.divIcon({
        html: svg,
        className: "",
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      const [lng, lat] = rawCoords[i];
      const m = L.marker([lat, lng], { icon, interactive: false }).addTo(map);
      arrowMarkers.push(m);
    }

    return () => {
      arrowMarkers.forEach((m) => map.removeLayer(m));
    };
  }, [map, routeGeoJSON]);

  return null;
}

/* ─── Main component ─────────────────────────────────────────────────────── */
export default function MapComponent({
  center,
  markers = [],
  routeGeoJSON,
  zoom = 14,
}: MapComponentProps) {
  const [isMounted, setIsMounted] = useState(false);

  // Only render on client
  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="h-full min-h-[400px] w-full animate-pulse bg-slate-100 rounded-lg" />
    );
  }

  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={zoom}
      style={{ height: "100%", minHeight: "400px", width: "100%" }}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
        subdomains="abcd"
        maxZoom={20}
      />

      {markers.map((m, i) => (
        <Marker key={i} position={[m.lat, m.lng]}>
          <Popup>{m.title}</Popup>
        </Marker>
      ))}

      {routeGeoJSON && (
        <>
          <GeoJSON
            key={JSON.stringify(routeGeoJSON)}
            data={routeGeoJSON}
            style={{
              color: "#0077ff",
              weight: 6,
              opacity: 0.9,
              lineCap: "round",
              lineJoin: "round",
            }}
          />
          <ArrowLayer routeGeoJSON={routeGeoJSON} />
        </>
      )}
    </MapContainer>
  );
}