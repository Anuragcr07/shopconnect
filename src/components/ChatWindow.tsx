"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import Button from "@/components/ui/Button";

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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastMessageTimeRef = useRef<string | null>(null);

  useEffect(() => {
    if (isOpen && session?.user?.id && customerPostId && shopkeeperId) {
      initializeChat();
    }
  }, [isOpen, customerPostId, shopkeeperId, session?.user?.id]);

  const initializeChat = async () => {
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
  };

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

  const markMessagesAsRead = async (convId: string) => {
    try {
      await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "markRead", conversationId: convId }),
      });
    } catch (err) { console.error(err); }
  };

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
    } catch (err) { 
      alert("Failed to send"); 
    } finally { setSending(false); }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-xl shadow-2xl flex flex-col h-[500px]">
        <div className="p-4 bg-blue-600 flex justify-between items-center text-white rounded-t-xl">
          <h3 className="font-bold">{recipientName}</h3>
          <button onClick={onClose} className="p-1">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
          {loading ? (
            <p className="text-center text-gray-500 mt-10">Loading...</p>
          ) : messages.length === 0 ? (
            <p className="text-center text-gray-400 mt-10">No messages yet.</p>
          ) : (
            messages.map((msg) => {
              const isMine = msg.senderId === session?.user?.id;
              return (
                <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] p-3 rounded-xl text-sm ${isMine ? "bg-blue-600 text-white" : "bg-white border text-gray-800"}`}>
                    {msg.content}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-3 border-t flex gap-2">
          <input 
            className="flex-1 border rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            value={newMessage} 
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
          />
          <Button onClick={handleSend} disabled={sending} className="rounded-full px-4">
            Send
          </Button>
        </div>
      </div>
    </div>
  );
}