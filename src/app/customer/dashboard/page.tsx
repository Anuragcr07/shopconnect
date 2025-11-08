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

  // Fetch all posts for this customer
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

  // 📍 Show static shop location (no route)
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

  // 🧭 Get driving directions via OpenRouteService
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
      <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
        Loading...
      </div>
    );
  }

  if (!session || session.user.role !== "CUSTOMER") return null;

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      <h1 className="text-4xl font-bold text-gray-900 mb-8">
        Welcome, <span className="text-primary-blue">{session.user.name}</span>!
      </h1>

      <div className="mb-8 flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-gray-800">Your Requirements</h2>
        <Link href="/customer/posts/create">
          <Button className="text-black">Post New Requirement</Button>
        </Link>
      </div>

      {loadingPosts ? (
        <p className="text-center text-gray-600">Loading your posts...</p>
      ) : posts.length === 0 ? (
        <p className="text-center text-gray-600">
          You haven't posted any requirements yet.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => (
            <Card key={post.id} className="flex flex-col">
              <h3 className="text-xl font-bold text-gray-800 mb-2">{post.title}</h3>
              <p className="text-gray-600 mb-4">{post.description}</p>
              <div className="flex justify-between items-center text-sm text-gray-500 mb-4">
                <span>Posted: {new Date(post.createdAt).toLocaleDateString()}</span>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    post.status === "OPEN"
                      ? "bg-yellow-100 text-yellow-800"
                      : post.status === "FULFILLED"
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {post.status}
                </span>
              </div>

              {post.responses.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <h4 className="font-semibold text-gray-700 mb-2">
                    Shop Responses:
                  </h4>
                  {post.responses.map((response) => (
                    <div
                      key={response.id}
                      className="bg-gray-50 p-3 rounded-lg mb-2 shadow-sm"
                    >
                      <p className="font-medium text-gray-800">
                        {response.shopkeeper.shopName || response.shopkeeper.name}
                        {response.isAvailable && (
                          <span className="text-green-600 ml-2">(Available!)</span>
                        )}
                      </p>

                      {response.message && (
                        <p className="text-sm text-gray-600 italic mt-1">
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
                              className="w-20 h-20 object-cover rounded-lg border border-gray-300 cursor-pointer hover:opacity-80"
                              onClick={() => setSelectedImage(url)}
                            />
                          ))}
                        </div>
                      )}

                      <div className="text-sm text-gray-700 mt-2 space-y-1">
                        <p>Address: {response.shopkeeper.address}</p>
                        <p>Phone: {response.shopkeeper.phone}</p>
                      </div>

                      {response.shopkeeper.latitude && response.shopkeeper.longitude && (
                        <div className="flex gap-2 mt-3">
                          <Button
                            variant="outline"
                            className="text-sm border-blue-600 text-blue-600 hover:bg-blue-50"
                            onClick={() => handleViewShopOnMap(response.shopkeeper)}
                          >
                            📍 View on map
                          </Button>
                          <Button
                            variant="outline"
                            className="text-sm border-green-600 text-green-600 hover:bg-green-50"
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
                  className="mt-4 w-full text-black"
                  variant="primary"
                >
                  Mark as Fulfilled
                </Button>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* 🗺 Map Modal */}
      {showMap && mapCenter && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-4xl h-3/4 flex flex-col relative">
            <h3 className="text-xl font-bold mb-4">Shop Location</h3>
            <div className="rounded-lg overflow-hidden">
              <MapComponent center={mapCenter} markers={mapMarkers} routeGeoJSON={routeGeoJSON} />
            </div>
            <Button
              variant="outline"
              className="absolute top-4 right-4 text-red-600 border-red-600 hover:bg-red-50 hover:text-red-600"
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
          className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50"
          onClick={() => setSelectedImage(null)}
        >
          <img
            src={selectedImage}
            alt="Preview"
            className="max-w-3xl max-h-[80vh] rounded-lg shadow-lg border-4 border-white"
          />
        </div>
      )}
    </div>
  );
}
