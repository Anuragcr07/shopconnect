"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import Image from "next/image";

import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import CameraUploader from "@/components/CameraUploader";
import ChatWindow from "@/components/ChatWindow";

import { 
  MapPin, Store, History, CheckCircle2, 
  MessageCircle, RefreshCcw, X
} from "lucide-react";

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
    if (status === "authenticated" && session?.user.role === "SHOPKEEPER") {
      fetchAllData();
      fetchLocation();
      const intervalId = setInterval(() => fetchAllData(true), 10000);
      return () => clearInterval(intervalId);
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

  if (status === "loading") return <div className="grid min-h-[65vh] place-items-center bg-slate-50"><div className="size-10 animate-spin rounded-full border-4 border-indigo-100 border-t-indigo-600" /></div>;

  const newRequests = requests.filter((r) => 
    r.responses && Array.isArray(r.responses) 
      ? !r.responses.some((res) => res.shopkeeperId === session?.user?.id)
      : true
  );

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Mobile Header */}
      <div className="sticky top-18 z-20 flex items-center justify-between border-b border-slate-200 bg-white/95 p-4 backdrop-blur lg:hidden">
        <h1 className="flex items-center gap-2 font-extrabold text-slate-950"><Store className="size-5 text-indigo-600" /> My shop</h1>
        <Button variant="outline" onClick={handleSaveLocation} className="min-h-10 px-3 text-xs"><MapPin className="size-3.5" /> Update location</Button>
      </div>

      <div className="page-shell py-6 sm:py-8 lg:py-12">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4 lg:gap-8">
          
          {/* SIDEBAR */}
          <div className="hidden lg:block lg:col-span-1">
            <div className="sticky top-24 space-y-5">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex size-12 items-center justify-center rounded-2xl bg-indigo-100 text-xl font-black text-indigo-700">
                    {session?.user?.name?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-extrabold leading-tight text-slate-900">{session?.user?.name}</h3>
                    <p className="text-xs text-slate-500">Shopkeeper account</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-700">
                  <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" /> Online
                </div>
              </div>

              <nav className="space-y-1 rounded-3xl border border-slate-200 bg-white p-2 shadow-sm">
                <button onClick={() => setActiveTab("requests")} className={`flex min-h-12 w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition-colors ${activeTab === "requests" ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-50"}`}>
                  <Store className="w-4 h-4" /> New Requests
                  {newRequests.length > 0 && <span className="ml-auto rounded-full bg-indigo-600 px-2 py-0.5 text-[10px] text-white">{newRequests.length}</span>}
                </button>
                <button onClick={() => setActiveTab("history")} className={`flex min-h-12 w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition-colors ${activeTab === "history" ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-50"}`}>
                  <History className="w-4 h-4" /> Chats ({conversations.length})
                </button>
              </nav>

              <div className="rounded-3xl bg-slate-950 p-5 text-white shadow-lg">
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
          <div className="space-y-6 lg:col-span-3">
            <div><p className="text-sm font-bold text-indigo-600">Shopkeeper dashboard</p><h1 className="mt-1 flex items-center gap-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              {activeTab === "requests" ? "Nearby Requests" : "Customer Chats"}
              {isRefreshing && <RefreshCcw className="size-4 animate-spin text-slate-400" />}
            </h1><p className="mt-2 text-sm text-slate-500">{activeTab === "requests" ? "New opportunities from customers within 10 km." : "Continue conversations with interested customers."}</p></div>

            <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-200/70 p-1.5 lg:hidden">
              <button onClick={() => setActiveTab("requests")} className={`min-h-11 rounded-xl px-3 text-sm font-bold ${activeTab === "requests" ? "bg-white text-indigo-700 shadow-sm" : "text-slate-600"}`}>Requests ({newRequests.length})</button>
              <button onClick={() => setActiveTab("history")} className={`min-h-11 rounded-xl px-3 text-sm font-bold ${activeTab === "history" ? "bg-white text-indigo-700 shadow-sm" : "text-slate-600"}`}>Chats ({conversations.length})</button>
            </div>

            {activeTab === "requests" && (
              <div className="grid gap-4">
                {loading ? <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center text-sm font-semibold text-slate-500">Searching nearby…</div> : newRequests.length === 0 ? (
                  <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-500">
                    <Store className="mx-auto mb-4 size-8 text-slate-300" /> No new customer requests within 10 km right now.
                  </div>
                ) : (
                  newRequests.map((req) => (
                    <Card key={req.id} className="overflow-hidden rounded-3xl p-5 sm:p-6">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold text-lg text-gray-900">{req.title}</h3>
                        <div className="flex flex-col items-end">
                          <span className="mb-1 rounded-full bg-indigo-50 px-2.5 py-1 text-[10px] font-bold uppercase text-indigo-700">Within 10 km</span>
                          <span className="text-[11px] text-gray-400 font-medium">{req.distance?.toFixed(1)} km away</span>
                        </div>
                      </div>
                      <p className="text-gray-600 mb-6 text-sm leading-relaxed">{req.description}</p>
                      
                      <div className="space-y-4 rounded-2xl bg-slate-50 p-4">
                        <CameraUploader onUploadComplete={(url) => setUploadedImages(prev => ({ ...prev, [req.id]: [...(prev[req.id] || []), url] }))} />
                        
                        {uploadedImages[req.id]?.length > 0 && (
                          <div className="flex gap-2">
                            {uploadedImages[req.id].map((url, i) => (
                              <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden ring-1 ring-gray-200">
                                <Image src={url} fill sizes="64px" className="object-cover" alt="Uploaded product preview" unoptimized />
                                <button onClick={() => removeImage(req.id, url)} className="absolute top-0 right-0 bg-red-500 text-white p-0.5"><X className="w-3 h-3"/></button>
                              </div>
                            ))}
                          </div>
                        )}
                        <Textarea placeholder="Send a price quote..." className="bg-white" onChange={(e) => setResponseMessage(prev => ({ ...prev, [req.id]: e.target.value }))} />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 mt-4">
                        <Button className="h-12 bg-emerald-600 text-white hover:bg-emerald-700" onClick={() => handleRespondToRequest(req, true)}>I have this</Button>
                        <Button variant="outline" className="h-12" onClick={() => handleRespondToRequest(req, false)}>Not available</Button>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            )}

            {activeTab === "history" && (
              <div className="grid gap-3">
                {conversations.length === 0 ? (
                  <div className="rounded-3xl border border-dashed border-slate-300 bg-white py-12 text-center text-slate-400"><MessageCircle className="mx-auto mb-4 size-8 text-slate-300" />No customer chats yet.</div>
                ) : (
                  conversations.map((conv) => (
                    <Card 
                      key={conv.id} 
                      className="cursor-pointer rounded-2xl p-4 transition hover:border-indigo-200 hover:shadow-md"
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
