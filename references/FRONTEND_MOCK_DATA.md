# Frontend Mock Data Setup

Use this file to populate your frontend with realistic dummy data while the backend is in development.

## How to Use

1. Copy mock responses into `src/lib/mockData.ts`.
2. Create a mock HTTP client wrapper in `src/lib/api-client.ts` that returns mock data with configurable delay.
3. Switch between mock and real API via environment variable: `NEXT_PUBLIC_USE_MOCK_API=true`.
4. Once backend is ready, flip `NEXT_PUBLIC_USE_MOCK_API=false` to switch to real endpoints.

## Mock Data (TypeScript/JSON)

### Login Response (Mock)

```json
{
  "success": true,
  "token": "mock-jwt-token-eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "usr_001",
    "name": "Budi Santoso",
    "role": "user"
  }
}
```

Admin login:

```json
{
  "success": true,
  "token": "mock-jwt-admin-token...",
  "user": {
    "id": "usr_admin_001",
    "name": "Admin Epson",
    "role": "admin"
  }
}
```

### Chat Message Responses (Resolved)

```json
{
  "success": true,
  "messageId": "msg_mock_001",
  "reply": "Berdasarkan knowledge base kami, untuk masalah garis pada hasil print di printer ET-2400:\n\n1. Buka menu Settings > Maintenance pada printer.\n2. Pilih Print Head Cleaning dan jalankan proses standard cleaning (3-5 menit).\n3. Cetak nozzle check pattern untuk verifikasi.\n4. Jika masih bergaris, jalankan Power Cleaning (gunakan lebih banyak tinta).\n5. Jika setelah 3x masih ada garis, lakukan pengecekan fisik printhead.",
  "confidence": 0.87,
  "sources": [
    {
      "docId": "kb_001",
      "title": "Garis Horizontal pada Hasil Print - Printhead Tersumbat",
      "relevance": 0.91
    },
    {
      "docId": "kb_023",
      "title": "SOP Printhead Cleaning ET-Series",
      "relevance": 0.85
    }
  ],
  "escalated": false,
  "timestamp": "2026-05-07T10:30:00Z"
}
```

### Chat Message Responses (Escalated)

```json
{
  "success": true,
  "messageId": "msg_mock_002",
  "reply": "Maaf, saya tidak menemukan solusi untuk masalah ini di knowledge base kami. Tiket support telah dibuat dan akan ditangani oleh tim IT Support kami. Silakan pantau status tiket Anda di dashboard atau hubungi helpdesk untuk informasi lebih lanjut.",
  "confidence": 0.12,
  "sources": [],
  "escalated": true,
  "ticketId": "tkt_mock_001",
  "timestamp": "2026-05-07T10:35:00Z"
}
```

### Chat History

```json
{
  "success": true,
  "sessionId": "sess_mock_abc123",
  "messages": [
    {
      "messageId": "msg_mock_user_001",
      "role": "user",
      "content": "Printer ET-2400 hasil print bergaris, bagaimana solusinya?",
      "timestamp": "2026-05-07T10:29:00Z"
    },
    {
      "messageId": "msg_mock_001",
      "role": "assistant",
      "content": "Berdasarkan knowledge base kami, untuk masalah garis pada hasil print...",
      "confidence": 0.87,
      "timestamp": "2026-05-07T10:30:00Z"
    },
    {
      "messageId": "msg_mock_user_002",
      "role": "user",
      "content": "Sudah dicoba tapi masih bergaris setelah cleaning 3x",
      "timestamp": "2026-05-07T10:33:00Z"
    },
    {
      "messageId": "msg_mock_002",
      "role": "assistant",
      "content": "Maaf, saya tidak menemukan solusi untuk masalah ini...",
      "confidence": 0.12,
      "timestamp": "2026-05-07T10:35:00Z"
    }
  ]
}
```

### Analytics Summary (Mock)

```json
{
  "success": true,
  "period": {
    "from": "2026-05-01",
    "to": "2026-05-07"
  },
  "stats": {
    "totalMessages": 342,
    "resolvedByChatbot": 287,
    "escalated": 55,
    "resolutionRate": 0.839,
    "avgConfidence": 0.81,
    "topIssues": [
      {
        "category": "quality_printing",
        "count": 98
      },
      {
        "category": "hardware_part",
        "count": 74
      },
      {
        "category": "firmware_error",
        "count": 56
      }
    ]
  }
}
```

### Tickets List (Mock)

```json
{
  "success": true,
  "data": [
    {
      "ticketId": "tkt_mock_001",
      "userId": "usr_001",
      "userName": "Budi Santoso",
      "question": "Printer ET-2400 hasil print bergaris setelah cleaning 3x",
      "sessionId": "sess_mock_abc123",
      "status": "open",
      "assignedTo": null,
      "createdAt": "2026-05-07T10:35:00Z"
    },
    {
      "ticketId": "tkt_mock_002",
      "userId": "usr_002",
      "userName": "Siti Wahyuni",
      "question": "Error E-01 pada printer ET-4850, sudah restart tapi tetap error",
      "sessionId": "sess_mock_def456",
      "status": "in_progress",
      "assignedTo": "tech_001",
      "createdAt": "2026-05-06T14:20:00Z"
    }
  ]
}
```

### Knowledge Base Entries (Mock)

```json
{
  "success": true,
  "total": 35,
  "page": 1,
  "limit": 20,
  "data": [
    {
      "id": "kb_001",
      "title": "Garis Horizontal pada Hasil Print - Printhead Tersumbat",
      "category": "quality_printing",
      "subcategory": "print_defect",
      "tags": ["garis", "horizontal", "printhead", "ET-2400"],
      "createdAt": "2026-01-15T00:00:00Z",
      "updatedAt": "2026-04-01T00:00:00Z"
    },
    {
      "id": "kb_002",
      "title": "Error Firmware E-01 - Paper Feed Problem",
      "category": "firmware",
      "subcategory": "error_codes",
      "tags": ["E-01", "error", "paper_feed", "firmware"],
      "createdAt": "2026-02-10T00:00:00Z",
      "updatedAt": "2026-04-15T00:00:00Z"
    },
    {
      "id": "kb_003",
      "title": "Warna Print Tidak Akurat / Color Shift",
      "category": "quality_printing",
      "subcategory": "color_accuracy",
      "tags": ["warna", "color", "shift", "accuracy", "ICC"],
      "createdAt": "2026-01-20T00:00:00Z",
      "updatedAt": "2026-03-28T00:00:00Z"
    }
  ]
}
```

## Mock API Client Wrapper (Template)

```ts
// src/lib/api-client.ts
import axios, { AxiosInstance } from "axios";
import * as mockData from "./mockData";

const MOCK_DELAY_MS = 800; // Simulate network latency
const USE_MOCK_API = process.env.NEXT_PUBLIC_USE_MOCK_API === "true";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Mock interceptor
if (USE_MOCK_API) {
  apiClient.interceptors.request.use(async (config) => {
    await delay(MOCK_DELAY_MS);

    // Route to mock responses
    if (config.url === "/auth/login" && config.method === "post") {
      return {
        ...config,
        adapter: () =>
          Promise.resolve({
            data: mockData.mockLoginResponse,
            status: 200,
            statusText: "OK",
            headers: {},
            config,
          }),
      };
    }
    if (config.url?.includes("/chat/message") && config.method === "post") {
      return {
        ...config,
        adapter: () =>
          Promise.resolve({
            data: mockData.mockChatResolvedResponse,
            status: 200,
            statusText: "OK",
            headers: {},
            config,
          }),
      };
    }
    if (config.url?.includes("/chat/history") && config.method === "get") {
      return {
        ...config,
        adapter: () =>
          Promise.resolve({
            data: mockData.mockChatHistory,
            status: 200,
            statusText: "OK",
            headers: {},
            config,
          }),
      };
    }

    return config;
  });
}

export default apiClient;
```

## .env.local Configuration

```
# Use mock API during frontend development
NEXT_PUBLIC_USE_MOCK_API=true
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001/api
```

Once backend is ready:

```
NEXT_PUBLIC_USE_MOCK_API=false
NEXT_PUBLIC_API_BASE_URL=http://internal-server:3001/api
```

## Advantages of This Approach

1. Frontend development continues independently.
2. Easy to switch between mock and real API with one env var.
3. Realistic delay simulation helps identify UI responsiveness issues early.
4. Mock data stays in version control as reference.
5. No backend dependency for component testing and styling.
