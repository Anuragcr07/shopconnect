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
  MapPin, 
  Store, 
  History, 
  Settings,
  CheckCircle2,
  AlertCircle,
  MessageCircle,
  Clock,
  RefreshCcw
} from "lucide-react";

// --- Types ---
interface CustomerPost {
  id: string;
  title: string;
  description: string;
  status: string;
  createdAt: string;
  updatedAt?: string;
  customer: { id: string; name: string; email: string };
  responses: { 
    id: string; 
    shopkeeperId: string; 
    isAvailable: boolean; 
    message: string | null; 
    imageUrls: string[]; 
    createdAt: string 
  }[];
}

export default function ShopkeeperDashboardPage() {
  const { data: session, status } = useSession();
  
  // --- State ---
  const [requests, setRequests] = useState<CustomerPost[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [responseMessage, setResponseMessage] = useState<{ [key: string]: string }>({});
  const [uploadedImages, setUploadedImages] = useState<{ [key: string]: string[] }>({});
  const [shopLocation, setShopLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // View State
  const [activeTab, setActiveTab] = useState<"requests" | "history">("requests");

  // Chat State
  const [chatConfig, setChatConfig] = useState<{ open: boolean; postId: string; shopId: string; recipientName: string } | null>(null);

  // --- Effects ---
  useEffect(() => {
    if (status === "authenticated") {
      if (session?.user.role !== "SHOPKEEPER") {
        redirect("/customer/dashboard");
      } else {
        fetchShopRequests();
        fetchLocation();

        // Auto-Refresh every 5 seconds
        const intervalId = setInterval(() => {
          fetchShopRequests(true);
        }, 5000);

        return () => clearInterval(intervalId);
      }
    } else if (status === "unauthenticated") {
      redirect("/login");
    }
  }, [status, session]);

  // --- API Handlers ---

  const fetchLocation = async () => {
    try {
      const res = await fetch("/api/shopkeeper/location");
      if (res.ok) {
        const data = await res.json();
        if (data.latitude) setShopLocation({ lat: data.latitude, lng: data.longitude });
      }
    } catch (err) { console.error(err); }
  };

  const fetchShopRequests = async (silent = false) => {
    if (!silent) setLoadingRequests(true);
    else setIsRefreshing(true);
    
    try {
      const response = await fetch("/api/shopkeeper/requests");
      if (response.ok) {
        const data: CustomerPost[] = await response.json();
        
        // ✅ FIX: Deduplicate data based on ID to prevent "duplicate key" errors
        const uniqueData = data.filter((item, index, self) => 
          index === self.findIndex((t) => t.id === item.id)
        );

        setRequests(uniqueData);
      }
    } catch (error) { console.error(error); } 
    finally { 
      setLoadingRequests(false); 
      setIsRefreshing(false);
    }
  };

  const handleSaveLocation = async () => {
    if (!navigator.geolocation) return alert("Geolocation not supported");
    navigator.geolocation.getCurrentPosition(async (pos) => {
      try {
        const res = await fetch("/api/shopkeeper/location", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
        });
        if (res.ok) {
          setShopLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          alert("Location updated!");
        }
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
      
      await fetchShopRequests(); 
      setActiveTab("history");

      if (isAvailable) {
        handleOpenChat(request.id, request.customer.name);
      } else {
        alert("Response sent.");
      }
    } catch (error) { console.error(error); alert("Failed."); }
  };

  if (status === "loading") return <div className="flex h-screen items-center justify-center text-gray-500">Loading...</div>;
  if (!session || session.user.role !== "SHOPKEEPER") return null;

  // Filter Requests
  const requestsNeedingResponse = requests.filter((r) => !r.responses.some((res) => res.shopkeeperId === session.user.id));
  
  // Sort History
  const respondedRequests = requests
    .filter((r) => r.responses.some((res) => res.shopkeeperId === session.user.id))
    .sort((a, b) => {
       const resA = a.responses.find(r => r.shopkeeperId === session.user.id);
       const resB = b.responses.find(r => r.shopkeeperId === session.user.id);
       return new Date(resB?.createdAt || 0).getTime() - new Date(resA?.createdAt || 0).getTime();
    });

  return (
    <div className="min-h-screen bg-gray-50/50">
      
      {/* Mobile Header */}
      <div className="lg:hidden bg-white p-4 border-b flex justify-between items-center sticky top-0 z-20 shadow-sm">
        <h1 className="font-bold text-lg flex items-center gap-2 text-gray-800">
          <Store className="w-5 h-5 text-blue-600" /> My Shop
        </h1>
        <Button variant="outline" onClick={handleSaveLocation} className="text-xs">Update Loc</Button>
      </div>

      <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* ================= SIDEBAR ================= */}
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

              {/* Navigation Menu */}
              <nav className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-2 space-y-1">
                  
                  <button 
                    onClick={() => setActiveTab("requests")}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-colors ${
                      activeTab === "requests" ? "bg-blue-50 text-blue-700" : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <Store className="w-4 h-4" />
                    New Requests
                    {requestsNeedingResponse.length > 0 && (
                      <span className="ml-auto bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded-full">
                        {requestsNeedingResponse.length}
                      </span>
                    )}
                  </button>
                  
                  <button 
                    onClick={() => setActiveTab("history")}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-colors ${
                      activeTab === "history" ? "bg-blue-50 text-blue-700" : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <History className="w-4 h-4" />
                    History & Chat
                  </button>

                  <button className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-xl transition-colors">
                    <Settings className="w-4 h-4" />
                    Settings
                  </button>
                </div>
              </nav>

              {/* Location Widget */}
              <div className="bg-gradient-to-br from-gray-900 to-gray-800 text-white rounded-2xl p-5 shadow-lg relative overflow-hidden">
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-2 text-gray-300 text-sm font-medium">
                    <MapPin className="w-4 h-4" /> Location Status
                  </div>
                  {shopLocation ? (
                    <div className="mb-4">
                      <p className="text-lg font-bold text-white flex items-center gap-2">Active <CheckCircle2 className="w-5 h-5 text-green-400" /></p>
                      <p className="text-xs text-gray-400 mt-1">Lat: {shopLocation.lat.toFixed(4)}</p>
                    </div>
                  ) : (
                    <div className="mb-4">
                       <p className="text-lg font-bold text-red-200 flex items-center gap-2">Not Set <AlertCircle className="w-5 h-5" /></p>
                    </div>
                  )}
                  <Button onClick={handleSaveLocation} className="w-full bg-white/10 hover:bg-white/20 border-0 text-white text-sm">Update Coordinates</Button>
                </div>
              </div>
            </div>
          </div>

          {/* ================= MAIN CONTENT ================= */}
          <div className="lg:col-span-3 space-y-6">
            
            <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-2">
               <div>
                  <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    {activeTab === "requests" ? "New Requests" : "History & Chats"}
                    {isRefreshing && <RefreshCcw className="w-4 h-4 animate-spin text-gray-400" />}
                  </h1>
                  <p className="text-gray-500 text-sm">
                    {activeTab === "requests" 
                      ? "Review and respond to incoming customer needs." 
                      : "View your past responses and continue chatting."}
                  </p>
               </div>
            </div>

            {/* ✅ VIEW 1: NEW REQUESTS */}
            {activeTab === "requests" && (
              <div className="space-y-4">
                {loadingRequests ? (
                  <div className="p-8 text-center text-gray-500">Loading requests...</div>
                ) : requestsNeedingResponse.length === 0 ? (
                  <div className="bg-white p-8 rounded-2xl border border-dashed border-gray-300 text-center text-gray-500">
                     <Store className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                     <p>No pending requests.</p>
                  </div>
                ) : (
                  requestsNeedingResponse.map((req, index) => (
                    // ✅ FIX: Added index to key to prevent unique key error
                    <Card key={`${req.id}-${index}`} className="p-6 bg-white border-none shadow-sm ring-1 ring-gray-100 rounded-2xl">
                      <div className="flex justify-between items-start mb-4">
                         <div className="flex gap-3">
                            <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold shrink-0">
                              {req.customer.name[0]}
                            </div>
                            <div>
                              <h3 className="font-bold text-gray-900">{req.title}</h3>
                              <p className="text-xs text-gray-500">{new Date(req.createdAt).toLocaleDateString()} • {req.customer.name}</p>
                            </div>
                         </div>
                         <span className="bg-blue-50 text-blue-700 text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap">New</span>
                      </div>

                      <p className="text-gray-700 mb-4 bg-gray-50 p-3 rounded-lg text-sm leading-relaxed border border-gray-100">
                        "{req.description}"
                      </p>
                      
                      <div className="space-y-4">
                         <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                           <p className="text-xs font-semibold text-gray-500 mb-2">Attach Photo (Optional)</p>
                           <CameraUploader onUploadComplete={(url) => setUploadedImages(prev => ({ ...prev, [req.id]: [...(prev[req.id] || []), url] }))} />
                         </div>
                         
                         <Textarea 
                            placeholder="Type a message..." 
                            className="w-full bg-white border-gray-200 focus:ring-blue-500 rounded-xl text-sm"
                            onChange={(e) => setResponseMessage(prev => ({ ...prev, [req.id]: e.target.value }))} 
                         />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 mt-5">
                        <Button className="bg-green-600 hover:bg-green-700 text-white rounded-xl py-6" onClick={() => handleRespondToRequest(req, true)}>
                          ✅ Available & Chat
                        </Button>
                        <Button variant="outline" className="border-gray-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 text-gray-600 rounded-xl py-6" onClick={() => handleRespondToRequest(req, false)}>
                          ❌ Not Available
                        </Button>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            )}

            {/* ✅ VIEW 2: HISTORY & CHAT */}
            {activeTab === "history" && (
              <div className="space-y-4">
                {respondedRequests.length === 0 && (
                   <div className="bg-white p-8 rounded-2xl border border-dashed border-gray-300 text-center text-gray-500">
                      <History className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p>No history yet.</p>
                   </div>
                )}
                
                {respondedRequests.map((req, index) => {
                    const myResponse = req.responses.find(r => r.shopkeeperId === session.user.id);
                    return (
                      // ✅ FIX: Added index to key to prevent unique key error
                      <Card key={`${req.id}-${index}`} className="p-5 bg-white border border-gray-200 rounded-2xl hover:shadow-md transition-all">
                        <div className="flex justify-between items-center mb-3">
                          <h3 className="font-semibold text-gray-800">{req.title}</h3>
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${myResponse?.isAvailable ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {myResponse?.isAvailable ? "Available" : "Unavailable"}
                          </span>
                        </div>
                        
                        <div className="flex justify-between items-center text-sm text-gray-500 mb-4">
                           <span>Customer: <span className="font-medium text-gray-700">{req.customer.name}</span></span>
                           <span className="flex items-center gap-1 text-xs">
                             <Clock className="w-3 h-3" /> 
                             {new Date(myResponse?.createdAt || "").toLocaleDateString()}
                           </span>
                        </div>
                        
                        {myResponse?.isAvailable && (
                          <div className="border-t border-gray-100 pt-3">
                            <Button 
                              className="w-full bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 rounded-xl flex items-center justify-center gap-2"
                              onClick={() => handleOpenChat(req.id, req.customer.name)}
                            >
                              <MessageCircle className="w-4 h-4" /> 
                              Open Chat with {req.customer.name}
                            </Button>
                          </div>
                        )}
                      </Card>
                    );
                  })}
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Chat Window */}
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