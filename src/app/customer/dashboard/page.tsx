"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Compass, MapPin, MessageCircle, PackageSearch, Plus, Store, X } from "lucide-react";
import Button from "@/components/ui/Button";
import dynamic from "next/dynamic";
import ChatWindow from "@/components/ChatWindow";

const MapComponent = dynamic(() => import("@/components/MapComponents"), { ssr: false });

interface Shopkeeper { id: string; shopName: string | null; latitude: number | null; longitude: number | null; }
interface ShopkeeperResponse { id: string; message: string; shopkeeper: Shopkeeper; }
interface CustomerPost {
  id: string;
  title: string;
  description: string;
  responses: ShopkeeperResponse[];
  customer?: {
    latitude: number | null;
    longitude: number | null;
  };
}
interface MapMarker { lat: number; lng: number; title: string; shopId?: string; }
interface ChatConfig { open: boolean; postId: string; shopId: string; recipientName: string; }

export default function CustomerDashboardPage() {
  const { data: session, status } = useSession();
  const [posts, setPosts] = useState<CustomerPost[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [mapMarkers, setMapMarkers] = useState<MapMarker[]>([]);
  const [showMap, setShowMap] = useState(false);
  const [routeGeoJSON, setRouteGeoJSON] = useState<GeoJSON.GeoJsonObject | null>(null);
  const [chatConfig, setChatConfig] = useState<ChatConfig | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") redirect("/login");
    if (status === "authenticated" && session?.user.role === "CUSTOMER") {
      fetch("/api/customer/posts")
        .then((response) => response.json())
        .then((data) => setPosts(Array.isArray(data) ? data : []))
        .catch((error) => console.error("Fetch error:", error))
        .finally(() => setLoadingPosts(false));
    }
  }, [status, session]);

  const handleGetDirections = (shopLat: number, shopLng: number) => {
    const getDirectionsWithStart = async (start: { lat: number; lng: number }) => {
      const end = { lat: shopLat, lng: shopLng };
      try {
        const response = await fetch("/api/directions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ start, end }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Failed to get route");
        setRouteGeoJSON(data as GeoJSON.GeoJsonObject);
        setMapCenter(start);
        setMapMarkers([
          { lat: start.lat, lng: start.lng, title: "You" },
          { lat: end.lat, lng: end.lng, title: "Shop" },
        ]);
        setShowMap(true);
      } catch (error) {
        console.error("Error getting directions:", error);
        alert("Could not calculate directions.");
      }
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          await getDirectionsWithStart({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        async (geoError) => {
          console.warn("Browser geolocation failed, trying saved location:", geoError);
          const savedLoc = posts.find((p) => p.customer?.latitude !== null && p.customer?.longitude !== null)?.customer;
          if (savedLoc?.latitude !== null && savedLoc?.longitude !== null && savedLoc?.latitude !== undefined && savedLoc?.longitude !== undefined) {
            await getDirectionsWithStart({
              lat: savedLoc.latitude,
              lng: savedLoc.longitude,
            });
          } else {
            alert("Could not retrieve your location. Please check your browser location permissions.");
          }
        },
        { timeout: 8000 }
      );
    } else {
      const savedLoc = posts.find((p) => p.customer?.latitude !== null && p.customer?.longitude !== null)?.customer;
      if (savedLoc?.latitude !== null && savedLoc?.longitude !== null && savedLoc?.latitude !== undefined && savedLoc?.longitude !== undefined) {
        getDirectionsWithStart({
          lat: savedLoc.latitude,
          lng: savedLoc.longitude,
        });
      } else {
        alert("Geolocation is not supported by your browser and no saved location was found.");
      }
    }
  };

  const handleViewShopOnMap = (shop: Shopkeeper) => {
    if (shop.latitude === null || shop.longitude === null) return alert("This shop has not shared a location.");
    setRouteGeoJSON(null);
    setMapCenter({ lat: shop.latitude, lng: shop.longitude });
    setMapMarkers([{ lat: shop.latitude, lng: shop.longitude, title: shop.shopName || "Shop", shopId: shop.id }]);
    setShowMap(true);
  };

  if (status === "loading" || loadingPosts) {
    return <div className="grid min-h-[65vh] place-items-center bg-slate-50"><div className="text-center"><div className="mx-auto size-10 animate-spin rounded-full border-4 border-indigo-100 border-t-indigo-600" /><p className="mt-4 text-sm font-semibold text-slate-500">Loading your requests…</p></div></div>;
  }

  const totalOffers = posts.reduce((sum, post) => sum + post.responses.length, 0);

  return (
    <div className="min-h-screen bg-slate-50 py-8 sm:py-12">
      <div className="page-shell">
        <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div><p className="text-sm font-bold text-indigo-600">Customer dashboard</p><h1 className="mt-1 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Hello{session?.user?.name ? `, ${session.user.name.split(" ")[0]}` : ""}</h1><p className="mt-2 text-slate-600">Track your requests and compare nearby offers.</p></div>
          <Link href="/customer/posts/create" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 font-bold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700"><Plus className="size-4" /> New request</Link>
        </header>

        <div className="mt-8 grid grid-cols-2 gap-3 sm:max-w-lg sm:gap-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5"><PackageSearch className="size-5 text-indigo-600" /><p className="mt-4 text-2xl font-black text-slate-950">{posts.length}</p><p className="text-xs font-semibold text-slate-500 sm:text-sm">Active requests</p></div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5"><Store className="size-5 text-orange-500" /><p className="mt-4 text-2xl font-black text-slate-950">{totalOffers}</p><p className="text-xs font-semibold text-slate-500 sm:text-sm">Local offers</p></div>
        </div>

        {posts.length === 0 ? (
          <div className="mt-8 rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center sm:py-20"><span className="mx-auto grid size-16 place-items-center rounded-2xl bg-indigo-50 text-indigo-600"><PackageSearch className="size-8" /></span><h2 className="mt-5 text-xl font-extrabold text-slate-950">What are you looking for?</h2><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">Create your first request and let nearby shopkeepers tell you what is available.</p><Link href="/customer/posts/create" className="mt-6 inline-flex items-center gap-2 font-bold text-indigo-600">Create a request <ArrowRight className="size-4" /></Link></div>
        ) : (
          <div className="mt-8 space-y-5">
            {posts.map((post) => (
              <article key={post.id} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 p-5 sm:p-6"><div className="flex flex-wrap items-start justify-between gap-3"><div><span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700">Open request</span><h2 className="mt-3 text-xl font-extrabold text-slate-950 sm:text-2xl">{post.title}</h2></div><span className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold text-slate-600">{post.responses.length} {post.responses.length === 1 ? "offer" : "offers"}</span></div>{post.description && <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">{post.description}</p>}</div>
                <div className="space-y-3 p-4 sm:p-6">
                  {post.responses.length === 0 ? <div className="rounded-2xl bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">Waiting for nearby shops to respond.</div> : post.responses.map((response) => (
                    <div key={response.id} className="rounded-2xl border border-slate-200 p-4 transition hover:border-indigo-200 hover:bg-indigo-50/20 sm:p-5">
                      <div className="flex items-start gap-3"><span className="grid size-11 shrink-0 place-items-center rounded-xl bg-slate-950 text-white"><Store className="size-5" /></span><div className="min-w-0"><p className="font-extrabold text-slate-900">{response.shopkeeper.shopName || "Local shop"}</p><p className="mt-1 text-sm leading-6 text-slate-600">&ldquo;{response.message}&rdquo;</p></div></div>
                      <div className="mt-4 grid grid-cols-3 gap-2">
                        <Button variant="outline" className="min-w-0 px-2 text-xs sm:text-sm" onClick={() => handleViewShopOnMap(response.shopkeeper)}><MapPin className="size-4" /><span className="hidden sm:inline">Map</span></Button>
                        <Button variant="outline" className="min-w-0 px-2 text-xs sm:text-sm" onClick={() => response.shopkeeper.latitude !== null && response.shopkeeper.longitude !== null && handleGetDirections(response.shopkeeper.latitude, response.shopkeeper.longitude)}><Compass className="size-4" /><span className="hidden sm:inline">Directions</span></Button>
                        <Button className="min-w-0 px-2 text-xs sm:text-sm" onClick={() => setChatConfig({ open: true, postId: post.id, shopId: response.shopkeeper.id, recipientName: response.shopkeeper.shopName || "Shopkeeper" })}><MessageCircle className="size-4" /><span className="hidden sm:inline">Chat</span></Button>
                      </div>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {showMap && mapCenter && <div className="fixed inset-0 z-[60] flex items-end bg-slate-950/70 p-0 backdrop-blur-sm sm:items-center sm:justify-center sm:p-6"><div className="relative h-[80vh] w-full overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:h-[75vh] sm:max-w-5xl sm:rounded-3xl"><MapComponent center={mapCenter} markers={mapMarkers} routeGeoJSON={routeGeoJSON} /><button aria-label="Close map" className="absolute right-3 top-3 grid size-11 place-items-center rounded-xl bg-white text-slate-700 shadow-lg" onClick={() => setShowMap(false)}><X className="size-5" /></button></div></div>}
      {chatConfig && <ChatWindow isOpen={chatConfig.open} customerPostId={chatConfig.postId} shopkeeperId={chatConfig.shopId} recipientName={chatConfig.recipientName} onClose={() => setChatConfig(null)} />}
    </div>
  );
}
