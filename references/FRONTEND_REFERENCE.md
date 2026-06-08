# Frontend Reference for Smart Helpdesk Chatbot

This document synthesizes all PDF references in the `references` folder:

- API JSON.pdf
- IMPLEMENTASI.pdf
- JOB.pdf
- LAPORAN LEMBAR KERJA 2_Tim 10 Topik A5.pdf
- Overview Stack.pdf

Goal: provide a practical frontend guide that stays aligned with backend contract, AI flow, and stakeholder requirements.

## 1) Product Context and Constraints

- Product: Smart Helpdesk Chatbot for PT Indonesia Epson Industry.
- Primary users: internal employees only (not public users).
- Platform: internal web app on company intranet.
- Core problem: repetitive technical issues, manual reporting, slow knowledge retrieval.
- Data policy: use synthetic knowledge base data; keep data processing on internal infrastructure.
- Browser target: Chrome and Edge on desktop/laptop.

Stack context from Overview Stack:

- Frontend: Next.js (React) on internal network.
- Backend: Express.js/Fastify (Node.js) via REST JSON.
- Data: PostgreSQL (+ Prisma), vector DB (ChromaDB or pgvector).
- AI strategy: hybrid-capable router (`ollama-local`, external API, fallback to local).
- Optional components: n8n and Clawbot are optional, not mandatory for MVP.

## 2) Frontend Scope (Your Responsibility)

From project role documents, frontend scope includes:

1. Login page.
2. Chat interface (WhatsApp Web-like workflow).
3. Conversation history.
4. Admin dashboard (analytics + tickets).
5. Knowledge base management UI.
6. UX polish: loading states, error states, toasts, empty states, responsive behavior.

## 3) Required Screens and Route Map

Recommended route map:

- `/login`
- `/chat`
- `/chat/[sessionId]` (optional explicit session route)
- `/admin` (analytics summary)
- `/admin/tickets`
- `/admin/knowledge`

Role access:

- `user`: login + chat + own history.
- `admin`: all routes including knowledge and tickets.
- `manager`: analytics and tickets (optionally read-only KB).

## 4) API Contract (Frontend-Critical)

Base URL:

- `http://[internal-server]:3001/api`

### 4.1 Auth

- `POST /api/auth/login`

Request:

```json
{
  "username": "karyawan001",
  "password": "password123"
}
```

Success response:

```json
{
  "success": true,
  "token": "jwt-token",
  "user": {
    "id": "usr_001",
    "name": "Budi Santoso",
    "role": "user"
  }
}
```

### 4.2 Chat Send Message

- `POST /api/chat/message`

Compatibility note:

- Overview Stack mentions `POST /api/chat` as flow shorthand.
- API JSON contract specifies `POST /api/chat/message`.
- Frontend should treat `POST /api/chat/message` as source of truth unless backend team formally changes the contract.

Request:

```json
{
  "sessionId": "sess_abc123",
  "userId": "usr_001",
  "message": "Printer ET-2400 hasil print bergaris",
  "imageBase64": null
}
```

Success response (resolved):

```json
{
  "success": true,
  "messageId": "msg_xyz789",
  "reply": "Langkah troubleshooting...",
  "confidence": 0.87,
  "sources": [
    {
      "docId": "kb_023",
      "title": "SOP Printhead Cleaning ET-Series",
      "relevance": 0.91
    }
  ],
  "escalated": false,
  "timestamp": "2026-05-06T08:30:00Z"
}
```

Escalation response (not resolved by bot):

```json
{
  "success": true,
  "messageId": "msg_xyz790",
  "reply": "Maaf, saya tidak menemukan solusi... tiket telah dibuat.",
  "confidence": 0.12,
  "sources": [],
  "escalated": true,
  "ticketId": "tkt_00045",
  "timestamp": "2026-05-06T08:31:00Z"
}
```

### 4.3 Chat History

- `GET /api/chat/history/:sessionId`

### 4.4 Knowledge Base

- `GET /api/knowledge?page=1&limit=20&category=hardware&search=printhead`
- `POST /api/knowledge` (admin only)
- Documents mention CRUD responsibility for KB management UI.

### 4.5 Tickets

- `GET /api/tickets?status=open&page=1&limit=20`
- Documents mention ticket create/update status flow in backend.

### 4.6 Analytics

- `GET /api/analytics/summary?from=YYYY-MM-DD&to=YYYY-MM-DD`

## 5) Frontend Data Types (TypeScript Starter)

```ts
export type UserRole = "user" | "admin" | "manager";

export interface AuthUser {
  id: string;
  name: string;
  role: UserRole;
}

export interface LoginResponse {
  success: boolean;
  token: string;
  user: AuthUser;
}

export interface ChatSource {
  docId: string;
  title: string;
  relevance: number;
}

export interface ChatReply {
  success: boolean;
  messageId: string;
  reply: string;
  confidence: number;
  sources: ChatSource[];
  escalated: boolean;
  ticketId?: string;
  timestamp: string;
}

export interface HistoryMessage {
  messageId: string;
  role: "user" | "assistant";
  content: string;
  confidence?: number;
  timestamp: string;
}

export interface Ticket {
  ticketId: string;
  userId: string;
  userName: string;
  question: string;
  sessionId: string;
  status: "open" | "in_progress" | "resolved";
  assignedTo: string | null;
  createdAt: string;
}
```

## 6) Core UX Behavior Rules

1. Chat send flow:
   - Append user bubble immediately (optimistic display).
   - Show typing indicator while waiting backend.
   - Render assistant reply bubble.
   - If `escalated=true`, show ticket badge and ticket ID callout.
2. Confidence display:
   - Show lightweight confidence chip (for admin/manager or optional user view).
3. Sources panel:
   - Show KB sources when available (`sources.length > 0`).
4. Error handling:
   - API/network error -> inline retry + toast.
   - Timeout scenario -> explicit message, do not silently fail.
5. Empty states:
   - No history, no tickets, no knowledge rows should have informative empty state.
6. Access guard:
   - Block unauthorized routes by role.

## 7) Suggested Component Breakdown

Chat area:

- `ChatWindow`
- `MessageList`
- `MessageBubbleUser`
- `MessageBubbleAssistant`
- `InputBar` (text + image upload)
- `TypingIndicator`
- `SourcesPanel`

Admin area:

- `AnalyticsCards`
- `TopIssuesChart`
- `TicketsTable`
- `KnowledgeTable`
- `KnowledgeFormModal`

Shared:

- `AuthGuard`
- `RoleGuard`
- `ToastProvider`
- `ConfirmDialog`
- `ErrorBoundary`

## 8) Non-Functional Targets You Must Respect

From requirement documents:

- Response target: ideally < 3s (acceptable up to 5s in LLM scenarios per implementation note).
- Accuracy target: >= 80% (system-level metric, reflected via UX transparency and source display).
- Concurrent usage: around 50 users.
- Uptime expectation: high reliability (target 99% referenced in requirements).
- Logging: preserve conversation history and activity trail.

Frontend implication:

- Use request cancellation and stable loading states.
- Avoid blocking the main thread with heavy client processing.
- Keep UI deterministic in unstable network conditions.

## 9) Frontend Architecture Recommendation (Next.js)

The project folders are currently placeholders, so use this baseline:

```text
frontend/
  src/
    app/
      login/
      chat/
      admin/
        tickets/
        knowledge/
    components/
      chat/
      admin/
      shared/
    features/
      auth/
      chat/
      tickets/
      knowledge/
      analytics/
    lib/
      api-client.ts
      auth.ts
      role-guard.ts
    types/
      api.ts
```

State and networking:

- Data fetching: React Query or SWR.
- Form handling: React Hook Form.
- App state: Zustand or Context.
- HTTP client: Axios or fetch wrapper.

## 10) Integration Dependencies (Cross-Team Alignment)

1. Backend must expose stable endpoint shapes from API contract.
2. AI engine returns `confidence`, `sources`, `escalated`, optional `ticketId`.
3. KB data is synthetic but structurally realistic; frontend should not assume fixed categories beyond API values.
4. If backend uses JWT bearer token, frontend should centralize token injection and role parsing.
5. Confirm chat endpoint naming early (`/api/chat/message` vs `/api/chat`) to avoid integration blockers.

## 11) Immediate Frontend MVP Order

1. Build auth flow (`/login`) and session persistence.
2. Build chat page with send/history and escalation UI.
3. Add admin analytics summary and tickets table.
4. Add KB management table + CRUD modal flow.
5. Polish UX states and role guards.

Routing rollout recommendation from Overview Stack:

- Phase 1 (MVP): assume mostly local model behavior and standard text chat flow.
- Phase 2: enable hybrid routing behaviors (complex query routing, image-driven external multimodal engine) without changing core chat UI contract.

## 12) Definition of Done for Frontend

- User can login and start chat from browser (Chrome/Edge).
- Chat supports text and optional imageBase64 upload field.
- Escalated reply clearly indicates ticket creation.
- Admin can view analytics and tickets.
- Admin can manage knowledge entries from UI.
- Error, loading, and empty states are handled consistently.
- Route protection by role works correctly.
