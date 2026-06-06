"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  FaChartLine,
  FaTicketAlt,
  FaBook,
  FaCog,
  FaSignOutAlt,
  FaBars,
  FaTimes,
} from "react-icons/fa";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in and is admin
    const user = localStorage.getItem("user");
    const token = localStorage.getItem("token");

    if (!token || !user) {
      router.push("/login");
      return;
    }

    try {
      const userData = JSON.parse(user);
      if (userData.role !== "admin") {
        router.push("/chat");
        return;
      }
      setIsAuthorized(true);
    } catch (err) {
      router.push("/login");
    } finally {
      setLoading(false);
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-800"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  const navItems = [
    {
      label: "Dashboard",
      href: "/admin",
      icon: FaChartLine,
    },
    {
      label: "Tickets",
      href: "/admin/tickets",
      icon: FaTicketAlt,
    },
    {
      label: "Knowledge Base",
      href: "/admin/knowledge",
      icon: FaBook,
    },
    {
      label: "AI Settings",
      href: "/admin/settings",
      icon: FaCog,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? "w-64" : "w-20"
        } bg-white shadow-lg transition-all duration-300 border-r border-gray-200`}
      >
        {/* Logo Section */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          {sidebarOpen && (
            <img src="/images/epson-logo.svg" alt="Epson" className="h-8" />
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            {sidebarOpen ? <FaTimes size={18} /> : <FaBars size={18} />}
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <a
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 transition text-gray-700 hover:text-gray-900"
              >
                <Icon size={20} />
                {sidebarOpen && (
                  <span className="text-sm font-medium">{item.label}</span>
                )}
              </a>
            );
          })}
        </nav>

        {/* (removed inline sidebar logout) */}
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">{children}</div>

      {/* Fixed logout button (bottom-left) */}
      <div className="fixed bottom-6 left-6 z-50">
        <button
          onClick={handleLogout}
          aria-label="Logout"
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition text-sm font-semibold flex items-center gap-2 shadow-sm hover:shadow-md"
        >
          <FaSignOutAlt size={16} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}
