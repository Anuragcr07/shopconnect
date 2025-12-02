"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Link from "next/link";
import { useEffect, useState } from "react";
import MapComponent from "@/components/MapComponents";
import ChatWindow from "@/components/ChatWindow"; // ✅ Added Import

interface ShopkeeperInfo {
  id: string;
  name: string;
  shopName: string;
  address: string;
  phone: string;
  latitude: number;
  longitude: number;
}

interface ShopRequest {
  id: string;
  isAvailable: boolean;
  message: string;
  imageUrls?: string[];
  shopkeeper: ShopkeeperInfo;
}

interface CustomerPost {
  id: string;
  title: string;
  description: string;
  status: string;
  createdAt: string;
  responses: ShopRequest[];
}

export default function CustomerDashboardPage() {
  const { data: session, status } = useSession();
  const [posts, setPosts] = useState<CustomerPost[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [mapMarkers, setMapMarkers] = useState<{ lat: number; lng: number; title: string; shopId: string }[]>([]);
  const [showMap, setShowMap] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [routeGeoJSON, setRouteGeoJSON] = useState<any>(null);

  // ✅ New State for Chat
  const [chatConfig, setChatConfig] = useState<{ open: boolean; postId: string; shopId: string; recipientName: string } | null>(null);

  useEffect(() => {
    if (status === "authenticated" && session?.user.role !== "CUSTOMER") {
      redirect("/shopkeeper/dashboard");
    }
    if (status === "authenticated" && session?.user.role === "CUSTOMER") {
      fetchCustomerPosts();
    }
  }, [status, session]);

  const fetchCustomerPosts = async () => {
    setLoadingPosts(true);
    try {
      const response = await fetch("/api/customer/posts");
      if (!response.ok) throw new Error("Failed to fetch customer posts");
      const data: CustomerPost[] = await response.json();
      setPosts(data);
    } catch (error) {
      console.error("Error fetching customer posts:", error);
    } finally {
      setLoadingPosts(false);
    }
  };

  const handleViewShopOnMap = (shopkeeper: ShopkeeperInfo) => {
    if (shopkeeper.latitude && shopkeeper.longitude) {
      setRouteGeoJSON(null);
      setMapCenter({ lat: shopkeeper.latitude, lng: shopkeeper.longitude });
      setMapMarkers([{ lat: shopkeeper.latitude, lng: shopkeeper.longitude, title: shopkeeper.shopName || shopkeeper.name || "Shop", shopId: shopkeeper.id }]);
      setShowMap(true);
    }
  };

  const handleGetDirections = async (shopLat: number, shopLng: number) => {
    if (!navigator.geolocation) {
      alert("Your browser does not support geolocation.");
      return;
    }
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const start = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      const end = { lat: shopLat, lng: shopLng };
      try {
        const res = await fetch("/api/directions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ start, end }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to get route");
        setRouteGeoJSON(data);
        setMapCenter(start);
        setMapMarkers([{ lat: start.lat, lng: start.lng, title: "You", shopId: "you" }, { lat: end.lat, lng: end.lng, title: "Shop", shopId: "shop" }]);
        setShowMap(true);
      } catch (err) {
        console.error("Error getting directions:", err);
      }
    });
  };

  const handleFulfillPost = async (postId: string) => {
    if (!confirm("Are you sure you want to mark this post as fulfilled?")) return;
    try {
      const response = await fetch(`/api/customer/posts/${postId}/fulfill`, { method: "PATCH" });
      if (!response.ok) throw new Error("Failed to fulfill post");
      fetchCustomerPosts();
    } catch (error) {
      console.error("Error fulfilling post:", error);
    }
  };

  if (status === "loading") return <p className="p-8 text-white">Loading...</p>;
  if (!session || session.user.role !== "CUSTOMER") return null;

  return (
    <div className="min-h-[calc(100vh-80px)] bg-gray-900 text-gray-100 p-4 md:p-8 pt-20">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8">Welcome, <span className="text-blue-400">{session.user.name}</span>!</h1>
        <div className="mb-10 flex justify-between items-center bg-gray-800 p-4 rounded-lg border border-blue-700/50">
          <h2 className="text-3xl font-semibold">Your Requirements</h2>
          <Link href="/customer/posts/create"><Button className="bg-blue-600 text-white">Post New Requirement</Button></Link>
        </div>

        {loadingPosts ? <p>Loading...</p> : posts.map((post) => (
          <Card key={post.id} className="mb-6 bg-gray-800 border border-blue-700/50 p-6">
            <h3 className="text-xl font-bold text-white">{post.title}</h3>
            <p className="text-gray-300">{post.description}</p>
            <div className="mt-4">
              <h4 className="font-semibold text-gray-200">Responses:</h4>
              {post.responses.map((response) => (
                <div key={response.id} className="bg-gray-700 p-4 rounded-lg mt-3 border border-gray-600">
                  <p className="font-medium text-white">{response.shopkeeper.shopName || response.shopkeeper.name} {response.isAvailable && <span className="text-green-400">(Available!)</span>}</p>
                  <p className="text-sm text-gray-300 italic">"{response.message}"</p>
                  
                  {/* Images */}
                  {response.imageUrls && <div className="flex gap-2 mt-2">{response.imageUrls.map((url, i) => <img key={i} src={url} className="w-16 h-16 rounded object-cover cursor-pointer" onClick={() => setSelectedImage(url)} />)}</div>}

                  <div className="flex gap-3 mt-4">
                    <Button variant="outline" className="text-sm text-blue-300 border-blue-500" onClick={() => handleViewShopOnMap(response.shopkeeper)}>📍 Map</Button>
                    <Button variant="outline" className="text-sm text-green-300 border-green-500" onClick={() => handleGetDirections(response.shopkeeper.latitude, response.shopkeeper.longitude)}>🧭 Directions</Button>
                    
                    {/* ✅ CHAT BUTTON */}
                    <Button 
                      variant="outline" 
                      className="text-sm text-purple-300 border-purple-500 hover:bg-purple-900/40"
                      onClick={() => setChatConfig({
                        open: true,
                        postId: post.id,
                        shopId: response.shopkeeper.id,
                        recipientName: response.shopkeeper.shopName || response.shopkeeper.name
                      })}
                    >
                      💬 Chat
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            {post.status === "OPEN" && post.responses.length > 0 && <Button onClick={() => handleFulfillPost(post.id)} className="mt-4 w-full bg-green-600">Mark Fulfilled</Button>}
          </Card>
        ))}
      </div>

      {/* Map Modal */}
      {showMap && mapCenter && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-5xl h-[85vh] bg-gray-800 relative p-6">
            <MapComponent center={mapCenter} markers={mapMarkers} routeGeoJSON={routeGeoJSON} />
            <Button className="absolute top-4 right-4 bg-red-600" onClick={() => setShowMap(false)}>Close</Button>
          </Card>
        </div>
      )}

      {/* Image Preview */}
      {selectedImage && <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setSelectedImage(null)}><img src={selectedImage} className="max-w-full max-h-[90vh]" /></div>}

      {/* ✅ Chat Window */}
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