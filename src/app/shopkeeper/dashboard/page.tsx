"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { useEffect, useState } from "react";

// UI Components
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import CameraUploader from "@/components/CameraUploader";
import ChatWindow from "@/components/ChatWindow";

// Icons
import { 
  MapPin, Store, History, CheckCircle2, 
  MessageCircle, Clock, RefreshCcw, X 
} from "lucide-react";

// --- Updated Types ---
interface CustomerPost {
  id: string;
  title: string;
  description: string;
  distance?: number; 
  customer: { id: string; name: string; email: string };
  responses: { shopkeeperId: string }[]; 
  createdAt: string;
}

interface Conversation {
  id: string;
  customerId: string; // Added to ensure chat opens correctly
  customerPostId: string;
  customerPost: { title: string };
  customer: { name: string };
  lastMessageAt: string;
  messages: { content: string; createdAt: string }[];
}

export default function ShopkeeperDashboardPage() {
  const { data: session, status } = useSession();
  
  const [requests, setRequests] = useState<CustomerPost[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [responseMessage, setResponseMessage] = useState<{ [key: string]: string }>({});
  const [uploadedImages, setUploadedImages] = useState<{ [key: string]: string[] }>({});
  const [shopLocation, setShopLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"requests" | "history">("requests");
  
  // State for Chat
  const [chatConfig, setChatConfig] = useState<{ 
    open: boolean; 
    postId: string; 
    shopId: string; 
    customerId: string; 
    recipientName: string 
  } | null>(null);

  useEffect(() => {
    if (status === "authenticated") {
      if (session?.user.role !== "SHOPKEEPER") {
        redirect("/customer/dashboard");
      } else {
        fetchAllData();
        fetchLocation();
        const intervalId = setInterval(() => fetchAllData(true), 10000);
        return () => clearInterval(intervalId);
      }
    } else if (status === "unauthenticated") {
      redirect("/login");
    }
  }, [status, session]);

  const fetchLocation = async () => {
    try {
      const res = await fetch("/api/shopkeeper/location");
      if (res.ok) {
        const data = await res.json();
        if (data.latitude) setShopLocation({ lat: data.latitude, lng: data.longitude });
      }
    } catch (err) { console.error(err); }
  };

  const fetchAllData = async (silent = false) => {
    if (!silent) setLoading(true);
    else setIsRefreshing(true);
    
    try {
      const reqRes = await fetch("/api/shopkeeper/requests");
      if (reqRes.ok) {
        const data = await reqRes.json();
        setRequests(data);
      }

      const chatRes = await fetch("/api/chat");
      if (chatRes.ok) {
        const data = await chatRes.json();
        setConversations(data);
      }
    } catch (error) { console.error(error); } 
    finally { 
      setLoading(false); 
      setIsRefreshing(false);
    }
  };

  const handleSaveLocation = async () => {
    if (!navigator.geolocation) return alert("Geolocation not supported");
    navigator.geolocation.getCurrentPosition(async (pos) => {
      try {
        await fetch("/api/shopkeeper/location", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
        });
        setShopLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        fetchAllData(); 
        alert("Location updated!");
      } catch (e) { console.error(e); }
    });
  };

  const removeImage = (postId: string, urlToRemove: string) => {
    setUploadedImages(prev => ({
      ...prev,
      [postId]: prev[postId].filter(url => url !== urlToRemove)
    }));
  };

  // Fixed Parameters: Always (Post, Customer, Name)
  const handleOpenChat = (postId: string, customerId: string, recipientName: string) => {
    if (!session?.user?.id) return;
    setChatConfig({ 
      open: true, 
      postId, 
      shopId: session.user.id, 
      customerId, 
      recipientName 
    });
  };

  const handleRespondToRequest = async (request: CustomerPost, isAvailable: boolean) => {
    if (!session?.user?.id) return;
    try {
      const response = await fetch(`/api/shopkeeper/availability`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          customerPostId: request.id, 
          isAvailable, 
          message: responseMessage[request.id] || null, 
          imageUrls: uploadedImages[request.id] || [] 
        }),
      });

      if (!response.ok) throw new Error("Failed");
      
      await fetchAllData(); 
      
      setUploadedImages(prev => {
        const newState = { ...prev };
        delete newState[request.id];
        return newState;
      });

      if (isAvailable) {
        // Open chat after small delay to ensure DB catch-up
        setTimeout(() => {
          handleOpenChat(request.id, request.customer.id, request.customer.name);
        }, 400); 
      } else {
        alert("Marked as Not Available.");
      }
    } catch (error) { 
      console.error(error); 
      alert("Failed to send response."); 
    }
  };

  if (status === "loading") return <div className="flex h-screen items-center justify-center">Loading...</div>;

  const newRequests = requests.filter((r) => 
    r.responses && Array.isArray(r.responses) 
      ? !r.responses.some((res) => res.shopkeeperId === session?.user?.id)
      : true
  );

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Mobile Header */}
      <div className="lg:hidden bg-white p-4 border-b flex justify-between items-center sticky top-0 z-20 shadow-sm">
        <h1 className="font-bold text-lg flex items-center gap-2"><Store className="w-5 h-5 text-blue-600" /> My Shop</h1>
        <Button variant="outline" onClick={handleSaveLocation} className="text-xs">Update Loc</Button>
      </div>

      <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* SIDEBAR */}
          <div className="hidden lg:block lg:col-span-1">
            <div className="sticky top-8 space-y-6">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xl">
                    {session?.user?.name?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 leading-tight">{session?.user?.name}</h3>
                    <p className="text-xs text-gray-500">Shopkeeper</p>
                  </div>
                </div>
                <div className="bg-green-50 text-green-700 px-3 py-2 rounded-lg text-sm font-medium border border-green-100 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" /> Online
                </div>
              </div>

              <nav className="bg-white rounded-2xl shadow-sm border border-gray-100 p-2 space-y-1">
                <button onClick={() => setActiveTab("requests")} className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-colors ${activeTab === "requests" ? "bg-blue-50 text-blue-700" : "text-gray-600 hover:bg-gray-50"}`}>
                  <Store className="w-4 h-4" /> New Requests
                  {newRequests.length > 0 && <span className="ml-auto bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded-full">{newRequests.length}</span>}
                </button>
                <button onClick={() => setActiveTab("history")} className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-colors ${activeTab === "history" ? "bg-blue-50 text-blue-700" : "text-gray-600 hover:bg-gray-50"}`}>
                  <History className="w-4 h-4" /> Chats ({conversations.length})
                </button>
              </nav>

              <div className="bg-gray-900 text-white rounded-2xl p-5 shadow-lg">
                <div className="flex items-center gap-2 mb-2 text-gray-400 text-xs font-medium uppercase tracking-wider"><MapPin className="w-3 h-3" /> Shop Location</div>
                {shopLocation ? (
                  <p className="text-sm font-bold flex items-center gap-2 mb-4">Location Active <CheckCircle2 className="w-4 h-4 text-green-400" /></p>
                ) : (
                  <p className="text-sm font-bold text-red-400 mb-4">Not Set</p>
                )}
                <Button onClick={handleSaveLocation} className="w-full bg-white/10 hover:bg-white/20 border-0 text-white text-xs">Update Location</Button>
              </div>
            </div>
          </div>

          {/* MAIN CONTENT */}
          <div className="lg:col-span-3 space-y-6">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              {activeTab === "requests" ? "Nearby Requests" : "Customer Chats"}
              {isRefreshing && <RefreshCcw className="w-4 h-4 animate-spin text-gray-400" />}
            </h1>

            {activeTab === "requests" && (
              <div className="grid gap-4">
                {loading ? <p>Searching nearby...</p> : newRequests.length === 0 ? (
                  <div className="bg-white p-12 rounded-2xl border border-dashed border-gray-300 text-center text-gray-500">
                    No customers looking for items within 10km right now.
                  </div>
                ) : (
                  newRequests.map((req) => (
                    <Card key={req.id} className="p-6 bg-white border-none shadow-sm ring-1 ring-gray-100 rounded-2xl">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold text-lg text-gray-900">{req.title}</h3>
                        <div className="flex flex-col items-end">
                          <span className="bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-1 rounded uppercase mb-1">Within 10km</span>
                          <span className="text-[11px] text-gray-400 font-medium">{req.distance?.toFixed(1)} km away</span>
                        </div>
                      </div>
                      <p className="text-gray-600 mb-6 text-sm leading-relaxed">{req.description}</p>
                      
                      <div className="space-y-4 bg-gray-50 p-4 rounded-xl">
                        <CameraUploader onUploadComplete={(url) => setUploadedImages(prev => ({ ...prev, [req.id]: [...(prev[req.id] || []), url] }))} />
                        
                        {uploadedImages[req.id]?.length > 0 && (
                          <div className="flex gap-2">
                            {uploadedImages[req.id].map((url, i) => (
                              <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden ring-1 ring-gray-200">
                                <img src={url} className="w-full h-full object-cover" alt="preview" />
                                <button onClick={() => removeImage(req.id, url)} className="absolute top-0 right-0 bg-red-500 text-white p-0.5"><X className="w-3 h-3"/></button>
                              </div>
                            ))}
                          </div>
                        )}
                        <Textarea placeholder="Send a price quote..." className="bg-white" onChange={(e) => setResponseMessage(prev => ({ ...prev, [req.id]: e.target.value }))} />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 mt-4">
                        <Button className="bg-green-600 hover:bg-green-700 text-white h-12" onClick={() => handleRespondToRequest(req, true)}>I Have This</Button>
                        <Button variant="outline" className="h-12" onClick={() => handleRespondToRequest(req, false)}>Not Available</Button>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            )}

            {activeTab === "history" && (
              <div className="grid gap-3">
                {conversations.length === 0 ? (
                  <p className="text-center py-10 text-gray-400">No chats yet.</p>
                ) : (
                  conversations.map((conv) => (
                    <Card 
                      key={conv.id} 
                      className="p-4 bg-white hover:shadow-md transition-shadow cursor-pointer border border-gray-100" 
                      onClick={() => handleOpenChat(conv.customerPostId, conv.customerId, conv.customer.name)}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-bold text-gray-900">{conv.customerPost?.title || "Item Inquiry"}</h4>
                          <p className="text-sm text-gray-500">Customer: {conv.customer.name}</p>
                        </div>
                        <MessageCircle className="text-blue-600 w-5 h-5" />
                      </div>
                    </Card>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>

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