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
  MapPin, Store, History, Settings, CheckCircle2, 
  AlertCircle, MessageCircle, Clock, RefreshCcw 
} from "lucide-react";

// --- Types ---
interface CustomerPost {
  id: string;
  title: string;
  description: string;
  customer: { id: string; name: string; email: string };
  // Only minimal response data needed here
  responses: { shopkeeperId: string }[]; 
  createdAt: string;
}

interface Conversation {
  id: string;
  customerPostId: string;
  customerPost: { title: string };
  customer: { name: string };
  lastMessageAt: string;
  messages: { content: string; createdAt: string }[];
}

export default function ShopkeeperDashboardPage() {
  const { data: session, status } = useSession();
  
  // --- State ---
  const [requests, setRequests] = useState<CustomerPost[]>([]);
  // ✅ NEW: Dedicated state for persistent conversations
  const [conversations, setConversations] = useState<Conversation[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [responseMessage, setResponseMessage] = useState<{ [key: string]: string }>({});
  const [uploadedImages, setUploadedImages] = useState<{ [key: string]: string[] }>({});
  const [shopLocation, setShopLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const [activeTab, setActiveTab] = useState<"requests" | "history">("requests");
  const [chatConfig, setChatConfig] = useState<{ open: boolean; postId: string; shopId: string; recipientName: string } | null>(null);

  useEffect(() => {
    if (status === "authenticated") {
      if (session?.user.role !== "SHOPKEEPER") {
        redirect("/customer/dashboard");
      } else {
        fetchAllData();
        fetchLocation();

        // Poll for updates every 5s
        const intervalId = setInterval(() => {
          fetchAllData(true);
        }, 5000);

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

  // ✅ Fetch both Requests AND Conversations
  const fetchAllData = async (silent = false) => {
    if (!silent) setLoading(true);
    else setIsRefreshing(true);
    
    try {
      // 1. Fetch New Requests
      const reqRes = await fetch("/api/shopkeeper/requests");
      if (reqRes.ok) {
        const data = await reqRes.json();
        // Deduplicate
        const unique = data.filter((item: any, index: number, self: any[]) => 
          index === self.findIndex((t) => t.id === item.id)
        );
        setRequests(unique);
      }

      // 2. Fetch Chat History (Conversations)
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
        alert("Location updated!");
      } catch (e) { console.error(e); }
    });
  };

  const handleOpenChat = (postId: string, recipientName: string) => {
    if (!session?.user?.id) return;
    setChatConfig({
      open: true,
      postId: postId,
      shopId: session.user.id,
      recipientName: recipientName
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
      setActiveTab("history"); // Switch to history tab

      if (isAvailable) {
        handleOpenChat(request.id, request.customer.name);
      } else {
        alert("Marked as Not Available.");
      }
    } catch (error) { console.error(error); alert("Failed."); }
  };

  if (status === "loading") return <div className="flex h-screen items-center justify-center">Loading...</div>;
  if (!session || session.user.role !== "SHOPKEEPER") return null;

  // Filter requests that haven't been responded to yet
  const newRequests = requests.filter((r) => !r.responses.some((res) => res.shopkeeperId === session.user.id));

  return (
    <div className="min-h-screen bg-gray-50/50">
      
      {/* Mobile Header */}
      <div className="lg:hidden bg-white p-4 border-b flex justify-between items-center sticky top-0 z-20 shadow-sm">
        <h1 className="font-bold text-lg flex items-center gap-2">
          <Store className="w-5 h-5 text-blue-600" /> My Shop
        </h1>
        <Button variant="outline" onClick={handleSaveLocation} className="text-xs">Update Loc</Button>
      </div>

      <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* SIDEBAR */}
          <div className="hidden lg:block lg:col-span-1">
            <div className="sticky top-8 space-y-6">
              
              {/* Profile */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xl">
                    {session?.user?.name?.[0]?.toUpperCase() || "S"}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 leading-tight">{session?.user?.name}</h3>
                    <p className="text-xs text-gray-500 font-medium">Shopkeeper</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-green-50 text-green-700 px-3 py-2 rounded-lg text-sm font-medium border border-green-100">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                  </span>
                  Online
                </div>
              </div>

              {/* Nav */}
              <nav className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-2 space-y-1">
                  <button onClick={() => setActiveTab("requests")} className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-colors ${activeTab === "requests" ? "bg-blue-50 text-blue-700" : "text-gray-600 hover:bg-gray-50"}`}>
                    <Store className="w-4 h-4" />
                    New Requests
                    {newRequests.length > 0 && <span className="ml-auto bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded-full">{newRequests.length}</span>}
                  </button>
                  <button onClick={() => setActiveTab("history")} className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-colors ${activeTab === "history" ? "bg-blue-50 text-blue-700" : "text-gray-600 hover:bg-gray-50"}`}>
                    <History className="w-4 h-4" />
                    Chats ({conversations.length})
                  </button>
                </div>
              </nav>

              {/* Location */}
              <div className="bg-gradient-to-br from-gray-900 to-gray-800 text-white rounded-2xl p-5 shadow-lg relative overflow-hidden">
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-2 text-gray-300 text-sm font-medium">
                    <MapPin className="w-4 h-4" /> Location
                  </div>
                  {shopLocation ? (
                    <div className="mb-4">
                      <p className="text-lg font-bold flex items-center gap-2">Active <CheckCircle2 className="w-5 h-5 text-green-400" /></p>
                    </div>
                  ) : (
                    <div className="mb-4">
                       <p className="text-lg font-bold text-red-200">Not Set</p>
                    </div>
                  )}
                  <Button onClick={handleSaveLocation} className="w-full bg-white/10 hover:bg-white/20 border-0 text-white text-sm">Update</Button>
                </div>
              </div>
            </div>
          </div>

          {/* MAIN CONTENT */}
          <div className="lg:col-span-3 space-y-6">
            
            <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-2">
               <div>
                  <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    {activeTab === "requests" ? "New Requests" : "Chats & History"}
                    {isRefreshing && <RefreshCcw className="w-4 h-4 animate-spin text-gray-400" />}
                  </h1>
               </div>
            </div>

            {/* TAB 1: NEW REQUESTS */}
            {activeTab === "requests" && (
              <div className="space-y-4">
                {loading ? <p>Loading...</p> : newRequests.length === 0 ? (
                  <div className="bg-white p-8 rounded-2xl border border-dashed border-gray-300 text-center text-gray-500">
                     <p>No new requests.</p>
                  </div>
                ) : (
                  newRequests.map((req, idx) => (
                    <Card key={`${req.id}-${idx}`} className="p-6 bg-white border-none shadow-sm ring-1 ring-gray-100 rounded-2xl">
                      <div className="flex justify-between items-start mb-4">
                         <h3 className="font-bold text-gray-900">{req.title}</h3>
                         <span className="bg-blue-50 text-blue-700 text-xs font-bold px-3 py-1 rounded-full">New</span>
                      </div>
                      <p className="text-gray-700 mb-4 bg-gray-50 p-3 rounded-lg text-sm">{req.description}</p>
                      
                      <div className="space-y-4">
                         <CameraUploader onUploadComplete={(url) => setUploadedImages(prev => ({ ...prev, [req.id]: [...(prev[req.id] || []), url] }))} />
                         <Textarea placeholder="Message..." onChange={(e) => setResponseMessage(prev => ({ ...prev, [req.id]: e.target.value }))} />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 mt-5">
                        <Button className="bg-green-600 hover:bg-green-700 text-white py-6" onClick={() => handleRespondToRequest(req, true)}>✅ Available & Chat</Button>
                        <Button variant="outline" className="py-6" onClick={() => handleRespondToRequest(req, false)}>❌ Not Available</Button>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            )}

            {/* TAB 2: CHAT HISTORY (Persistent 24/7) */}
            {activeTab === "history" && (
              <div className="space-y-4">
                {conversations.length === 0 && (
                   <div className="bg-white p-8 rounded-2xl border border-dashed border-gray-300 text-center text-gray-500">
                      <p>No active chats yet.</p>
                   </div>
                )}
                
                {conversations.map((conv, idx) => (
                  <Card key={`${conv.id}-${idx}`} className="p-5 bg-white border border-gray-200 rounded-2xl hover:shadow-md transition-all">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="font-semibold text-gray-800">{conv.customerPost?.title || "Product Query"}</h3>
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {new Date(conv.lastMessageAt || Date.now()).toLocaleDateString()}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center text-sm text-gray-500 mb-4">
                       <span>Customer: <span className="font-medium text-gray-700">{conv.customer.name}</span></span>
                       {conv.messages.length > 0 && (
                         <span className="text-xs text-gray-400 italic max-w-[150px] truncate">
                           Last: {conv.messages[0].content}
                         </span>
                       )}
                    </div>
                    
                    <div className="border-t border-gray-100 pt-3">
                      <Button 
                        className="w-full bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 rounded-xl flex items-center justify-center gap-2"
                        onClick={() => handleOpenChat(conv.customerPostId, conv.customer.name)}
                      >
                        <MessageCircle className="w-4 h-4" /> 
                        Continue Chatting
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}

          </div>
        </div>
      </div>

      {chatConfig && (
        <ChatWindow
          key={chatConfig.postId} 
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