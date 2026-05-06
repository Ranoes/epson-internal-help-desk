"use client";

import { useState, useEffect } from "react";
import { ticketsApi, type Ticket } from "../../lib/api";

const STATUS_LABELS: Record<Ticket["status"], string> = {
  OPEN: "Terbuka",
  IN_PROGRESS: "Dalam Proses",
  RESOLVED: "Terselesaikan",
  CLOSED: "Ditutup",
};

const PRIORITY_LABELS: Record<Ticket["priority"], string> = {
  LOW: "Rendah",
  MEDIUM: "Sedang",
  HIGH: "Tinggi",
  CRITICAL: "Kritis",
};

const PRIORITY_COLORS: Record<Ticket["priority"], string> = {
  LOW: "bg-green-100 text-green-700",
  MEDIUM: "bg-yellow-100 text-yellow-700",
  HIGH: "bg-orange-100 text-orange-700",
  CRITICAL: "bg-red-100 text-red-700",
};

const STATUS_COLORS: Record<Ticket["status"], string> = {
  OPEN: "bg-blue-100 text-blue-700",
  IN_PROGRESS: "bg-purple-100 text-purple-700",
  RESOLVED: "bg-green-100 text-green-700",
  CLOSED: "bg-gray-100 text-gray-500",
};

// Dummy userId – in production this would come from auth context.
const DEMO_USER_ID = "00000000-0000-0000-0000-000000000001";

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  // New ticket form state
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", priority: "MEDIUM", category: "" });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    fetchTickets();
  }, []);

  async function fetchTickets() {
    setLoadingList(true);
    setListError(null);
    try {
      const data = await ticketsApi.list();
      setTickets(data);
    } catch (err) {
      setListError(err instanceof Error ? err.message : "Gagal memuat tiket");
    } finally {
      setLoadingList(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);
    try {
      await ticketsApi.create({
        title: form.title,
        description: form.description,
        priority: form.priority as Ticket["priority"],
        category: form.category || undefined,
        userId: DEMO_USER_ID,
      });
      setForm({ title: "", description: "", priority: "MEDIUM", category: "" });
      setShowForm(false);
      fetchTickets();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Gagal membuat tiket");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-blue-700">Tiket Dukungan</h1>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        >
          {showForm ? "Batal" : "+ Tiket Baru"}
        </button>
      </div>

      {/* Create ticket form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mb-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-4"
        >
          <h2 className="font-semibold text-gray-700">Buat Tiket Baru</h2>
          {formError && <p className="text-sm text-red-500">{formError}</p>}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Judul *</label>
            <input
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Ringkasan singkat masalah"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Deskripsi *</label>
            <textarea
              required
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Jelaskan masalah Anda secara detail…"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Prioritas</label>
              <select
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.priority}
                onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}
              >
                {Object.entries(PRIORITY_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Kategori</label>
              <input
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                placeholder="Contoh: Produksi, IT, K3…"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {submitting ? "Menyimpan…" : "Kirim Tiket"}
          </button>
        </form>
      )}

      {/* Ticket list */}
      {loadingList && <p className="text-sm text-gray-500">Memuat tiket…</p>}
      {listError && <p className="text-sm text-red-500">{listError}</p>}
      {!loadingList && tickets.length === 0 && (
        <p className="text-sm text-gray-500 text-center py-16">
          Belum ada tiket. Klik &ldquo;+ Tiket Baru&rdquo; untuk membuat tiket pertama.
        </p>
      )}
      <ul className="space-y-4">
        {tickets.map((ticket) => (
          <li
            key={ticket.id}
            className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-semibold text-gray-800">{ticket.title}</p>
                <p className="text-sm text-gray-500 mt-1 line-clamp-2">{ticket.description}</p>
                {ticket.category && (
                  <p className="text-xs text-gray-400 mt-1">Kategori: {ticket.category}</p>
                )}
              </div>
              <div className="flex flex-col items-end gap-2 shrink-0">
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[ticket.status]}`}>
                  {STATUS_LABELS[ticket.status]}
                </span>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${PRIORITY_COLORS[ticket.priority]}`}>
                  {PRIORITY_LABELS[ticket.priority]}
                </span>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-3">
              {new Date(ticket.createdAt).toLocaleString("id-ID")}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
