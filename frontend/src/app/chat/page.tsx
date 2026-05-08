"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import MessageBubble from "@/components/chat/MessageBubble";
import InputBar from "@/components/chat/InputBar";
import TypingIndicator from "@/components/chat/TypingIndicator";
import apiClient from "@/lib/api-client";
import { ChatReply, HistoryMessage } from "@/types/api";
import { FaSignOutAlt, FaRobot } from "react-icons/fa";

interface Message extends HistoryMessage {
  sessionId?: string;
}

export default function ChatPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string>("");
  const [user, setUser] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check authentication
    const storedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");

    if (!storedUser || !token) {
      router.push("/login");
      return;
    }

    const parsedUser = JSON.parse(storedUser);
    setUser(parsedUser);

    // Generate session ID
    const newSessionId = `sess_${Date.now()}`;
    setSessionId(newSessionId);

    // Load chat history
    loadHistory(newSessionId);
  }, [router]);

  const loadHistory = async (sid: string) => {
    try {
      const response = await apiClient.get(`/chat/history/${sid}`);
      if (response.data.success && response.data.messages) {
        setMessages(response.data.messages);
      }
    } catch (err) {
      console.error("Failed to load history:", err);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (text: string, imageBase64?: string) => {
    if (!text.trim() || !sessionId || !user) return;

    // Generate unique ID using timestamp + random
    const uniqueId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Add user message optimistically
    const userMessage: Message = {
      messageId: uniqueId,
      role: "user",
      content: text,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMessage]);

    setIsLoading(true);

    try {
      const response = await apiClient.post<ChatReply>("/chat/message", {
        sessionId,
        userId: user.id,
        message: text,
        imageBase64: imageBase64 || null,
      });

      if (response.data.success) {
        // Ensure unique ID for assistant message too
        const assistantUniqueId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const assistantMessage: Message = {
          messageId: assistantUniqueId,
          role: "assistant",
          content: response.data.reply,
          confidence: response.data.confidence,
          timestamp: response.data.timestamp,
        };
        setMessages((prev) => [...prev, assistantMessage]);
      }
    } catch (err) {
      console.error("Failed to send message:", err);
      // Show error message to user
      const errorMessage: Message = {
        messageId: `msg_error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        role: "assistant",
        content: "Sorry, an error occurred. Please try again.",
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        Loading...
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <img src="/images/epson-logo.svg" alt="Epson" className="h-10" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2 font-playfair">
              <FaRobot className="text-gray-600" size={24} />
              Epson Helpdesk
            </h1>
            <p className="text-sm text-gray-600">Welcome, {user.name}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition text-sm font-semibold flex items-center gap-2 shadow-sm hover:shadow-md"
        >
          <FaSignOutAlt size={16} />
          Logout
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-12">
            <FaRobot className="text-6xl text-indigo-400 mx-auto mb-4 opacity-50" />
            <p className="text-gray-600 text-lg font-semibold">
              Start a conversation with our chatbot
            </p>
            <p className="text-gray-500 text-sm mt-2">
              Ask about printer issues, errors, or technical support
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <MessageBubble key={msg.messageId} message={msg} />
        ))}

        {isLoading && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-white border-t border-gray-200 p-4">
        <InputBar onSendMessage={handleSendMessage} disabled={isLoading} />
      </div>
    </div>
  );
}
