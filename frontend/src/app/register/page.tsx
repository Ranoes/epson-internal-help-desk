"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import apiClient from "@/lib/api-client";
import { FaUser, FaLock, FaSignInAlt } from "react-icons/fa";

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    name: "",
    department: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await apiClient.post("/auth/register", formData);
      router.push("/login?registered=true");
    } catch (err: any) {
      setError(err.response?.data?.error || "Registration failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-lg p-8 border border-gray-200">
          {/* Logo and Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <img src="/images/epson-logo.svg" alt="Epson" className="h-16" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2 font-playfair">
              Epson Helpdesk
            </h1>
            <p className="text-gray-600 font-lato">Create your account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <FaUser className="text-indigo-600" size={16} /> Full Name
              </label>
              <input
                type="text"
                placeholder="Full Name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <FaUser className="text-indigo-600" size={16} /> Username
              </label>
              <input
                type="text"
                placeholder="e.g., karyawan001"
                value={formData.username}
                onChange={(e) =>
                  setFormData({ ...formData, username: e.target.value })
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <FaUser className="text-indigo-600" size={16} /> Department
                (Optional)
              </label>
              <input
                type="text"
                placeholder="Department"
                value={formData.department}
                onChange={(e) =>
                  setFormData({ ...formData, department: e.target.value })
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <FaLock className="text-indigo-600" size={16} /> Password
              </label>
              <input
                type="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
              />
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-300 text-red-700 rounded-lg flex items-start gap-3">
                <span className="text-lg">⚠️</span>
                <div>
                  <p className="font-semibold">Registration Failed</p>
                  <p className="text-sm">{error}</p>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gray-800 text-white font-semibold rounded-xl hover:bg-gray-900 disabled:bg-gray-300 transition flex items-center justify-center gap-2"
            >
              <FaSignInAlt size={18} />{" "}
              {loading ? "Registering..." : "Register"}
            </button>
          </form>

          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600 font-lato">
              Already have an account?{" "}
              <Link
                href="/login"
                className="text-indigo-600 hover:text-indigo-500 font-semibold"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
