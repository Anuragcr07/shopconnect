"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Link from "next/link";
import { useEffect, useState } from "react";
import MapComponent from "@/components/MapComponents"; // ✅ uses Leaflet + OpenStreetMap

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
  const [mapMarkers, setMapMarkers] = useState<
    { lat: number; lng: number; title: string; shopId: string }[]
  >([]);
  const [showMap, setShowMap] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [routeGeoJSON, setRouteGeoJSON] = useState<any>(null);

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
      setRouteGeoJSON(null); // reset route
      setMapCenter({ lat: shopkeeper.latitude, lng: shopkeeper.longitude });
      setMapMarkers([
        {
          lat: shopkeeper.latitude,
          lng: shopkeeper.longitude,
          title: shopkeeper.shopName || shopkeeper.name || "Shop",
          shopId: shopkeeper.id,
        },
      ]);
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
        setMapMarkers([
          { lat: start.lat, lng: start.lng, title: "You", shopId: "you" },
          { lat: end.lat, lng: end.lng, title: "Shop", shopId: "shop" },
        ]);
        setShowMap(true);
      } catch (err) {
        console.error("Error getting directions:", err);
        alert("Failed to get directions.");
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
      alert("Failed to fulfill post.");
    }
  };

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-80px)] bg-gray-900 text-gray-100">
        <p>Loading user session...</p>
      </div>
    );
  }

  if (!session || session.user.role !== "CUSTOMER") return null;

  return (
    <div className="min-h-[calc(100vh-80px)] bg-gray-900 text-gray-100 p-4 md:p-8 pt-20"> {/* Added pt-20 for navbar offset */}
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8">
          Welcome, <span className="text-blue-400">{session.user.name}</span>!
        </h1>

        <div className="mb-10 flex flex-col sm:flex-row justify-between items-center gap-4 p-4 bg-gray-800 rounded-lg shadow-xl border border-blue-700/50">
          <h2 className="text-3xl font-semibold text-gray-100">Your Requirements</h2>
          <Link href="/customer/posts/create">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-md shadow-md transition-colors text-lg">
              Post New Requirement
            </Button>
          </Link>
        </div>

        {loadingPosts ? (
          <p className="text-center text-gray-400 text-lg mt-10">Loading your active requests...</p>
        ) : posts.length === 0 ? (
          <div className="text-center text-gray-400 text-lg mt-10 p-6 bg-gray-800 rounded-lg shadow-lg border border-gray-700/50">
            <p className="mb-4">
              You haven't posted any requirements yet.
            </p>
            <Link href="/customer/posts/create">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md shadow-md transition-colors">
                Start by posting one!
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <Card key={post.id} className="flex flex-col bg-gray-800 border border-blue-700/50 shadow-xl text-gray-100">
                <h3 className="text-xl font-bold text-white mb-2">{post.title}</h3>
                <p className="text-gray-300 mb-4 text-sm">{post.description}</p>
                <div className="flex justify-between items-center text-sm text-gray-400 mb-4 border-t border-gray-700 pt-3">
                  <span>Posted: {new Date(post.createdAt).toLocaleDateString()}</span>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      post.status === "OPEN"
                        ? "bg-yellow-600 text-white"
                        : post.status === "FULFILLED"
                        ? "bg-green-600 text-white"
                        : "bg-gray-600 text-white"
                    }`}
                  >
                    {post.status}
                  </span>
                </div>

                {post.responses.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-700">
                    <h4 className="font-semibold text-gray-200 mb-3 text-lg">
                      Shop Responses ({post.responses.length}):
                    </h4>
                    {post.responses.map((response) => (
                      <div
                        key={response.id}
                        className="bg-gray-700 p-4 rounded-lg mb-3 shadow-md border border-gray-600"
                      >
                        <p className="font-medium text-white text-base">
                          {response.shopkeeper.shopName || response.shopkeeper.name}
                          {response.isAvailable && (
                            <span className="text-green-400 ml-2">(Available!)</span>
                          )}
                        </p>

                        {response.message && (
                          <p className="text-sm text-gray-300 italic mt-2">
                            "{response.message}"
                          </p>
                        )}

                        {/* 🖼️ Images */}
                        {response.imageUrls && response.imageUrls.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-3">
                            {response.imageUrls.map((url, idx) => (
                              <img
                                key={idx}
                                src={url}
                                alt={`Shop photo ${idx}`}
                                className="w-16 h-16 object-cover rounded-md border border-gray-500 cursor-pointer hover:opacity-80 transition-opacity"
                                onClick={() => setSelectedImage(url)}
                              />
                            ))}
                          </div>
                        )}

                        <div className="text-sm text-gray-400 mt-3 space-y-1">
                          <p>Address: {response.shopkeeper.address}</p>
                          <p>Phone: {response.shopkeeper.phone}</p>
                        </div>

                        {response.shopkeeper.latitude && response.shopkeeper.longitude && (
                          <div className="flex gap-3 mt-4">
                            <Button
                              variant="outline"
                              className="text-sm border-blue-500 text-blue-300 hover:bg-blue-900/40 hover:text-blue-200 py-1 px-3"
                              onClick={() => handleViewShopOnMap(response.shopkeeper)}
                            >
                              📍 View on map
                            </Button>
                            <Button
                              variant="outline"
                              className="text-sm border-green-500 text-green-300 hover:bg-green-900/40 hover:text-green-200 py-1 px-3"
                              onClick={() =>
                                handleGetDirections(
                                  response.shopkeeper.latitude,
                                  response.shopkeeper.longitude
                                )
                              }
                            >
                              🧭 Get Directions
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {post.status === "OPEN" && post.responses.length > 0 && (
                  <Button
                    onClick={() => handleFulfillPost(post.id)}
                    className="mt-6 w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded-md shadow-md transition-colors"
                  >
                    Mark as Fulfilled
                  </Button>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* 🗺 Map Modal */}
      {showMap && mapCenter && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-5xl h-[85vh] bg-gray-800 border border-blue-700/50 shadow-2xl rounded-lg flex flex-col relative p-6">
            <h3 className="text-2xl font-bold text-white mb-4">Shop Location</h3>
            <div className="flex-grow rounded-lg overflow-hidden border border-gray-600">
              <MapComponent center={mapCenter} markers={mapMarkers} routeGeoJSON={routeGeoJSON} />
            </div>
            <Button
              variant="outline"
              className="absolute top-4 right-4 text-red-400 border-red-500 hover:bg-red-900/40 hover:text-red-300 py-2 px-4 text-sm"
              onClick={() => setShowMap(false)}
            >
              Close Map
            </Button>
          </Card>
        </div>
      )}

      {/* 🖼 Image Preview Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <img
            src={selectedImage}
            alt="Response Preview"
            className="max-w-full max-h-[90vh] rounded-lg shadow-2xl border-4 border-blue-500"
          />
        </div>
      )}
    </div>
  );
}