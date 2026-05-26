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
} from "react-icons/fa";
import apiClient from "@/lib/api-client";

interface DashboardStats {
  totalTickets: number;
  activeTickets: number;
  resolvedTickets: number;
  totalUsers: number;
  knowledgeBaseArticles: number;
  averageResolutionTime: string;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        console.log("Fetching analytics from /analytics/summary...");
        const response = await apiClient.get("/analytics/summary");
        console.log("Analytics response:", response.data);

        if (response.data && response.data.success) {
          setStats({
            totalTickets: response.data.totalTickets ?? 0,
            activeTickets: response.data.activeTickets ?? 0,
            resolvedTickets: response.data.resolvedTickets ?? 0,
            totalUsers: response.data.totalUsers ?? 0,
            knowledgeBaseArticles: response.data.knowledgeBaseArticles ?? 0,
            averageResolutionTime: response.data.averageResolutionTime || "N/A",
          });
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
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon size={24} className="text-white" />
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
          color="bg-blue-500"
          trend="+12% from last month"
        />
        <StatCard
          label="Active Tickets"
          value={stats?.activeTickets || 0}
          icon={FaClipboardList}
          color="bg-orange-500"
          trend="-5% from last week"
        />
        <StatCard
          label="Resolved Tickets"
          value={stats?.resolvedTickets || 0}
          icon={FaCheckCircle}
          color="bg-green-500"
          trend="+8% from last month"
        />
        <StatCard
          label="Total Users"
          value={stats?.totalUsers || 0}
          icon={FaUsers}
          color="bg-purple-500"
          trend="+3 new users"
        />
        <StatCard
          label="Knowledge Base"
          value={stats?.knowledgeBaseArticles || 0}
          icon={FaBook}
          color="bg-indigo-500"
          trend="+4 new articles"
        />
        <StatCard
          label="Avg Resolution Time"
          value={stats?.averageResolutionTime || "N/A"}
          icon={FaChartLine}
          color="bg-gray-700"
          trend="Optimized"
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
            <FaTicketAlt size={32} className="text-blue-600 mx-auto mb-2" />
            <p className="font-semibold text-gray-900">Manage Tickets</p>
            <p className="text-xs text-gray-600 mt-1">
              View and resolve tickets
            </p>
          </a>
          <a
            href="/admin/knowledge"
            className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg hover:shadow-md transition border border-green-200 text-center"
          >
            <FaBook size={32} className="text-green-600 mx-auto mb-2" />
            <p className="font-semibold text-gray-900">Knowledge Base</p>
            <p className="text-xs text-gray-600 mt-1">
              Manage articles and content
            </p>
          </a>
          <a
            href="/admin"
            className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg hover:shadow-md transition border border-purple-200 text-center"
          >
            <FaChartLine size={32} className="text-purple-600 mx-auto mb-2" />
            <p className="font-semibold text-gray-900">Analytics</p>
            <p className="text-xs text-gray-600 mt-1">View detailed reports</p>
          </a>
        </div>
      </div>
    </div>
  );
}
