// API types aligned with backend contract and references

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
  ticketSuggested?: boolean;
  ticketSuggestion?: string | null;
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

export interface ChatHistory {
  success: boolean;
  sessionId: string;
  messages: HistoryMessage[];
}

export interface Ticket {
  ticketId: string;
  userId: string;
  userName: string;
  question: string;
  sessionId: string;
  status: "open" | "in_progress" | "resolved";
  assignedTo: string | null;
  resolution?: string | null;
  createdAt: string;
}

export interface TicketsResponse {
  success: boolean;
  data: Ticket[];
}

export interface AnalyticsSummary {
  success: boolean;
  period: {
    from: string;
    to: string;
  };
  ticketGrowthPercent?: number;
  stats: {
    totalMessages: number;
    resolvedByChatbot: number;
    escalated: number;
    resolutionRate: number;
    avgConfidence: number;
    topIssues: Array<{
      category: string;
      count: number;
    }>;
  };
}
