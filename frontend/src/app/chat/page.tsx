"use client";

import { useState, useRef, useEffect } from "react";
import { aiApi, type ChatMessage } from "../../lib/api";

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function handleSend() {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    const userMsg: ChatMessage = { role: "user", content: trimmed };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    setError(null);

    try {
      const { reply } = await aiApi.chat(trimmed, messages);
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 flex flex-col h-[calc(100vh-10rem)]">
      <h1 className="text-2xl font-bold text-blue-700 mb-4">Asisten AI – Epson Help Desk</h1>
      <p className="text-sm text-gray-500 mb-4">
        Tanyakan apa saja terkait prosedur SOP manufaktur sintetik Epson.
      </p>

      {/* Message list */}
      <div className="flex-1 overflow-y-auto bg-white rounded-2xl border border-gray-200 p-4 space-y-4 shadow-sm">
        {messages.length === 0 && (
          <p className="text-gray-400 text-sm text-center mt-16">
            Ketik pertanyaan Anda di bawah untuk memulai percakapan…
          </p>
        )}
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === "user"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-800"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 text-gray-500 rounded-2xl px-4 py-2 text-sm animate-pulse">
              Sedang mengetik…
            </div>
          </div>
        )}
        {error && (
          <div className="text-red-500 text-sm text-center">{error}</div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div className="mt-4 flex gap-2">
        <input
          type="text"
          className="flex-1 rounded-full border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Tulis pertanyaan Anda…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          disabled={loading}
        />
        <button
          onClick={handleSend}
          disabled={loading || !input.trim()}
          className="rounded-full bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          Kirim
        </button>
      </div>
    </div>
  );
}
