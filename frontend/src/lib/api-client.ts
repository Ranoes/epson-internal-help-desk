import axios from "axios";
import * as mockData from "./mockData";

const USE_MOCK_API = process.env.NEXT_PUBLIC_USE_MOCK_API === "true";
const MOCK_DELAY_MS = 800;

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const apiClient = axios.create({
  // Use Caddy single entry point. All backend calls stay relative to current origin.
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || "/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Add authorization token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Mock interceptor for development
if (USE_MOCK_API) {
  apiClient.interceptors.request.use(async (config) => {
    // Simulate network delay
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

    if (config.url === "/analytics/summary" && config.method === "get") {
      return {
        ...config,
        adapter: () =>
          Promise.resolve({
            data: mockData.mockAnalyticsSummary,
            status: 200,
            statusText: "OK",
            headers: {},
            config,
          }),
      };
    }

    if (config.url?.includes("/tickets") && config.method === "get") {
      return {
        ...config,
        adapter: () =>
          Promise.resolve({
            data: mockData.mockTicketsList,
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
