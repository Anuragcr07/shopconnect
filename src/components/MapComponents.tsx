"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import type L from "leaflet";
import "leaflet/dist/leaflet.css";

// Dynamically import react-leaflet components (client-only)
const MapContainer = dynamic(
  () => import("react-leaflet").then((m) => m.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(() => import("react-leaflet").then((m) => m.TileLayer), { ssr: false });
const Marker = dynamic(() => import("react-leaflet").then((m) => m.Marker), { ssr: false });
const Popup = dynamic(() => import("react-leaflet").then((m) => m.Popup), { ssr: false });
const GeoJSON = dynamic(() => import("react-leaflet").then((m) => m.GeoJSON), { ssr: false });

interface MarkerData {
  lat: number;
  lng: number;
  title: string;
}

interface MapComponentProps {
  center: { lat: number; lng: number };
  markers?: MarkerData[];
  routeGeoJSON?: any; // expects GeoJSON FeatureCollection / Feature
  zoom?: number;
}

export default function MapComponent({
  center,
  markers = [],
  routeGeoJSON,
  zoom = 14,
}: MapComponentProps) {
  const [LModule, setLModule] = useState<typeof L | null>(null);
  const [mapReady, setMapReady] = useState(false);

  // Load leaflet at runtime and fix default icon paths
  useEffect(() => {
    let mounted = true;
    import("leaflet")
      .then((leaflet) => {
        // fix default icon paths when using CDN icons
        delete (leaflet.Icon.Default.prototype as any)._getIconUrl;
        leaflet.Icon.Default.mergeOptions({
          iconRetinaUrl:
            "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
          iconUrl:
            "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
          shadowUrl:
            "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
        });
        if (mounted) setLModule(leaflet);
      })
      .catch((err) => {
        console.error("Failed to load leaflet:", err);
      });
    return () => {
      mounted = false;
    };
  }, []);

  // Render placeholder until leaflet is ready (prevents SSR hydration issues)
  if (!LModule) {
    return <div className="h-[400px] w-full bg-gray-100 rounded-lg" />;
  }

  // NOTE: MapContainer & friends are loaded dynamically (client only)
  return (
    // @ts-ignore — MapContainer is dynamically imported, types get tricky; runtime is fine
    <MapContainer
      center={[center.lat, center.lng] as [number, number]}
      zoom={zoom}
      whenReady={() => setMapReady(true)}
      style={{ height: "400px", width: "100%" }}
    >
      {/* TileLayer attribution string must be a string */}
      {/* If you will use Mapbox replace url and attribution accordingly */}
      {/* OSM tile URL (free) */}
      {/* attribution uses escaped entities or plain HTML string */}
      {/* no TypeScript errors when using dynamic imports at runtime */}
      {/* @ts-ignore */}
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />

      {/* Markers */}
      {markers.map((m, i) => (
        // @ts-ignore
        <Marker key={i} position={[m.lat, m.lng] as [number, number]}>
          {/* @ts-ignore */}
          <Popup>{m.title}</Popup>
        </Marker>
      ))}

      {/* GeoJSON route (if provided). react-leaflet GeoJSON accepts a FeatureCollection or Feature */}
      {routeGeoJSON && (
        // @ts-ignore
        <GeoJSON data={routeGeoJSON} style={{ color: "#007bff", weight: 4 }} />
      )}
    </MapContainer>
  );
}
