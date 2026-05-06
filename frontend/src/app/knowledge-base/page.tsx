"use client";

import { useState, useEffect } from "react";
import { knowledgeBaseApi, type KnowledgeBaseEntry } from "../../lib/api";

export default function KnowledgeBasePage() {
  const [entries, setEntries] = useState<KnowledgeBaseEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [selected, setSelected] = useState<KnowledgeBaseEntry | null>(null);

  useEffect(() => {
    fetchEntries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchEntries() {
    setLoading(true);
    setError(null);
    try {
      const params: { q?: string; category?: string } = {};
      if (query.trim()) params.q = query.trim();
      if (category.trim()) params.category = category.trim();
      const data = await knowledgeBaseApi.list(params);
      setEntries(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat knowledge base");
    } finally {
      setLoading(false);
    }
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    fetchEntries();
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold text-blue-700 mb-2">Knowledge Base</h1>
      <p className="text-sm text-gray-500 mb-6">
        Cari dan baca SOP manufaktur sintetik Epson yang tersedia.
      </p>

      {/* Search bar */}
      <form onSubmit={handleSearch} className="flex gap-3 mb-8">
        <input
          type="text"
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Cari SOP, kata kunci…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <input
          type="text"
          className="w-40 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Kategori"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        />
        <button
          type="submit"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        >
          Cari
        </button>
      </form>

      {loading && <p className="text-sm text-gray-500">Memuat…</p>}
      {error && <p className="text-sm text-red-500">{error}</p>}

      {!loading && entries.length === 0 && (
        <p className="text-sm text-gray-500 text-center py-16">
          Tidak ada entri yang ditemukan. Coba kata kunci lain.
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {entries.map((entry) => (
          <button
            key={entry.id}
            onClick={() => setSelected(entry)}
            className="text-left rounded-2xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow"
          >
            <p className="font-semibold text-gray-800 mb-1 line-clamp-2">{entry.title}</p>
            {entry.category && (
              <span className="inline-block bg-blue-50 text-blue-600 text-xs rounded-full px-2 py-0.5 mb-2">
                {entry.category}
              </span>
            )}
            <p className="text-sm text-gray-500 line-clamp-3">{entry.content}</p>
            {entry.tags && (
              <p className="text-xs text-gray-400 mt-2">{entry.tags}</p>
            )}
          </button>
        ))}
      </div>

      {/* Detail modal */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[80vh] overflow-y-auto p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">{selected.title}</h2>
              <button
                onClick={() => setSelected(null)}
                className="text-gray-400 hover:text-gray-600 text-xl font-bold leading-none"
              >
                ×
              </button>
            </div>
            {selected.category && (
              <span className="inline-block bg-blue-50 text-blue-600 text-xs rounded-full px-2 py-0.5 mb-3">
                {selected.category}
              </span>
            )}
            <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
              {selected.content}
            </p>
            {selected.tags && (
              <p className="text-xs text-gray-400 mt-4">Tags: {selected.tags}</p>
            )}
            <p className="text-xs text-gray-400 mt-2">
              Diperbarui: {new Date(selected.updatedAt).toLocaleString("id-ID")}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
