"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Link from "next/link";
import { useEffect, useState } from "react";
import MapComponent from "@/components/MapComponents";
import ChatWindow from "@/components/ChatWindow";

export default function CustomerDashboardPage() {
  const { data: session, status } = useSession();
  const [posts, setPosts] = useState<any[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [mapMarkers, setMapMarkers] = useState<any[]>([]);
  const [showMap, setShowMap] = useState(false);
  const [routeGeoJSON, setRouteGeoJSON] = useState<any>(null); // This holds the line for the map
  const [chatConfig, setChatConfig] = useState<any>(null);

  useEffect(() => {
    if (status === "unauthenticated") redirect("/login");
    if (status === "authenticated" && session?.user.role === "CUSTOMER") {
      fetchCustomerPosts();
    }
  }, [status, session]);

  const fetchCustomerPosts = async () => {
    try {
      const response = await fetch("/api/customer/posts");
      const data = await response.json();
      setPosts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoadingPosts(false);
    }
  };

  // ✅ NEW: DIRECTION FEATURE LOGIC
  const handleGetDirections = async (shopLat: number, shopLng: number) => {
    // 1. Check if browser supports GPS
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    // 2. Get User's Current Position
    navigator.geolocation.getCurrentPosition(async (position) => {
      const start = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      };
      const end = { lat: shopLat, lng: shopLng };

      try {
        // 3. Call your backend directions API
        const res = await fetch("/api/directions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ start, end }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to get route");

        // 4. Update Map with the route and markers
        setRouteGeoJSON(data); // This is the path line
        setMapCenter(start); // Center map on the User
        setMapMarkers([
          { lat: start.lat, lng: start.lng, title: "You", shopId: "user" },
          { lat: end.lat, lng: end.lng, title: "Shop", shopId: "shop" }
        ]);
        setShowMap(true);
      } catch (err) {
        console.error("Error getting directions:", err);
        alert("Could not calculate directions.");
      }
    });
  };

  const handleViewShopOnMap = (shop: any) => {
    setRouteGeoJSON(null); // Clear previous routes
    setMapCenter({ lat: shop.latitude, lng: shop.longitude });
    setMapMarkers([{ lat: shop.latitude, lng: shop.longitude, title: shop.shopName, shopId: shop.id }]);
    setShowMap(true);
  };

  if (status === "loading" || loadingPosts) return <p className="p-20 text-white text-center">Loading...</p>;

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-4 md:p-8 pt-24">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-10">
          <h1 className="text-3xl font-bold">My Dashboard</h1>
          <Link href="/customer/posts/create"><Button className="bg-blue-600">+ New Requirement</Button></Link>
        </div>

        {posts.map((post) => (
          <Card key={post.id} className="mb-8 bg-gray-800 border-blue-700/30 p-6">
            <h3 className="text-2xl font-bold text-blue-400 mb-2">{post.title}</h3>
            <p className="text-gray-300 mb-6">{post.description}</p>

            <div className="space-y-4">
              <h4 className="font-semibold text-gray-400 text-xs uppercase">Offers</h4>
              {(post.responses || []).map((res: any) => (
                <div key={res.id} className="bg-gray-900/50 p-5 rounded-xl border border-gray-700 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="flex-1">
                    <p className="font-bold text-white">{res.shopkeeper?.shopName}</p>
                    <p className="text-sm text-gray-400 italic">"{res.message}"</p>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* View on Map Button */}
                    <Button variant="outline" className="text-xs border-blue-500/50 text-blue-400" onClick={() => handleViewShopOnMap(res.shopkeeper)}>
                      📍 Map
                    </Button>

                    {/* ✅ NEW DIRECTIONS BUTTON */}
                    <Button 
                      variant="outline" 
                      className="text-xs border-green-500/50 text-green-400 hover:bg-green-900/20" 
                      onClick={() => handleGetDirections(res.shopkeeper.latitude, res.shopkeeper.longitude)}
                    >
                      🧭 Directions
                    </Button>

                    <Button 
                      variant="outline" 
                      className="text-xs border-purple-500/50 text-purple-400"
                      onClick={() => setChatConfig({
                        open: true,
                        postId: post.id,
                        shopId: res.shopkeeper.id,
                        recipientName: res.shopkeeper.shopName
                      })}
                    >
                      💬 Chat
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>

      {/* Map Modal */}
      {showMap && mapCenter && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-5xl h-[80vh] bg-gray-800 relative">
            <MapComponent center={mapCenter} markers={mapMarkers} routeGeoJSON={routeGeoJSON} />
            <Button className="absolute top-4 right-4 bg-red-600" onClick={() => setShowMap(false)}>Close</Button>
          </Card>
        </div>
      )}

      {chatConfig && (
        <ChatWindow
          isOpen={chatConfig.open}
          customerPostId={chatConfig.postId}
          shopkeeperId={chatConfig.shopId}
          recipientName={chatConfig.recipientName}
          onClose={() => setChatConfig(null)}
        />
      )}
    </div>
  );
}