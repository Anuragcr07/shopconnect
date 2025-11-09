"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import Card from "@/components/ui/Card"; // Assuming Card component exists in ui folder
import Button from "@/components/ui/Button"; // Assuming Button component exists in ui folder
import { useEffect, useState } from "react";
import { Textarea } from "@/components/ui/Textarea"; // Assuming Textarea component exists in ui folder
import CameraUploader from "@/components/CameraUploader"; // Webcam uploader (ensure this component is properly implemented)
import Image from "next/image"; // Import Image component for optimized image display

interface CustomerPost {
  id: string;
  title: string;
  description: string;
  status: string; // e.g., "pending", "fulfilled"
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
    imageUrls: string[]; // Added to store response images
    createdAt: string; // Added to show when the response was made
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

  // Redirect non-shopkeepers & fetch requests + location on auth status change
  useEffect(() => {
    if (status === "authenticated") {
      if (session?.user.role !== "SHOPKEEPER") {
        redirect("/customer/dashboard");
      } else {
        fetchShopRequests();
        fetchLocation();
      }
    }
  }, [status, session]); // Depend on status and session

  /** 🧭 Fetch shopkeeper’s saved location from DB */
  const fetchLocation = async () => {
    try {
      const res = await fetch("/api/shopkeeper/location");
      if (!res.ok) {
        // If location is not set, API might return 404, which is expected for new shopkeepers
        if (res.status === 404) {
          setShopLocation(null);
          return;
        }
        throw new Error("Failed to fetch shopkeeper location");
      }
      const data = await res.json();
      if (data.latitude && data.longitude) {
        setShopLocation({ lat: data.latitude, lng: data.longitude });
      } else {
        setShopLocation(null);
      }
    } catch (err) {
      console.error("Failed to load shopkeeper location:", err);
      // Optionally show a user-friendly error
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
    // Ensure session and user ID are available before proceeding
    if (!session?.user?.id) {
      alert("Authentication error: User ID not found.");
      return;
    }

    // Basic validation for images if available
    const imagesToUpload = uploadedImages[postId] || [];
    if (isAvailable && imagesToUpload.length === 0) {
      // alert("Please upload at least one image if the item is available.");
      // return; // Decide if images are strictly required for 'available'
    }

    try {
      const response = await fetch(`/api/shopkeeper/availability`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerPostId: postId,
          isAvailable,
          message: responseMessage[postId] || null,
          imageUrls: imagesToUpload, // Pass the array of image URLs
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to send response");
      }

      // Reset after successful submission
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

      fetchShopRequests(); // Refresh requests to show updated status
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
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 } // Options for getCurrentPosition
    );
  };

  const handleImageUploadComplete = (postId: string, url: string) => {
    setUploadedImages((prev) => ({
      ...prev,
      [postId]: [...(prev[postId] || []), url],
    }));
  };

  // Loading state for initial authentication
  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-80px)] text-lg">
        Loading authentication...
      </div>
    );
  }

  // After loading, if not a shopkeeper, the redirect will handle it.
  // This ensures that the component only renders its content for authenticated shopkeepers.
  if (!session || session.user.role !== "SHOPKEEPER") {
    return null; // Should be redirected, but good to have a fallback
  }

  // Filter requests into those needing a response and those already responded to
  const requestsNeedingResponse = requests.filter(
    (request) => !request.responses.some((r) => r.shopkeeperId === session.user.id)
  );
  const respondedRequests = requests.filter((request) =>
    request.responses.some((r) => r.shopkeeperId === session.user.id)
  );

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto min-h-[calc(100vh-80px)] bg-gray-50">
      <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-8 tracking-tight">
        Shopkeeper Dashboard,{" "}
        <span className="text-blue-600">
          {session.user.name || session.user.email?.split('@')[0]}
        </span>
        !
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Left Column for Location & New Requests (first item) */}
        <div className="lg:col-span-1 space-y-6">
          {/* 🌍 Set Shop Location Card */}
          <Card className="p-6 bg-white shadow-sm border border-gray-100 flex flex-col justify-between">
            <div>
              <div className="flex items-center text-xl font-bold text-gray-800 mb-4">
                <span className="mr-2 text-blue-600">📍</span> Set Your Shop Location
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Your location helps customers find your shop and enables local trade.
              </p>

              {shopLocation ? (
                <div className="mb-4">
                  <p className="text-sm text-gray-700 mb-2 font-medium">
                    <span className="text-green-600">✅</span> Saved Location:
                  </p>
                  <p className="text-xs text-gray-500 ml-5">
                    Lat: {shopLocation.lat.toFixed(6)}, Lng: {shopLocation.lng.toFixed(6)}
                  </p>
                  <div className="mt-3 w-full h-32 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden relative">
                    {/* Placeholder for a map snippet or a static map image */}
                    <Image
                      src={`https://maps.googleapis.com/maps/api/staticmap?center=${shopLocation.lat},${shopLocation.lng}&zoom=14&size=200x128&markers=color:red%7C${shopLocation.lat},${shopLocation.lng}&key=YOUR_GOOGLE_MAPS_API_KEY`}
                      alt="Shop location on map"
                      layout="fill"
                      objectFit="cover"
                      className="rounded-lg"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-10 flex items-center justify-center">
                      <span className="text-white text-xs px-2 py-1 rounded-md bg-black bg-opacity-50">
                        View on map coming soon
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mb-4">
                  <p className="text-sm text-red-600 mb-2">
                    <span className="font-semibold">⚠️ No location set.</span> Please set your shop location.
                  </p>
                  {/* Placeholder for map image or a simple icon */}
                  <div className="w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center border border-dashed border-gray-300">
                    <span className="text-gray-400 text-sm">Map preview unavailable</span>
                  </div>
                </div>
              )}

              <Button
                onClick={handleSaveLocation}
                disabled={savingLocation}
                className="w-full bg-blue-600 text-white hover:bg-blue-700 py-2 rounded-md transition duration-200"
              >
                {savingLocation ? "Saving Location..." : "Use My Current Location"}
              </Button>
              {/* <Button
                variant="outline"
                className="w-full mt-2 border-gray-300 text-gray-700 hover:bg-gray-50 py-2 rounded-md transition duration-200"
                onClick={() => alert("Manual entry coming soon.")}
              >
                Enter Manually
              </Button> */}
            </div>
          </Card>

          {/* New Customer Requests Section Header (for the first card in the right column) */}
          <h2 className="text-2xl font-bold text-gray-800 mt-8 mb-4 lg:hidden">
            New Customer Requests
          </h2>
          {requestsNeedingResponse.length === 0 && (
             <p className="text-center text-gray-600 p-4 bg-white rounded-lg shadow-sm">
               No new customer requests at the moment.
             </p>
           )}
        </div>

        {/* Right Columns for Requests & Responses */}
        <div className="lg:col-span-2 space-y-6">
          {/* New Customer Requests */}
          <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">New Customer Requests</h2>
            {loadingRequests ? (
              <p className="text-center text-gray-600">Loading new requests...</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {requestsNeedingResponse.map((request) => (
                  <Card key={request.id} className="p-5 flex flex-col justify-between border border-gray-200 shadow-sm transition-all duration-200 hover:shadow-md">
                    <div>
                      <h3 className="text-xl font-bold text-gray-800 mb-2">{request.title}</h3>
                      <p className="text-gray-600 text-sm mb-4 line-clamp-3">{request.description}</p>
                      <div className="flex justify-between items-center text-xs text-gray-500 mb-4">
                        <span>By: {request.customer.name}</span>
                        <span>Posted: {new Date(request.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-100 space-y-4">
                      {/* 📸 Camera Image Uploader */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Upload Product Image(s)</label>
                        <CameraUploader
                          onUploadComplete={(url) => handleImageUploadComplete(request.id, url)}
                        />
                      </div>


                      {/* 🖼 Image Preview */}
                      {uploadedImages[request.id]?.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {uploadedImages[request.id].map((url, idx) => (
                            <Image
                              key={idx}
                              src={url}
                              alt={`Uploaded image ${idx + 1}`}
                              width={80}
                              height={80}
                              objectFit="cover"
                              className="rounded-lg border border-gray-300 shadow-sm"
                            />
                          ))}
                        </div>
                      )}

                      {/* 📝 Message Input */}
                      <Textarea
                        label="Your Message (optional)"
                        placeholder="e.g., 'We have it in stock! Available for pickup today.'"
                        value={responseMessage[request.id] || ""}
                        onChange={(e) =>
                          setResponseMessage((prev) => ({
                            ...prev,
                            [request.id]: e.target.value,
                          }))
                        }
                        rows={3}
                        className="mt-2"
                      />

                      {/* ✅ Availability Buttons */}
                      <div className="flex gap-3 mt-4">
                        <Button
                          className="flex-1 bg-blue-600 text-white hover:bg-blue-700 py-2 rounded-md text-sm font-semibold"
                          onClick={() => handleRespondToRequest(request.id, true)}
                        >
                          ✅ Yes, Available
                        </Button>
                        <Button
                          variant="outline"
                          className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-100 py-2 rounded-md text-sm font-semibold"
                          onClick={() => handleRespondToRequest(request.id, false)}
                        >
                          ❌ Not Available
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Your Shop Responses Section */}
          <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-100 mt-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Your Shop Responses</h2>
            {respondedRequests.length === 0 ? (
              <p className="text-center text-gray-600">You haven't responded to any requests yet.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {respondedRequests.map((request) => {
                  const shopkeeperResponse = request.responses.find(
                    (r) => r.shopkeeperId === session.user.id
                  );

                  if (!shopkeeperResponse) return null; // Should not happen if filtered correctly

                  return (
                    <Card key={`${request.id}-responded`} className="p-5 flex flex-col justify-between border border-gray-200 bg-gray-50">
                      <div>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">{request.title}</h3>
                        <p className="text-gray-600 text-sm mb-4 line-clamp-3">{request.description}</p>
                        <div className="flex justify-between items-center text-xs text-gray-500 mb-4">
                          <span>By: {request.customer.name}</span>
                          <span>Posted: {new Date(request.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
                        <p className="text-sm font-semibold text-gray-700">Your Response:</p>
                        <p className={`text-sm ${shopkeeperResponse.isAvailable ? "text-green-700" : "text-red-700"} flex items-center`}>
                          {shopkeeperResponse.isAvailable ? (
                            <>
                              <span className="text-base mr-1">✅</span> Available
                            </>
                          ) : (
                            <>
                              <span className="text-base mr-1">❌</span> Not Available
                            </>
                          )}
                          <span className="ml-auto text-xs text-gray-500">
                            Responded: {new Date(shopkeeperResponse.createdAt).toLocaleDateString()}
                          </span>
                        </p>
                        {shopkeeperResponse.message && (
                          <p className="text-sm text-gray-700 italic border-l-2 border-gray-200 pl-3">
                            "{shopkeeperResponse.message}"
                          </p>
                        )}

                        {shopkeeperResponse.imageUrls && shopkeeperResponse.imageUrls.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {shopkeeperResponse.imageUrls.map((url, idx) => (
                              <Image
                                key={idx}
                                src={url}
                                alt={`Response image ${idx + 1}`}
                                width={70}
                                height={70}
                                objectFit="cover"
                                className="rounded-md border border-gray-200"
                              />
                            ))}
                          </div>
                        )}
                        <Button
                          variant="ghost"
                          className="w-full text-blue-600 hover:bg-blue-50 py-2 rounded-md text-sm"
                          onClick={() => alert("Mark as fulfilled functionality coming soon.")}
                        >
                          Mark as Fulfilled
                        </Button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}