"use client";

import { useEffect, useState } from "react";
import { FaBolt, FaSave, FaSyncAlt } from "react-icons/fa";
import apiClient from "@/lib/api-client";

type AiProvider = "ollama" | "openrouter";

export default function AdminSettingsPage() {
  const [provider, setProvider] = useState<AiProvider>("ollama");
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await apiClient.get("/admin/settings/ai");
        if (response.data?.success) {
          setProvider(response.data.settings?.aiProvider || "ollama");
          setUpdatedAt(response.data.settings?.updatedAt || null);
        }
      } catch (error) {
        console.error("Failed to load AI settings:", error);
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  const saveSettings = async () => {
    setSaving(true);
    try {
      const response = await apiClient.put("/admin/settings/ai", {
        aiProvider: provider,
      });
      if (response.data?.success) {
        setUpdatedAt(response.data.settings?.updatedAt || new Date().toISOString());
      }
    } catch (error) {
      console.error("Failed to save AI settings:", error);
      alert("Failed to save AI settings. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-800"></div>
          <p className="mt-4 text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 font-playfair">
          AI Settings
        </h1>
        <p className="text-gray-600 mt-2 font-lato">
          Switch between local Ollama and external OpenRouter without editing env files.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => setProvider("ollama")}
            className={`p-5 rounded-xl border text-left transition ${
              provider === "ollama"
                ? "border-gray-900 bg-gray-900 text-white"
                : "border-gray-200 bg-gray-50 text-gray-900 hover:border-gray-300"
            }`}
          >
            <div className="flex items-center gap-3 mb-2">
              <FaBolt />
              <span className="font-semibold">Local Ollama</span>
            </div>
            <p className={`text-sm ${provider === "ollama" ? "text-gray-200" : "text-gray-600"}`}>
              Runs on the local machine for private and low-latency responses.
            </p>
          </button>

          <button
            onClick={() => setProvider("openrouter")}
            className={`p-5 rounded-xl border text-left transition ${
              provider === "openrouter"
                ? "border-emerald-600 bg-emerald-600 text-white"
                : "border-gray-200 bg-gray-50 text-gray-900 hover:border-gray-300"
            }`}
          >
            <div className="flex items-center gap-3 mb-2">
              <FaBolt />
              <span className="font-semibold">OpenRouter API</span>
            </div>
            <p className={`text-sm ${provider === "openrouter" ? "text-emerald-50" : "text-gray-600"}`}>
              Uses the external API key for cloud models and faster model switching.
            </p>
          </button>
        </div>

        <div className="rounded-xl bg-gray-50 border border-gray-200 p-4 text-sm text-gray-700">
          Active provider: <span className="font-semibold">{provider}</span>
          {updatedAt ? (
            <span className="ml-2 text-gray-500">Last updated {new Date(updatedAt).toLocaleString()}</span>
          ) : null}
        </div>

        <div className="flex items-center justify-end gap-3">
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 flex items-center gap-2"
          >
            <FaSyncAlt size={14} /> Refresh
          </button>
          <button
            onClick={saveSettings}
            disabled={saving}
            className="px-4 py-2 rounded-lg bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-60 flex items-center gap-2"
          >
            <FaSave size={14} /> {saving ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </div>
    </div>
  );
}