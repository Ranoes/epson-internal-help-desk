"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FaTicketAlt, FaReply, FaClock, FaCheckCircle } from "react-icons/fa";
import apiClient from "@/lib/api-client";

interface TicketItem {
  id: string;
  ticketId?: string;
  userId: string;
  userName: string;
  title: string;
  description: string;
  question: string;
  sessionId: string;
  status: "open" | "in_progress" | "resolved" | "closed";
  assignedTo: string | null;
  resolution?: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function EmployeeTicketsPage() {
  const router = useRouter();
  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");

    if (!storedUser || !token) {
      router.push("/login");
      return;
    }

    const parsedUser = JSON.parse(storedUser);
    setUser(parsedUser);
  }, [router]);

  useEffect(() => {
    const loadTickets = async () => {
      if (!user?.id) return;

      try {
        const response = await apiClient.get("/tickets");
        const allTickets = response.data.tickets || [];
        const myTickets = allTickets.filter((ticket: TicketItem) => ticket.userId === user.id);
        setTickets(myTickets);
      } catch (error) {
        console.error("Failed to load tickets:", error);
      } finally {
        setLoading(false);
      }
    };

    loadTickets();
  }, [user]);

  const getStatusBadge = (status: string) => {
    const className =
      status === "resolved"
        ? "bg-green-100 text-green-800"
        : status === "in_progress"
        ? "bg-amber-100 text-amber-800"
        : "bg-slate-100 text-slate-700";

    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${className}`}>
        {status === "resolved" ? <FaCheckCircle size={12} /> : <FaClock size={12} />}
        {status.replace("_", " ")}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-800"></div>
          <p className="mt-4 text-gray-600">Loading your tickets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 font-playfair flex items-center gap-3">
              <FaTicketAlt /> My Tickets
            </h1>
            <p className="text-gray-600 mt-2">
              Escalation tickets and admin replies for {user?.name || "you"}.
            </p>
          </div>
          <button
            onClick={() => router.push("/chat")}
            className="px-4 py-2 rounded-lg bg-gray-900 text-white hover:bg-gray-800 transition"
          >
            Back to Session Chat
          </button>
        </div>

        {tickets.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center shadow-sm">
            <FaTicketAlt className="mx-auto text-gray-300" size={42} />
            <p className="mt-4 text-gray-700 font-semibold">Belum ada ticket eskalasi</p>
            <p className="text-sm text-gray-500 mt-1">
              Kalau chatbot belum bisa bantu, ticket akan muncul di halaman ini setelah kamu buat eskalasi.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {tickets.map((ticket) => (
              <div key={ticket.id} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-500">{ticket.id}</p>
                    <h2 className="text-xl font-semibold text-gray-900 mt-1">{ticket.title}</h2>
                    <p className="text-sm text-gray-600 mt-2 whitespace-pre-line">{ticket.question}</p>
                  </div>
                  <div className="flex items-center gap-2">{getStatusBadge(ticket.status)}</div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5 text-sm">
                  <div className="rounded-xl bg-gray-50 p-4 border border-gray-100">
                    <p className="text-gray-500">Assigned To</p>
                    <p className="font-semibold text-gray-900 mt-1">{ticket.assignedTo || "Belum ditugaskan"}</p>
                  </div>
                  <div className="rounded-xl bg-gray-50 p-4 border border-gray-100">
                    <p className="text-gray-500">Created</p>
                    <p className="font-semibold text-gray-900 mt-1">{new Date(ticket.createdAt).toLocaleString()}</p>
                  </div>
                  <div className="rounded-xl bg-gray-50 p-4 border border-gray-100">
                    <p className="text-gray-500">Session</p>
                    <p className="font-semibold text-gray-900 mt-1">{ticket.sessionId}</p>
                  </div>
                </div>

                <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50 p-4">
                  <div className="flex items-center gap-2 text-blue-900 font-semibold">
                    <FaReply /> Admin Reply
                  </div>
                  <p className="mt-2 text-sm text-blue-900 whitespace-pre-line">
                    {ticket.resolution?.trim()
                      ? ticket.resolution
                      : "Belum ada balasan dari admin. Ticket masih menunggu tindak lanjut."}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}