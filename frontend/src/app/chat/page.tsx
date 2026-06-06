"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import MessageBubble from "@/components/chat/MessageBubble";
import InputBar from "@/components/chat/InputBar";
import TypingIndicator from "@/components/chat/TypingIndicator";
import apiClient from "@/lib/api-client";
import { ChatReply, HistoryMessage } from "@/types/api";
import {
  FaSignOutAlt,
  FaRobot,
  FaTicketAlt,
  FaChevronLeft,
  FaChevronRight,
  FaPlus,
  FaComments,
} from "react-icons/fa";

interface Message extends HistoryMessage {
  sessionId?: string;
}

interface ChatSession {
  sessionId: string;
  preview: string;
  updatedAt: string;
  lastRole: "user" | "assistant";
}

const createSessionId = () =>
  `sess_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

const getSessionStorageKey = (userId: string) => `chat_active_session_${userId}`;

export default function ChatPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [ticketSubmitting, setTicketSubmitting] = useState(false);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [lastEscalation, setLastEscalation] = useState<{
    question: string;
    reply: string;
    ticketId?: string | null;
  } | null>(null);
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

    initializeSessions(parsedUser.id);
  }, [router]);

  const initializeSessions = async (userId: string) => {
    try {
      const response = await apiClient.get("/chat/sessions");
      const existingSessions: ChatSession[] = response.data?.sessions || [];
      setSessions(existingSessions);

      const storageKey = getSessionStorageKey(userId);
      const savedActiveSession = localStorage.getItem(storageKey);
      const fallbackSession = existingSessions[0]?.sessionId;
      const activeSession =
        savedActiveSession &&
        existingSessions.some((session) => session.sessionId === savedActiveSession)
          ? savedActiveSession
          : fallbackSession;

      if (activeSession) {
        setSessionId(activeSession);
        localStorage.setItem(storageKey, activeSession);
        await loadHistory(activeSession);
      } else {
        const newSessionId = createSessionId();
        const nowIso = new Date().toISOString();
        setSessionId(newSessionId);
        setMessages([]);
        setSessions([
          {
            sessionId: newSessionId,
            preview: "Session baru",
            updatedAt: nowIso,
            lastRole: "user",
          },
        ]);
        localStorage.setItem(storageKey, newSessionId);
      }
    } catch (error) {
      console.error("Failed to initialize sessions:", error);
      const newSessionId = createSessionId();
      setSessionId(newSessionId);
      setMessages([]);
    } finally {
      setLoadingSessions(false);
    }
  };

  const loadHistory = async (sid: string) => {
    try {
      const response = await apiClient.get(`/chat/history/${sid}`);
      if (response.data.success && response.data.messages) {
        setMessages(response.data.messages);
      } else {
        setMessages([]);
      }
    } catch (err) {
      console.error("Failed to load history:", err);
      setMessages([]);
    }
  };

  const switchSession = async (nextSessionId: string) => {
    if (!user || !nextSessionId || nextSessionId === sessionId) return;
    setSessionId(nextSessionId);
    setLastEscalation(null);
    localStorage.setItem(getSessionStorageKey(user.id), nextSessionId);
    await loadHistory(nextSessionId);
  };

  const startNewSession = () => {
    if (!user) return;

    const newSessionId = createSessionId();
    const nowIso = new Date().toISOString();
    setSessionId(newSessionId);
    setMessages([]);
    setLastEscalation(null);
    localStorage.setItem(getSessionStorageKey(user.id), newSessionId);
    setSessions((current) => [
      {
        sessionId: newSessionId,
        preview: "Session baru",
        updatedAt: nowIso,
        lastRole: "user",
      },
      ...current.filter((session) => session.sessionId !== newSessionId),
    ]);
  };

  const upsertSessionPreview = (
    targetSessionId: string,
    preview: string,
    lastRole: "user" | "assistant",
  ) => {
    const cleanPreview = preview.trim() || "Pesan baru";
    const nowIso = new Date().toISOString();

    setSessions((current) => {
      const nextSession: ChatSession = {
        sessionId: targetSessionId,
        preview: cleanPreview.length > 60 ? `${cleanPreview.slice(0, 60)}...` : cleanPreview,
        updatedAt: nowIso,
        lastRole,
      };

      return [
        nextSession,
        ...current.filter((session) => session.sessionId !== targetSessionId),
      ];
    });
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (text: string, imageBase64?: string) => {
    if (!text.trim() || !sessionId || !user) return;
    setLastEscalation(null);

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
    upsertSessionPreview(sessionId, text, "user");

    setIsLoading(true);

    try {
      const response = await apiClient.post<ChatReply>("/chat/message", {
        sessionId,
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
          timestamp: response.data.timestamp || new Date().toISOString(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
        upsertSessionPreview(sessionId, response.data.reply, "assistant");

        if (response.data.escalated) {
          setLastEscalation({
            question: text,
            reply: response.data.reply,
            ticketId: response.data.ticketId || null,
          });
        }
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

  const handleCreateTicket = async () => {
    if (!user || !sessionId || !lastEscalation?.question) return;

    setTicketSubmitting(true);
    try {
      const response = await apiClient.post("/tickets", {
        userId: user.id,
        sessionId,
        question: lastEscalation.question,
      });

      if (response.data?.success) {
        setLastEscalation((current) =>
          current
            ? { ...current, ticketId: response.data.ticketId }
            : current,
        );
      }
    } catch (error) {
      console.error("Failed to create escalation ticket:", error);
      alert("Gagal membuat ticket eskalasi. Coba lagi ya.");
    } finally {
      setTicketSubmitting(false);
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

  if (loadingSessions) {
    return (
      <div className="flex items-center justify-center h-screen">
        Loading chat sessions...
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50">
      <aside
        className={`hidden md:flex ${sidebarCollapsed ? "w-20" : "w-80"} flex-col border-r border-slate-200 bg-white shadow-sm transition-all duration-200`}
      >
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center justify-between gap-2">
            {!sidebarCollapsed && <img src="/images/epson-logo.svg" alt="Epson" className="h-10" />}
            <button
              onClick={() => setSidebarCollapsed((state) => !state)}
              className="h-9 w-9 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 flex items-center justify-center"
            >
              {sidebarCollapsed ? <FaChevronRight size={14} /> : <FaChevronLeft size={14} />}
            </button>
          </div>
          {!sidebarCollapsed && (
            <p className="text-sm text-slate-500 mt-3">
              Customer service untuk karyawan manufaktur.
            </p>
          )}
        </div>

        <div className="p-4 space-y-2 border-b border-slate-200">
          <button
            onClick={startNewSession}
            className="w-full px-4 py-3 rounded-xl bg-slate-900 text-white font-semibold flex items-center justify-center gap-2"
          >
            <FaPlus size={12} /> {!sidebarCollapsed && "New Session"}
          </button>
          <button
            onClick={() => router.push("/chat")}
            className="w-full text-left px-4 py-3 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold flex items-center gap-2"
          >
            <FaComments size={14} /> {!sidebarCollapsed && "Session Chat"}
          </button>
          <button
            onClick={() => router.push("/tickets")}
            className="w-full text-left px-4 py-3 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold flex items-center gap-2"
          >
            <FaTicketAlt size={14} /> {!sidebarCollapsed && "Ticket Saya"}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {!sidebarCollapsed && sessions.length === 0 && (
            <p className="text-xs text-slate-500 px-2">Belum ada session.</p>
          )}
          {sessions.map((session) => {
            const isActive = session.sessionId === sessionId;
            return (
              <button
                key={session.sessionId}
                onClick={() => switchSession(session.sessionId)}
                className={`w-full text-left rounded-xl border px-3 py-2 transition ${
                  isActive
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                <p className="text-xs font-semibold truncate">
                  {sidebarCollapsed ? "Session" : session.preview || "Session"}
                </p>
                {!sidebarCollapsed && (
                  <p className={`text-[11px] mt-1 ${isActive ? "text-slate-200" : "text-slate-500"}`}>
                    {new Date(session.updatedAt).toLocaleString()}
                  </p>
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-auto p-4 border-t border-slate-200 text-sm text-slate-600 space-y-2">
          {!sidebarCollapsed && (
            <div>
              <p className="font-semibold text-slate-900">Session Aktif</p>
              <p className="truncate">{sessionId || "Generating..."}</p>
            </div>
          )}
          {lastEscalation && (
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-amber-900">
              <p className="font-semibold">Eskalasi aktif</p>
              <p className="text-xs mt-1">
                {lastEscalation.ticketId ? `Ticket: ${lastEscalation.ticketId}` : "Silakan buat ticket eskalasi."}
              </p>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="w-full px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition text-sm font-semibold flex items-center justify-center gap-2"
          >
            <FaSignOutAlt size={16} />
            Logout
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0">
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
          <div className="flex items-center gap-2">
            <button
              onClick={startNewSession}
              className="md:hidden px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition text-sm font-semibold"
            >
              New Session
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition text-sm font-semibold flex items-center gap-2 shadow-sm hover:shadow-md"
            >
              <FaSignOutAlt size={16} />
              Logout
            </button>
          </div>
        </div>

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

        {lastEscalation && (
          <div className="border-t border-amber-200 bg-amber-50 px-6 py-4">
            <div className="max-w-4xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <p className="font-semibold text-amber-900">
                  Butuh eskalasi?
                </p>
                <p className="text-sm text-amber-800">
                  {lastEscalation.ticketId
                    ? `Ticket eskalasi sudah dibuat: ${lastEscalation.ticketId}.`
                    : "Aku belum menemukan jawaban yang pas di knowledge base. Klik buat ticket eskalasi biar admin lanjut bantu."}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => router.push("/tickets")}
                  className="px-4 py-2 rounded-lg border border-amber-300 text-amber-900 bg-white hover:bg-amber-100 transition flex items-center gap-2"
                >
                  <FaTicketAlt size={14} /> Lihat Ticket Saya
                </button>
                {!lastEscalation.ticketId && (
                  <button
                    onClick={handleCreateTicket}
                    disabled={ticketSubmitting}
                    className="px-4 py-2 rounded-lg bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-60 transition flex items-center gap-2"
                  >
                    <FaTicketAlt size={14} />
                    {ticketSubmitting ? "Membuat..." : "Buat Ticket Eskalasi"}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="bg-white border-t border-gray-200 p-4">
          <InputBar onSendMessage={handleSendMessage} disabled={isLoading} />
        </div>
      </main>
    </div>
  );
}
