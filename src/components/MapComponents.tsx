"use client";

import React, { useEffect, useRef, useState } from "react";
import { Loader } from "@googlemaps/js-api-loader";

/// <reference types="@types/google.maps" />

declare module "@googlemaps/js-api-loader" {
  interface Loader {
    importLibrary: (library: string) => Promise<any>;
  }
}


interface MapComponentProps {
  center: { lat: number; lng: number };
  markers?: { lat: number; lng: number; title: string; shopId?: string }[];
  zoom?: number;
}

const MapComponent: React.FC<MapComponentProps> = ({ center, markers = [], zoom = 14 }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const mapMarkersRef = useRef<google.maps.Marker[]>([]);

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
      console.error("Google Maps API Key is not set in NEXT_PUBLIC_GOOGLE_MAPS_API_KEY.");
      return;
    }

    const loader = new Loader({
      apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as string,
      version: "weekly",
    });

    let isMounted = true;

    (async () => {
      try {
        const { Map } = await loader.importLibrary("maps"); // ✅ modern method
        if (isMounted && mapRef.current) {
          const googleMap = new Map(mapRef.current, {
            center,
            zoom,
            fullscreenControl: false,
            streetViewControl: false,
            mapTypeControl: false,
          });
          setMap(googleMap);
        }
      } catch (err) {
        console.error("Error loading Google Maps API:", err);
      }
    })();

    return () => {
      isMounted = false;
      mapMarkersRef.current.forEach((marker) => marker.setMap(null));
      mapMarkersRef.current = [];
    };
  }, []);

  useEffect(() => {
    if (map) {
      mapMarkersRef.current.forEach((marker) => marker.setMap(null));
      mapMarkersRef.current = [];

      map.setCenter(center);
      map.setZoom(zoom);

      markers.forEach((markerData) => {
        const marker = new google.maps.Marker({
          position: markerData,
          map,
          title: markerData.title,
        });
        mapMarkersRef.current.push(marker);
      });
    }
  }, [map, center, markers, zoom]);

  return <div ref={mapRef} className="w-full h-full rounded-lg" style={{ minHeight: "300px" }} />;
};

export default MapComponent;
