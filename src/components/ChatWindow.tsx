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
  const [isTyping, setIsTyping] = useState(false);
  const [recipientOnline, setRecipientOnline] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastMessageTimeRef = useRef<string | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize conversation
  useEffect(() => {
    if (isOpen && session?.user?.id) {
      initializeChat();
    }
  }, [isOpen, customerPostId, shopkeeperId, session]);

  const initializeChat = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "init", customerPostId, shopkeeperId }),
      });
      const data = await res.json();
      setConversationId(data.id);
      setMessages(data.messages || []);
      if (data.messages.length > 0) {
        lastMessageTimeRef.current = data.messages[data.messages.length - 1].createdAt;
      }
      // Mark messages as read
      markMessagesAsRead(data.id);
    } catch (err) {
      console.error("Chat init error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Poll for new messages (faster interval: 1 second)
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
            after: lastMessageTimeRef.current // Only fetch new messages
          }),
        });
        const newMessages = await res.json();
        
        if (newMessages.length > 0) {
          setMessages(prev => {
            // Avoid duplicates
            const existingIds = new Set(prev.map(m => m.id));
            const uniqueNew = newMessages.filter((m: Message) => !existingIds.has(m.id));
            if (uniqueNew.length > 0) {
              lastMessageTimeRef.current = uniqueNew[uniqueNew.length - 1].createdAt;
              // Mark new messages as read
              markMessagesAsRead(conversationId);
              return [...prev, ...uniqueNew];
            }
            return prev;
          });
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    }, 1000); // Poll every 1 second for better real-time feel

    return () => clearInterval(interval);
  }, [conversationId, isOpen]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Mark messages as read when window is open
  const markMessagesAsRead = async (convId: string) => {
    try {
      await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "markRead", conversationId: convId }),
      });
    } catch (err) {
      console.error("Mark read error:", err);
    }
  };

  // Handle typing indicator
  const handleTyping = () => {
    setIsTyping(true);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
    }, 1000);
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !conversationId || !session?.user?.id || sending) return;
    
    const tempContent = newMessage.trim();
    const tempId = `temp-${Date.now()}`;
    setNewMessage("");
    setSending(true);
    
    // Optimistic UI update
    const optimisticMessage: Message = {
      id: tempId,
      senderId: session.user.id,
      content: tempContent,
      createdAt: new Date().toISOString(),
      read: false
    };
    
    setMessages(prev => [...prev, optimisticMessage]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          action: "send", 
          conversationId, 
          content: tempContent 
        }),
      });
      
      const savedMessage = await res.json();
      
      // Replace optimistic message with real one
      setMessages(prev => 
        prev.map(msg => msg.id === tempId ? savedMessage : msg)
      );
      
      lastMessageTimeRef.current = savedMessage.createdAt;
    } catch (err) {
      console.error("Send error:", err);
      // Remove failed message
      setMessages(prev => prev.filter(msg => msg.id !== tempId));
      alert("Failed to send message. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-xl shadow-2xl flex flex-col h-[600px] border border-gray-300 dark:border-gray-600">
        
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-blue-600 to-blue-700 flex justify-between items-center text-white rounded-t-xl shadow-md">
          <div>
            <h3 className="font-bold text-lg">{recipientName}</h3>
            <p className="text-xs text-blue-100">
              {recipientOnline ? "🟢 Online" : "⚪ Offline"}
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="hover:bg-blue-800 p-2 rounded-full transition-colors"
            aria-label="Close chat"
          >
            ✕
          </button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-900 space-y-3">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-gray-500">Loading messages...</p>
              </div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-400 text-center">
                No messages yet.<br/>Start the conversation!
              </p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMine = msg.senderId === session?.user?.id;
              return (
                <div 
                  key={msg.id} 
                  className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                >
                  <div 
                    className={`max-w-[75%] p-3 rounded-2xl shadow-sm ${
                      isMine 
                        ? "bg-blue-600 text-white rounded-br-sm" 
                        : "bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-sm"
                    }`}
                  >
                    <p className="text-sm break-words">{msg.content}</p>
                    <div className={`text-xs mt-1 flex items-center gap-1 ${
                      isMine ? "text-blue-100 justify-end" : "text-gray-500"
                    }`}>
                      <span>{formatTime(msg.createdAt)}</span>
                      {isMine && (
                        <span>{msg.read ? "✓✓" : "✓"}</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          
          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-gray-200 dark:bg-gray-700 p-3 rounded-2xl">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex gap-2 rounded-b-xl">
          <input 
            className="flex-1 border border-gray-300 dark:border-gray-600 rounded-full px-4 py-2.5 text-sm text-black dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" 
            value={newMessage} 
            onChange={(e) => {
              setNewMessage(e.target.value);
              handleTyping();
            }}
            placeholder="Type a message..." 
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            disabled={sending || loading}
          />
          <Button 
            onClick={handleSend} 
            disabled={!newMessage.trim() || sending || loading}
            className="rounded-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed px-6 transition-colors"
          >
            {sending ? "..." : "Send"}
          </Button>
        </div>
      </div>
    </div>
  );
}