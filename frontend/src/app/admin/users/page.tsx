"use client";

import { useEffect, useState } from "react";
import {
  FaUsers,
  FaSearch,
  FaEye,
  FaTrash,
  FaClock,
  FaCheckCircle,
} from "react-icons/fa";
import apiClient from "@/lib/api-client";

interface User {
  id: string;
  fullname: string;
  username: string;
  email: string;
  department: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

interface UserWithTickets extends User {
  ongoingTickets: number;
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserWithTickets[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [selectedUser, setSelectedUser] = useState<UserWithTickets | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [departments, setDepartments] = useState<string[]>([]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await apiClient.get("/admin/users");
        if (response.data?.success && response.data?.users) {
          const usersWithTickets: UserWithTickets[] = response.data.users.map(
            (user: User) => ({
              ...user,
              ongoingTickets: Math.floor(Math.random() * 3), // Mock data, replace with actual from API
            })
          );
          setUsers(usersWithTickets);

          // Extract unique departments
          const uniqueDepts = [
            ...new Set(usersWithTickets.map((u) => u.department)),
          ] as string[];
          setDepartments(uniqueDepts.filter(Boolean));
        }
      } catch (err) {
        console.error("Failed to fetch users:", err);
        // Mock data for development
        setUsers([
          {
            id: "user001",
            fullname: "Andi Wijaya",
            username: "andi.wijaya",
            email: "andi@epson.com",
            department: "IT Support",
            role: "user",
            createdAt: "2026-01-15T10:30:00",
            updatedAt: "2026-06-10T14:22:00",
            ongoingTickets: 2,
          },
          {
            id: "user002",
            fullname: "Siti Rahayu",
            username: "siti.rahayu",
            email: "siti@epson.com",
            department: "HR",
            role: "user",
            createdAt: "2026-02-20T09:15:00",
            updatedAt: "2026-06-09T11:45:00",
            ongoingTickets: 1,
          },
          {
            id: "user003",
            fullname: "Dewi Kusuma",
            username: "dewi.kusuma",
            email: "dewi@epson.com",
            department: "Finance",
            role: "user",
            createdAt: "2026-03-10T13:20:00",
            updatedAt: "2026-06-11T08:30:00",
            ongoingTickets: 0,
          },
          {
            id: "user004",
            fullname: "Budi Santoso",
            username: "budi.santoso",
            email: "budi@epson.com",
            department: "Operations",
            role: "user",
            createdAt: "2026-01-25T10:00:00",
            updatedAt: "2026-06-10T16:15:00",
            ongoingTickets: 3,
          },
          {
            id: "user005",
            fullname: "Lina Marlina",
            username: "lina.marlina",
            email: "lina@epson.com",
            department: "IT Support",
            role: "user",
            createdAt: "2026-04-05T14:30:00",
            updatedAt: "2026-06-08T12:00:00",
            ongoingTickets: 1,
          },
          {
            id: "user006",
            fullname: "Ahmad Hidayat",
            username: "ahmad.hidayat",
            email: "ahmad@epson.com",
            department: "Marketing",
            role: "user",
            createdAt: "2026-05-12T11:45:00",
            updatedAt: "2026-06-11T09:20:00",
            ongoingTickets: 0,
          },
        ]);
        setDepartments(["IT Support", "HR", "Finance", "Operations", "Marketing"]);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.fullname.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDepartment =
      departmentFilter === "all" || user.department === departmentFilter;

    return matchesSearch && matchesDepartment;
  });

  const openUserModal = (user: UserWithTickets) => {
    setSelectedUser(user);
    setShowModal(true);
  };

  const deleteUser = async (userId: string) => {
    const confirmed = window.confirm("Delete this user?");
    if (!confirmed) return;

    try {
      const response = await apiClient.delete(`/admin/users/${userId}`);
      if (response.data?.success) {
        setUsers((current) => current.filter((user) => user.id !== userId));
      }
    } catch (error) {
      console.error("Failed to delete user:", error);
      alert("Failed to delete user");
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-800"></div>
          <p className="mt-4 text-gray-600">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 font-playfair">
            User Management
          </h1>
          <p className="text-gray-600 mt-2 font-lato">
            {filteredUsers.length} users
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <FaSearch
              className="absolute left-3 top-3 text-gray-400"
              size={16}
            />
            <input
              type="text"
              placeholder="Search by name, username, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800 outline-none"
            />
          </div>

          {/* Department Filter */}
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800 outline-none"
          >
            <option value="all">All Departments</option>
            {departments.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {filteredUsers.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <FaUsers size={48} className="mx-auto mb-4 text-gray-300" />
            <p>No users found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">
                    Full Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">
                    Username
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">
                    Department
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">
                    Ongoing Tickets
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-gray-200 hover:bg-gray-50 transition"
                  >
                    <td className="px-6 py-4">
                      <p className="text-sm font-semibold text-gray-900">
                        {user.fullname}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-600">{user.username}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                        {user.department}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-600">{user.email}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {user.ongoingTickets > 0 ? (
                          <>
                            <FaClock size={14} className="text-orange-500" />
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-800">
                              {user.ongoingTickets}
                            </span>
                          </>
                        ) : (
                          <>
                            <FaCheckCircle size={14} className="text-green-500" />
                            <span className="text-xs text-green-600 font-semibold">
                              None
                            </span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openUserModal(user)}
                          className="p-2 hover:bg-blue-100 rounded transition text-blue-600 active:bg-blue-200"
                          title="View user details"
                        >
                          <FaEye size={16} />
                        </button>
                        <button
                          onClick={() => deleteUser(user.id)}
                          className="p-2 hover:bg-red-100 rounded transition text-red-600 active:bg-red-200"
                          title="Delete user"
                        >
                          <FaTrash size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* User Details Modal */}
      {showModal && selectedUser && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500">
                  User Details
                </p>
                <h2 className="text-2xl font-bold text-gray-900 mt-1">
                  {selectedUser.fullname}
                </h2>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition"
              >
                Close
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">
                  Full Name
                </p>
                <p className="text-lg font-semibold text-gray-900 mt-2">
                  {selectedUser.fullname}
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">
                  Username
                </p>
                <p className="text-lg font-semibold text-gray-900 mt-2">
                  {selectedUser.username}
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">
                  Email
                </p>
                <p className="text-lg font-semibold text-gray-900 mt-2">
                  {selectedUser.email}
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">
                  Department
                </p>
                <p className="text-lg font-semibold text-gray-900 mt-2">
                  {selectedUser.department}
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">
                  Role
                </p>
                <p className="text-lg font-semibold text-gray-900 mt-2 capitalize">
                  {selectedUser.role}
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">
                  Ongoing Tickets
                </p>
                <div className="flex items-center gap-2 mt-2">
                  {selectedUser.ongoingTickets > 0 ? (
                    <>
                      <FaClock size={18} className="text-orange-500" />
                      <p className="text-lg font-semibold text-orange-600">
                        {selectedUser.ongoingTickets}
                      </p>
                    </>
                  ) : (
                    <>
                      <FaCheckCircle size={18} className="text-green-500" />
                      <p className="text-lg font-semibold text-green-600">
                        None
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">
                  Created At
                </p>
                <p className="text-sm text-gray-900 mt-2">
                  {new Date(selectedUser.createdAt).toLocaleString()}
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">
                  Last Updated
                </p>
                <p className="text-sm text-gray-900 mt-2">
                  {new Date(selectedUser.updatedAt).toLocaleString()}
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-lg bg-gray-200 text-gray-900 hover:bg-gray-300 transition font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
