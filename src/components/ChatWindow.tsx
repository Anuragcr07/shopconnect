"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import Button from "@/components/ui/Button";
import { MessageCircle, Send, X } from "lucide-react";

interface Message {
  id: string;
  senderId: string;
  content: string;
  createdAt: string;
  read: boolean;
}

interface ChatWindowProps {
  customerPostId: string;
  shopkeeperId: string;
  recipientName: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function ChatWindow({
  customerPostId,
  shopkeeperId,
  recipientName,
  isOpen,
  onClose,
}: ChatWindowProps) {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [shopRequest, setShopRequest] = useState<{
    isAvailable: boolean;
    message: string | null;
    imageUrls: string[];
  } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastMessageTimeRef = useRef<string | null>(null);

  const markMessagesAsRead = useCallback(async (convId: string) => {
    try {
      await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "markRead", conversationId: convId }),
      });
    } catch (err) { console.error(err); }
  }, []);

  const initializeChat = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "init", customerPostId, shopkeeperId }),
      });
      const data = await res.json();
      
      if (data.id) {
        setConversationId(data.id);
        const msgs = data.messages || [];
        setMessages(msgs);
        setShopRequest(data.shopRequest || null);
        
        if (msgs.length > 0) {
          lastMessageTimeRef.current = msgs[msgs.length - 1].createdAt;
        }
        markMessagesAsRead(data.id);
      }
    } catch (err) {
      console.error("Chat init error:", err);
    } finally {
      setLoading(false);
    }
  }, [customerPostId, shopkeeperId, markMessagesAsRead]);

  useEffect(() => {
    if (isOpen && session?.user?.id && customerPostId && shopkeeperId) {
      initializeChat();
    }
  }, [isOpen, customerPostId, shopkeeperId, session?.user?.id, initializeChat]);

  useEffect(() => {
    if (!conversationId || !isOpen) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            action: "fetch", 
            conversationId,
            after: lastMessageTimeRef.current 
          }),
        });
        const newMessages = await res.json();
        if (Array.isArray(newMessages) && newMessages.length > 0) {
          setMessages(prev => {
            const existingIds = new Set(prev.map(m => m.id));
            const uniqueNew = newMessages.filter((m: Message) => !existingIds.has(m.id));
            if (uniqueNew.length > 0) {
              lastMessageTimeRef.current = uniqueNew[uniqueNew.length - 1].createdAt;
              return [...prev, ...uniqueNew];
            }
            return prev;
          });
        }
      } catch (err) { console.error("Poll error:", err); }
    }, 2000);
    return () => clearInterval(interval);
  }, [conversationId, isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || !conversationId || sending) return;
    const content = newMessage.trim();
    setNewMessage("");
    setSending(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "send", conversationId, content }),
      });
      const saved = await res.json();
      setMessages(prev => [...prev, saved]);
      lastMessageTimeRef.current = saved.createdAt;
    } catch {
      alert("Failed to send"); 
    } finally { setSending(false); }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-end justify-center bg-slate-950/65 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="flex h-[78vh] w-full max-w-md flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:h-[560px] sm:rounded-3xl">
        <div className="flex items-center justify-between bg-slate-950 p-4 text-white sm:p-5">
          <div className="flex min-w-0 items-center gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-indigo-500"><MessageCircle className="size-5" /></span><div className="min-w-0"><p className="text-xs font-semibold text-slate-400">Conversation with</p><h3 className="truncate font-extrabold">{recipientName}</h3></div></div>
          <button type="button" aria-label="Close chat" onClick={onClose} className="grid size-11 place-items-center rounded-xl text-slate-300 transition hover:bg-white/10 hover:text-white"><X className="size-5" /></button>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50 p-4">
          {shopRequest && (
            <div className="mb-4 rounded-2xl border border-indigo-100 bg-indigo-50/40 p-3.5 text-xs leading-relaxed text-slate-700">
              <p className="font-bold text-indigo-800 uppercase tracking-wider text-[10px] mb-1">Response Offer Details</p>
              <p className="font-bold text-slate-900 mb-1.5 flex items-center gap-1.5">
                <span className={`inline-block h-2 w-2 rounded-full ${shopRequest.isAvailable ? "bg-emerald-500" : "bg-rose-500"}`} />
                {shopRequest.isAvailable ? "Available" : "Not Available"}
              </p>
              {shopRequest.message && (
                <p className="italic text-slate-600 mb-2 leading-relaxed">&ldquo;{shopRequest.message}&rdquo;</p>
              )}
              {shopRequest.imageUrls && shopRequest.imageUrls.length > 0 && (
                <div className="flex gap-2 overflow-x-auto py-1">
                  {shopRequest.imageUrls.map((url, i) => (
                    <div key={i} className="relative size-16 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-white">
                      <img
                        src={url}
                        alt="Product offer preview"
                        className="h-full w-full object-cover cursor-pointer"
                        onClick={() => window.open(url, "_blank")}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          {loading ? (
            <p className="mt-10 text-center text-sm font-semibold text-slate-500">Loading messages…</p>
          ) : messages.length === 0 ? (
            <p className="mt-10 text-center text-sm text-slate-400">No messages yet. Say hello!</p>
          ) : (
            messages.map((msg) => {
              const isMine = msg.senderId === session?.user?.id;
              return (
                <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[84%] rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm ${isMine ? "rounded-br-md bg-indigo-600 text-white" : "rounded-bl-md border border-slate-200 bg-white text-slate-800"}`}>
                    {msg.content}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="flex gap-2 border-t border-slate-200 bg-white p-3 sm:p-4">
          <input 
            className="min-h-12 min-w-0 flex-1 rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
            value={newMessage} 
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
          />
          <Button aria-label="Send message" onClick={handleSend} disabled={sending} className="size-12 shrink-0 px-0">
            <Send className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
