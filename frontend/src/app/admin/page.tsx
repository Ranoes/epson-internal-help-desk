"use client";

import { useEffect, useState } from "react";
import {
  FaTicketAlt,
  FaUsers,
  FaBook,
  FaChartLine,
  FaArrowUp,
  FaClipboardList,
  FaCheckCircle,
  FaRobot,
  FaCog,
} from "react-icons/fa";
import apiClient from "@/lib/api-client";

interface DashboardStats {
  totalTickets: number;
  activeTickets: number;
  resolvedTickets: number;
  totalUsers: number;
  knowledgeBaseArticles: number;
  averageResolutionTime: string;
  ticketGrowthPercent?: number;
}

interface AiSettings {
  aiProvider: "ollama" | "openrouter";
  updatedAt?: string | null;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [aiSettings, setAiSettings] = useState<AiSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const formatGrowth = (value?: number) => {
    if (value === undefined || Number.isNaN(value)) {
      return null;
    }

    const sign = value > 0 ? "+" : "";
    return `${sign}${value}% from last month`;
  };

  useEffect(() => {
    const fetchStats = async () => {
      try {
        console.log("Fetching analytics from /analytics/summary...");
        const [analyticsResponse, settingsResponse] = await Promise.all([
          apiClient.get("/analytics/summary"),
          apiClient.get("/admin/settings/ai"),
        ]);

        if (analyticsResponse.data && analyticsResponse.data.success) {
          setStats({
            totalTickets: analyticsResponse.data.totalTickets ?? 0,
            activeTickets: analyticsResponse.data.activeTickets ?? 0,
            resolvedTickets: analyticsResponse.data.resolvedTickets ?? 0,
            totalUsers: analyticsResponse.data.totalUsers ?? 0,
            knowledgeBaseArticles:
              analyticsResponse.data.knowledgeBaseArticles ?? 0,
            averageResolutionTime:
              analyticsResponse.data.averageResolutionTime || "N/A",
            ticketGrowthPercent: analyticsResponse.data.ticketGrowthPercent,
          });
        }
        if (settingsResponse.data?.success) {
          setAiSettings(settingsResponse.data.settings);
        }
      } catch (err: any) {
        console.error("Failed to fetch analytics:", err);
        if (err.response?.status === 401 || err.response?.status === 403) {
          console.warn("Auth error - admin access required");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const StatCard = ({
    label,
    value,
    icon: Icon,
    color,
    trend,
  }: {
    label: string;
    value: string | number;
    icon: React.ComponentType<any>;
    color: string;
    trend?: string;
  }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-600 font-medium">{label}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
          {trend && (
            <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
              <FaArrowUp size={12} /> {trend}
            </p>
          )}
        </div>
        <div
          className={`w-12 h-12 flex items-center justify-center rounded-lg ${color}`}
        >
          <Icon size={20} className="text-white" color="#ffffff" />
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-800"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 font-playfair">
          Admin Dashboard
        </h1>
        <p className="text-gray-600 mt-2 font-lato">
          Overview of helpdesk operations and analytics
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <StatCard
          label="Total Tickets"
          value={stats?.totalTickets || 0}
          icon={FaTicketAlt}
          color="bg-gray-700"
          trend={formatGrowth(stats?.ticketGrowthPercent) ?? undefined}
        />
        <StatCard
          label="Active Tickets"
          value={stats?.activeTickets || 0}
          icon={FaClipboardList}
          color="bg-gray-700"
        />
        <StatCard
          label="Resolved Tickets"
          value={stats?.resolvedTickets || 0}
          icon={FaCheckCircle}
          color="bg-gray-700"
        />
        <StatCard
          label="Total Users"
          value={stats?.totalUsers || 0}
          icon={FaUsers}
          color="bg-gray-700"
        />
        <StatCard
          label="Knowledge Base"
          value={stats?.knowledgeBaseArticles || 0}
          icon={FaBook}
          color="bg-gray-700"
        />
        <StatCard
          label="AI Provider"
          value={
            aiSettings?.aiProvider === "openrouter" ? "OpenRouter" : "Ollama"
          }
          icon={FaRobot}
          color={
            aiSettings?.aiProvider === "openrouter"
              ? "bg-emerald-500"
              : "bg-slate-700"
          }
          trend={
            aiSettings?.updatedAt
              ? `Updated ${new Date(aiSettings.updatedAt).toLocaleString()}`
              : "Not configured"
          }
        />
        <StatCard
          label="Avg Resolution Time"
          value={stats?.averageResolutionTime || "N/A"}
          icon={FaChartLine}
          color="bg-gray-700"
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4 font-playfair">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a
            href="/admin/tickets"
            className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg hover:shadow-md transition border border-blue-200 text-center"
          >
            <div className="p-3 rounded-lg bg-blue-500 mx-auto mb-2 inline-flex items-center justify-center">
              <FaTicketAlt size={20} className="text-white" />
            </div>
            <p className="font-semibold text-gray-900">Manage Tickets</p>
            <p className="text-xs text-gray-600 mt-1">
              View and resolve tickets
            </p>
          </a>
          <a
            href="/admin/knowledge"
            className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg hover:shadow-md transition border border-green-200 text-center"
          >
            <div className="p-3 rounded-lg bg-green-500 mx-auto mb-2 inline-flex items-center justify-center">
              <FaBook size={20} className="text-white" />
            </div>
            <p className="font-semibold text-gray-900">Knowledge Base</p>
            <p className="text-xs text-gray-600 mt-1">
              Manage articles and content
            </p>
          </a>
          <a
            href="/admin/settings"
            className="p-4 bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg hover:shadow-md transition border border-slate-200 text-center"
          >
            <div className="p-3 rounded-lg bg-slate-700 mx-auto mb-2 inline-flex items-center justify-center">
              <FaCog size={20} className="text-white" />
            </div>
            <p className="font-semibold text-gray-900">AI Settings</p>
            <p className="text-xs text-gray-600 mt-1">
              Switch Ollama or OpenRouter
            </p>
          </a>
        </div>
      </div>
    </div>
  );
}
