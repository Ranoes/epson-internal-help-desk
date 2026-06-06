"use client";

import { useEffect, useState } from "react";
import {
  FaTicketAlt,
  FaSearch,
  FaEye,
  FaEdit,
  FaTrash,
  FaPlus,
  FaCheckCircle,
  FaClock,
  FaTimesCircle,
  FaSave,
} from "react-icons/fa";
import apiClient from "@/lib/api-client";

interface Ticket {
  id: string;
  title: string;
  description: string;
  status: "open" | "in_progress" | "resolved" | "closed";
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  assignedTo?: string | null;
  resolution?: string | null;
}

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editStatus, setEditStatus] = useState<Ticket["status"]>("open");
  const [editResolution, setEditResolution] = useState("");
  const [editAssignedTo, setEditAssignedTo] = useState("");
  const [newTicketUserId, setNewTicketUserId] = useState("");
  const [newTicketSessionId, setNewTicketSessionId] = useState("");
  const [newTicketQuestion, setNewTicketQuestion] = useState("");
  const [saving, setSaving] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const response = await apiClient.get("/tickets");
        setTickets(response.data.tickets || []);
      } catch (err) {
        console.error("Failed to fetch tickets:", err);
        // Mock data for development
        setTickets([
          {
            id: "TKT-001",
            title: "Printer not responding",
            description:
              "Office printer on 3rd floor not responding to print requests",
            status: "open",
            createdBy: "karyawan001",
            createdAt: "2026-05-08T10:30:00",
            updatedAt: "2026-05-08T10:30:00",
          },
          {
            id: "TKT-002",
            title: "VPN connection issues",
            description: "Remote employees unable to connect to corporate VPN",
            status: "in_progress",
            createdBy: "karyawan002",
            createdAt: "2026-05-07T14:15:00",
            updatedAt: "2026-05-08T09:00:00",
          },
          {
            id: "TKT-003",
            title: "Software license renewal",
            description: "Need to renew Microsoft Office licenses for 10 users",
            status: "resolved",
            createdBy: "karyawan003",
            createdAt: "2026-05-05T11:20:00",
            updatedAt: "2026-05-08T08:45:00",
          },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchTickets();
  }, []);

  const filteredTickets = tickets.filter((ticket) => {
    const title = ticket?.title || "";
    const id = ticket?.id || "";
    const status = ticket?.status || "";

    const matchesSearch =
      title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "resolved":
        return <FaCheckCircle className="text-green-600" />;
      case "in_progress":
        return <FaClock className="text-yellow-600" />;
      case "closed":
        return <FaTimesCircle className="text-red-600" />;
      default:
        return <FaTicketAlt className="text-blue-600" />;
    }
  };

  const openEditor = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setEditStatus(ticket.status);
    setEditResolution(ticket.resolution || "");
    setEditAssignedTo(ticket.assignedTo || "");
    setShowModal(true);
  };

  const saveTicket = async () => {
    if (!selectedTicket) return;

    setSaving(true);
    try {
      const response = await apiClient.patch(`/tickets/${selectedTicket.id}`, {
        status: editStatus,
        assignedTo: editAssignedTo || null,
        resolution: editResolution,
      });

      if (response.data?.success) {
        setTickets((current) =>
          current.map((ticket) =>
            ticket.id === selectedTicket.id
              ? {
                  ...ticket,
                  status: editStatus,
                  assignedTo: editAssignedTo || null,
                  resolution: editResolution,
                  updatedAt: new Date().toISOString(),
                }
              : ticket,
          ),
        );
        setShowModal(false);
        setSelectedTicket(null);
      }
    } catch (error) {
      console.error("Failed to update ticket:", error);
      alert("Failed to update ticket");
    } finally {
      setSaving(false);
    }
  };

  const createTicket = async () => {
    if (!newTicketUserId.trim() || !newTicketQuestion.trim()) return;

    setCreating(true);
    try {
      const response = await apiClient.post("/tickets", {
        userId: newTicketUserId.trim(),
        sessionId: newTicketSessionId.trim() || null,
        question: newTicketQuestion.trim(),
      });

      if (response.data?.success) {
        const createdTicket = {
          id: response.data.ticketId,
          title: newTicketQuestion.trim().slice(0, 50),
          description: newTicketQuestion.trim(),
          status: "open" as const,
          createdBy: newTicketUserId.trim(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          assignedTo: null,
          resolution: null,
        };
        setTickets((current) => [createdTicket, ...current]);
        setShowCreateModal(false);
        setNewTicketUserId("");
        setNewTicketSessionId("");
        setNewTicketQuestion("");
      }
    } catch (error) {
      console.error("Failed to create ticket:", error);
      alert("Failed to create ticket");
    } finally {
      setCreating(false);
    }
  };

  const deleteTicket = async (ticketId: string) => {
    const confirmed = window.confirm("Delete this ticket?");
    if (!confirmed) return;

    try {
      const response = await apiClient.delete(`/tickets/${ticketId}`);
      if (response.data?.success) {
        setTickets((current) => current.filter((ticket) => ticket.id !== ticketId));
      }
    } catch (error) {
      console.error("Failed to delete ticket:", error);
      alert("Failed to delete ticket");
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-800"></div>
          <p className="mt-4 text-gray-600">Loading tickets...</p>
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
            Ticket Management
          </h1>
          <p className="text-gray-600 mt-2 font-lato">
            {filteredTickets.length} tickets
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition shadow-lg"
        >
          <FaPlus size={16} />
          New Ticket
        </button>
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
              placeholder="Search by ID or title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800 outline-none"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800 outline-none"
          >
            <option value="all">All Status</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
        </div>
      </div>

      {/* Tickets Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {filteredTickets.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <FaTicketAlt size={48} className="mx-auto mb-4 text-gray-300" />
            <p>No tickets found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">
                    Created By
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredTickets.map((ticket) => (
                  <tr
                    key={ticket.id}
                    className="border-b border-gray-200 hover:bg-gray-50 transition"
                  >
                    <td className="px-6 py-4">
                      <span className="font-semibold text-gray-900">
                        {ticket.id}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <p className="text-sm font-medium text-gray-900">
                          {ticket.title}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {ticket.description
                            ? ticket.description.length > 50
                              ? ticket.description.substring(0, 50) + "..."
                              : ticket.description
                            : "No description"}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(ticket.status)}
                        <span className="text-sm text-gray-700">
                          {ticket.status.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {ticket.createdBy}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button className="p-2 hover:bg-gray-200 rounded transition text-gray-600">
                          <FaEye size={16} />
                        </button>
                        <button
                          onClick={() => openEditor(ticket)}
                          className="p-2 hover:bg-gray-200 rounded transition text-gray-600"
                        >
                          <FaEdit size={16} />
                        </button>
                        <button
                          onClick={() => deleteTicket(ticket.id)}
                          className="p-2 hover:bg-red-100 rounded transition text-red-600"
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

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6">
            <div className="flex items-start justify-between gap-4 mb-5">
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500">New Ticket</p>
                <h2 className="text-2xl font-bold text-gray-900 mt-1">Create Escalation</h2>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition"
              >
                Close
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="block">
                <span className="text-sm font-semibold text-gray-700">User ID</span>
                <input
                  value={newTicketUserId}
                  onChange={(e) => setNewTicketUserId(e.target.value)}
                  className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2"
                  placeholder="karyawan001"
                />
              </label>
              <label className="block">
                <span className="text-sm font-semibold text-gray-700">Session ID</span>
                <input
                  value={newTicketSessionId}
                  onChange={(e) => setNewTicketSessionId(e.target.value)}
                  className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2"
                  placeholder="sess_123"
                />
              </label>
            </div>

            <label className="block mt-4">
              <span className="text-sm font-semibold text-gray-700">Question</span>
              <textarea
                value={newTicketQuestion}
                onChange={(e) => setNewTicketQuestion(e.target.value)}
                rows={5}
                className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2"
                placeholder="Describe the issue for escalation"
              />
            </label>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={createTicket}
                disabled={creating}
                className="px-4 py-2 rounded-lg bg-gray-900 text-white hover:bg-gray-800 transition disabled:opacity-60 flex items-center gap-2"
              >
                <FaPlus size={14} />
                {creating ? "Creating..." : "Create Ticket"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showModal && selectedTicket && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6">
            <div className="flex items-start justify-between gap-4 mb-5">
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500">Edit Ticket</p>
                <h2 className="text-2xl font-bold text-gray-900 mt-1">{selectedTicket.id}</h2>
                <p className="text-sm text-gray-600 mt-1">{selectedTicket.title}</p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition"
              >
                Close
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="block">
                <span className="text-sm font-semibold text-gray-700">Status</span>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as Ticket["status"])}
                  className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2"
                >
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-gray-700">Assigned To</span>
                <input
                  value={editAssignedTo}
                  onChange={(e) => setEditAssignedTo(e.target.value)}
                  className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2"
                  placeholder="Engineer or admin name"
                />
              </label>
            </div>

            <label className="block mt-4">
              <span className="text-sm font-semibold text-gray-700">Admin Reply / Resolution</span>
              <textarea
                value={editResolution}
                onChange={(e) => setEditResolution(e.target.value)}
                rows={5}
                className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2"
                placeholder="Write the reply that the employee will see"
              />
            </label>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={saveTicket}
                disabled={saving}
                className="px-4 py-2 rounded-lg bg-gray-900 text-white hover:bg-gray-800 transition disabled:opacity-60 flex items-center gap-2"
              >
                <FaSave size={14} />
                {saving ? "Saving..." : "Save Reply"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
