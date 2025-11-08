"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { useEffect, useState } from "react";
import { Textarea } from "@/components/ui/Textarea";
import CameraUploader from "@/components/CameraUploader"; // Webcam uploader

interface CustomerPost {
  id: string;
  title: string;
  description: string;
  status: string;
  createdAt: string;
  customer: {
    id: string;
    name: string;
    email: string;
  };
  responses: {
    id: string;
    shopkeeperId: string;
    isAvailable: boolean;
    message: string | null;
  }[];
}

export default function ShopkeeperDashboardPage() {
  const { data: session, status } = useSession();

  const [requests, setRequests] = useState<CustomerPost[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [responseMessage, setResponseMessage] = useState<{ [key: string]: string }>({});
  const [uploadedImages, setUploadedImages] = useState<{ [key: string]: string[] }>({});
  const [savingLocation, setSavingLocation] = useState(false);
  const [shopLocation, setShopLocation] = useState<{ lat: number; lng: number } | null>(null);

  // ✅ Redirect non-shopkeepers & fetch requests + location
  useEffect(() => {
    if (status === "authenticated" && session?.user.role !== "SHOPKEEPER") {
      redirect("/customer/dashboard");
    }
    if (status === "authenticated" && session?.user.role === "SHOPKEEPER") {
      fetchShopRequests();
      fetchLocation();
    }
  }, [status, session]);

  /** 🧭 Fetch shopkeeper’s saved location from DB */
  const fetchLocation = async () => {
    try {
      const res = await fetch("/api/shopkeeper/location");
      if (!res.ok) return;
      const data = await res.json();
      if (data.latitude && data.longitude) {
        setShopLocation({ lat: data.latitude, lng: data.longitude });
      }
    } catch (err) {
      console.error("Failed to load shopkeeper location:", err);
    }
  };

  /** 🧾 Fetch all customer posts for shopkeepers */
  const fetchShopRequests = async () => {
    setLoadingRequests(true);
    try {
      const response = await fetch("/api/shopkeeper/requests");
      if (!response.ok) throw new Error("Failed to fetch shop requests");
      const data = await response.json();
      setRequests(data);
    } catch (error) {
      console.error("Error fetching shop requests:", error);
    } finally {
      setLoadingRequests(false);
    }
  };

  /** 📦 Respond to customer’s request (with message + images) */
  const handleRespondToRequest = async (postId: string, isAvailable: boolean) => {
    try {
      const response = await fetch(`/api/shopkeeper/availability`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerPostId: postId,
          isAvailable,
          message: responseMessage[postId] || null,
          imageUrls: uploadedImages[postId] || [],
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to send response");
      }

      // reset after submission
      setResponseMessage((prev) => {
        const newState = { ...prev };
        delete newState[postId];
        return newState;
      });

      setUploadedImages((prev) => {
        const newState = { ...prev };
        delete newState[postId];
        return newState;
      });

      fetchShopRequests();
      alert("✅ Response sent successfully!");
    } catch (error: any) {
      console.error("Error responding to request:", error);
      alert(error.message || "Failed to send response.");
    }
  };

  /** 📍 Save shopkeeper location via GPS */
  const handleSaveLocation = async () => {
    if (!navigator.geolocation) {
      alert("❌ Geolocation is not supported by your browser.");
      return;
    }

    setSavingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;

        try {
          const res = await fetch("/api/shopkeeper/location", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ latitude, longitude }),
          });

          if (!res.ok) throw new Error("Failed to save location");
          alert("✅ Location updated successfully!");
          setShopLocation({ lat: latitude, lng: longitude });
        } catch (error) {
          console.error("Error saving location:", error);
          alert("❌ Failed to update location.");
        } finally {
          setSavingLocation(false);
        }
      },
      (err) => {
        alert("❌ Failed to get location: " + err.message);
        setSavingLocation(false);
      }
    );
  };

  // Loading
  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
        Loading...
      </div>
    );
  }

  // Redirect if not shopkeeper
  if (!session || session.user.role !== "SHOPKEEPER") return null;

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <h1 className="text-4xl font-bold text-gray-900 mb-8">
        Shopkeeper Dashboard,{" "}
        <span className="text-primary-blue">
          {session.user.name || session.user.email}
        </span>
        !
      </h1>

      {/* 🌍 Set Shop Location */}
      <div className="mb-8 p-4 border border-gray-200 rounded-lg bg-gray-50">
        <h3 className="text-lg font-semibold mb-2 text-gray-800">
          📍 Set Your Shop Location
        </h3>
        <p className="text-sm text-gray-600 mb-3">
          This helps customers find your shop on the map and get directions.
        </p>

        <div className="flex gap-3">
          <Button
            onClick={handleSaveLocation}
            disabled={savingLocation}
            className="bg-blue-600 text-white hover:bg-blue-700"
          >
            {savingLocation ? "Saving..." : "Use My Current Location"}
          </Button>

          <Button
            variant="outline"
            className="border-gray-400 text-gray-700 hover:bg-gray-100"
            onClick={() => alert("Manual entry coming soon.")}
          >
            Enter Manually
          </Button>
        </div>

        {shopLocation && (
          <p className="mt-3 text-sm text-gray-700">
            ✅ Saved Location: {shopLocation.lat.toFixed(4)},{" "}
            {shopLocation.lng.toFixed(4)}
          </p>
        )}
      </div>

      {/* 🧾 Requests Section */}
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">
        New Customer Requests
      </h2>

      {loadingRequests ? (
        <p className="text-center text-gray-600">Loading new requests...</p>
      ) : requests.length === 0 ? (
        <p className="text-center text-gray-600">
          No new customer requests at the moment.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {requests.map((request) => (
            <Card key={request.id} className="flex flex-col">
              <h3 className="text-xl font-bold text-gray-800 mb-2">{request.title}</h3>
              <p className="text-gray-600 mb-4">{request.description}</p>

              <div className="flex justify-between items-center text-sm text-gray-500 mb-4">
                <span>Posted by: {request.customer.name}</span>
                <span>On: {new Date(request.createdAt).toLocaleDateString()}</span>
              </div>

              {request.responses.some((r) => r.shopkeeperId === session.user.id) ? (
                <p className="text-center text-sm text-green-600 font-semibold bg-green-50 p-2 rounded-md">
                  ✅ You have already responded to this request.
                </p>
              ) : (
                <div className="mt-4 pt-4 border-t border-gray-100 space-y-4">
                  {/* 📸 Camera Image Uploader */}
                  <CameraUploader
                    onUploadComplete={(url) => {
                      setUploadedImages((prev) => ({
                        ...prev,
                        [request.id]: [...(prev[request.id] || []), url],
                      }));
                    }}
                  />

                  {/* 🖼 Image Preview */}
                  {uploadedImages[request.id]?.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {uploadedImages[request.id].map((url, idx) => (
                        <img
                          key={idx}
                          src={url}
                          alt={`Uploaded-${idx}`}
                          className="w-20 h-20 object-cover rounded-lg border border-gray-300"
                        />
                      ))}
                    </div>
                  )}

                  {/* 📝 Message Input */}
                  <Textarea
                    label="Your Message (optional)"
                    placeholder="e.g., 'We have it in stock!'"
                    value={responseMessage[request.id] || ""}
                    onChange={(e) =>
                      setResponseMessage((prev) => ({
                        ...prev,
                        [request.id]: e.target.value,
                      }))
                    }
                    rows={3}
                  />

                  {/* ✅ Availability Buttons */}
                  <div className="flex gap-3">
                    <Button
                      className="flex-1 text-primary-blue border-primary-blue hover:text-white"
                      onClick={() => handleRespondToRequest(request.id, true)}
                    >
                      ✅ Yes, Available
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 text-primary-blue border-primary-blue hover:text-white"
                      onClick={() => handleRespondToRequest(request.id, false)}
                    >
                      ❌ Not Available
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
