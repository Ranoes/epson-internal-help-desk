// Mock data for frontend development
// Based on FRONTEND_MOCK_DATA.md reference

export const mockLoginResponse = {
  success: true,
  token: "mock-jwt-token-eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  user: {
    id: "usr_001",
    name: "Budi Santoso",
    role: "admin",
  },
};

export const mockChatResolvedResponse = {
  success: true,
  messageId: "msg_mock_001",
  reply: `Berdasarkan knowledge base kami, untuk masalah garis pada hasil print di printer ET-2400:

1. Buka menu Settings > Maintenance pada printer.
2. Pilih Print Head Cleaning dan jalankan proses standard cleaning (3-5 menit).
3. Cetak nozzle check pattern untuk verifikasi.
4. Jika masih bergaris, jalankan Power Cleaning (gunakan lebih banyak tinta).
5. Jika setelah 3x masih ada garis, lakukan pengecekan fisik printhead.`,
  confidence: 0.87,
  sources: [
    {
      docId: "kb_001",
      title: "Garis Horizontal pada Hasil Print - Printhead Tersumbat",
      relevance: 0.91,
    },
    {
      docId: "kb_023",
      title: "SOP Printhead Cleaning ET-Series",
      relevance: 0.85,
    },
  ],
  escalated: false,
  timestamp: new Date().toISOString(),
};

export const mockChatHistory = {
  success: true,
  sessionId: "sess_mock_abc123",
  messages: [
    {
      messageId: "msg_mock_user_001",
      role: "user",
      content: "Printer ET-2400 hasil print bergaris, bagaimana solusinya?",
      timestamp: new Date(Date.now() - 5 * 60000).toISOString(),
    },
    {
      messageId: "msg_mock_001",
      role: "assistant",
      content:
        "Berdasarkan knowledge base kami, untuk masalah garis pada hasil print...",
      confidence: 0.87,
      timestamp: new Date(Date.now() - 4 * 60000).toISOString(),
    },
  ],
};

export const mockAnalyticsSummary = {
  success: true,
  period: {
    from: "2026-05-01",
    to: "2026-05-08",
  },
  stats: {
    totalMessages: 342,
    resolvedByChatbot: 287,
    escalated: 55,
    resolutionRate: 0.839,
    avgConfidence: 0.81,
    topIssues: [
      {
        category: "quality_printing",
        count: 98,
      },
      {
        category: "hardware_part",
        count: 74,
      },
      {
        category: "firmware_error",
        count: 56,
      },
    ],
  },
};

export const mockTicketsList = {
  success: true,
  data: [
    {
      ticketId: "tkt_mock_001",
      userId: "usr_001",
      userName: "Budi Santoso",
      question: "Printer ET-2400 hasil print bergaris setelah cleaning 3x",
      sessionId: "sess_mock_abc123",
      status: "open",
      assignedTo: null,
      createdAt: new Date(Date.now() - 2 * 60000).toISOString(),
    },
    {
      ticketId: "tkt_mock_002",
      userId: "usr_002",
      userName: "Siti Wahyuni",
      question:
        "Error E-01 pada printer ET-4850, sudah restart tapi tetap error",
      sessionId: "sess_mock_def456",
      status: "in_progress",
      assignedTo: "tech_001",
      createdAt: new Date(Date.now() - 24 * 60 * 60000).toISOString(),
    },
  ],
};
