"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { useState } from "react";
import apiClient from "@/lib/api-client";
import { LoginResponse } from "@/types/api";
import {
  FaUser,
  FaLock,
  FaSignInAlt,
  FaChevronDown,
  FaChevronUp,
} from "react-icons/fa";

export default function LoginPage() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCredentials, setShowCredentials] = useState(false);

  const onSubmit = async (data: any) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.post<LoginResponse>("/auth/login", {
        username: data.username,
        password: data.password,
      });

      if (response.data.success) {
        // Store token and user
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("user", JSON.stringify(response.data.user));

        // Redirect based on role
        const role = response.data.user?.role;
        if (role === "admin") {
          router.push("/admin");
        } else {
          router.push("/chat");
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "Login failed. Please try again.");
    } finally {
      setIsLoading(false);
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
            <p className="text-gray-600 font-lato">
              Smart Chatbot for Technical Support
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Username Field */}
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2"
              >
                <FaUser className="text-indigo-600" size={16} />
                Username
              </label>
              <input
                id="username"
                type="text"
                placeholder="e.g., karyawan001"
                {...register("username", { required: "Username is required" })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
              />
              {errors.username && (
                <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                  <span>⚠️</span> {String(errors.username.message)}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2"
              >
                <FaLock className="text-indigo-600" size={16} />
                Password
              </label>
              <input
                id="password"
                type="password"
                placeholder="Enter your password"
                {...register("password", { required: "Password is required" })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
              />
              {errors.password && (
                <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                  <span>⚠️</span> {String(errors.password.message)}
                </p>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-300 text-red-700 rounded-lg flex items-start gap-3">
                <span className="text-lg">⚠️</span>
                <div>
                  <p className="font-semibold">Login Failed</p>
                  <p className="text-sm">{error}</p>
                </div>
              </div>
            )}

            {/* Login Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-gray-800 text-white font-semibold rounded-xl hover:bg-gray-900 disabled:bg-gray-300 transition flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
            >
              <FaSignInAlt size={18} />
              {isLoading ? "Logging in..." : "Login"}
            </button>
          </form>

          {/* Demo Credentials */}
          <div className="mt-6 bg-blue-50 rounded-lg border border-blue-300 overflow-hidden">
            <button
              type="button"
              onClick={() => setShowCredentials(!showCredentials)}
              className="w-full px-4 py-3 flex items-center justify-between text-blue-800 hover:bg-blue-100 transition"
            >
              <span className="text-xs font-semibold">📝 Demo Credentials</span>
              {showCredentials ? (
                <FaChevronUp size={14} />
              ) : (
                <FaChevronDown size={14} />
              )}
            </button>
            {showCredentials && (
              <div className="px-4 pb-3 bg-white border-t border-blue-300 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="mb-3">
                  <p className="text-xs text-blue-800 font-semibold mb-1">
                    User
                  </p>
                  <p className="text-xs text-blue-700 mb-1">
                    <strong>Username:</strong>{" "}
                    <code className="bg-blue-100 px-2 py-1 rounded">
                      karyawan001
                    </code>
                  </p>
                  <p className="text-xs text-blue-700 mb-2">
                    <strong>Password:</strong>{" "}
                    <code className="bg-blue-100 px-2 py-1 rounded">
                      password123
                    </code>
                  </p>
                </div>

                <div className="mb-3">
                  <p className="text-xs text-blue-800 font-semibold mb-1">
                    Admin
                  </p>
                  <p className="text-xs text-blue-700 mb-1">
                    <strong>Username:</strong>{" "}
                    <code className="bg-blue-100 px-2 py-1 rounded">
                      admin001
                    </code>
                  </p>
                  <p className="text-xs text-blue-700 mb-2">
                    <strong>Password:</strong>{" "}
                    <code className="bg-blue-100 px-2 py-1 rounded">
                      adminpass123
                    </code>
                  </p>
                </div>

                <p className="text-xs text-blue-600">
                  (Using mock API for development)
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
