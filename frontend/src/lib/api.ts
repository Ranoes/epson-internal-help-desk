const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error ?? `API error ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// ── Tickets ────────────────────────────────────────────────────────────────

export interface Ticket {
  id: string;
  title: string;
  description: string;
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  category?: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export const ticketsApi = {
  list: () => apiFetch<Ticket[]>("/tickets"),
  get: (id: string) => apiFetch<Ticket>(`/tickets/${id}`),
  create: (data: Omit<Ticket, "id" | "status" | "createdAt" | "updatedAt">) =>
    apiFetch<Ticket>("/tickets", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Ticket>) =>
    apiFetch<Ticket>(`/tickets/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  delete: (id: string) => apiFetch<void>(`/tickets/${id}`, { method: "DELETE" }),
};

// ── AI ─────────────────────────────────────────────────────────────────────

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export const aiApi = {
  chat: (message: string, history: ChatMessage[]) =>
    apiFetch<{ reply: string }>("/ai/chat", {
      method: "POST",
      body: JSON.stringify({ message, history }),
    }),
  searchKnowledge: (query: string) =>
    apiFetch<{ results: { source: string; text: string; score: number }[] }>(
      "/ai/search-knowledge",
      { method: "POST", body: JSON.stringify({ query }) }
    ),
};

// ── Knowledge Base ──────────────────────────────────────────────────────────

export interface KnowledgeBaseEntry {
  id: string;
  title: string;
  content: string;
  category?: string;
  tags?: string;
  filePath?: string;
  createdAt: string;
  updatedAt: string;
}

export const knowledgeBaseApi = {
  list: (params?: { category?: string; q?: string }) => {
    const qs = new URLSearchParams(params as Record<string, string>).toString();
    return apiFetch<KnowledgeBaseEntry[]>(`/knowledge-base${qs ? `?${qs}` : ""}`);
  },
  get: (id: string) => apiFetch<KnowledgeBaseEntry>(`/knowledge-base/${id}`),
};
