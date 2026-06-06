"use client";

import { useEffect, useState } from "react";
import {
  FaBook,
  FaSearch,
  FaPlus,
  FaEye,
  FaEdit,
  FaTrash,
  FaTimes,
  FaSave,
  FaFilePdf,
  FaUpload,
} from "react-icons/fa";
import apiClient from "@/lib/api-client";

interface KnowledgeArticle {
  id: string;
  title: string;
  category: string;
  content: string;
  tags: string[];
  sourceDoc?: string | null;
  createdAt: string;
  updatedAt: string;
  views: number;
}

export default function KnowledgeBasePage() {
  const [articles, setArticles] = useState<KnowledgeArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [showModal, setShowModal] = useState(false);
  const [editingArticle, setEditingArticle] = useState<KnowledgeArticle | null>(
    null,
  );
  const [uploadedPdf, setUploadedPdf] = useState<File | null>(null);
  const allowedCategories = [
    "manufacturing",
    "production_line",
    "quality_control",
    "equipment_setup",
    "safety",
    "logistics",
  ];
  const [formData, setFormData] = useState({
    title: "",
    category: "manufacturing",
    content: "",
    tags: "",
  });

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        const response = await apiClient.get("/knowledge");
        setArticles(response.data.articles || []);
      } catch (err) {
        console.error("Failed to fetch articles:", err);
        // Mock data for development
        setArticles([
          {
            id: "KB-001",
            title: "Assembly line scanner not reading part labels",
            category: "manufacturing",
            content:
              "Check the scanner lens for dust, verify label contrast, and confirm the part label size matches the scanner profile.",
            tags: ["scanner", "label", "manufacturing"],
            createdAt: "2026-04-01T10:00:00",
            updatedAt: "2026-05-08T14:00:00",
            views: 245,
          },
          {
            id: "KB-002",
            title: "Incorrect torque reading on workstation tool",
            category: "equipment_setup",
            content:
              "Recalibrate the torque tool, inspect the battery level, and confirm the tightening profile is assigned to the correct workstation.",
            tags: ["torque", "calibration", "tooling"],
            createdAt: "2026-04-15T09:30:00",
            updatedAt: "2026-05-07T11:20:00",
            views: 189,
          },
          {
            id: "KB-003",
            title: "Quality check station rejects good parts",
            category: "quality_control",
            content:
              "Review the inspection threshold, clean the sensor, and validate the sample part against the latest approved specification.",
            tags: ["qc", "inspection", "sensor"],
            createdAt: "2026-03-20T13:45:00",
            updatedAt: "2026-05-06T16:30:00",
            views: 423,
          },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchArticles();
  }, []);

  const filteredArticles = articles.filter((article) => {
    const matchesSearch =
      article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      categoryFilter === "all" || article.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  const handleOpenModal = (article?: KnowledgeArticle) => {
    if (article) {
      setEditingArticle(article);
      setFormData({
        title: article.title,
        category: article.category,
        content: article.content,
        tags: article.tags.join(", "),
      });
    } else {
      setEditingArticle(null);
      setFormData({ title: "", category: "manufacturing", content: "", tags: "" });
    }
    setUploadedPdf(null);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingArticle(null);
    setFormData({ title: "", category: "manufacturing", content: "", tags: "" });
    setUploadedPdf(null);
  };

  const handlePdfUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    if (!file) {
      return;
    }

    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      alert("Please select a PDF file.");
      event.target.value = "";
      return;
    }

    setUploadedPdf(file);
    setFormData((current) => ({
      ...current,
      title: current.title || file.name.replace(/\.pdf$/i, ""),
    }));
  };

  const handleSaveArticle = async () => {
    if (!formData.title.trim()) {
      alert("Please fill in the title");
      return;
    }

    if (!uploadedPdf && !formData.content.trim()) {
      alert("Please add article content or upload a PDF file");
      return;
    }

    try {
      if (editingArticle) {
        // Update existing article
        await apiClient.put(`/knowledge/${editingArticle.id}`, {
          ...formData,
          tags: formData.tags.split(",").map((t) => t.trim()),
        });
        setArticles(
          articles.map((a) =>
            a.id === editingArticle.id
              ? {
                  ...a,
                  ...formData,
                  tags: formData.tags.split(",").map((t) => t.trim()),
                }
              : a,
          ),
        );
      } else {
        const tags = formData.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean);

        let response;
        if (uploadedPdf) {
          const payload = new FormData();
          payload.append("title", formData.title.trim());
          payload.append("category", formData.category);
          payload.append("content", formData.content);
          payload.append("tags", JSON.stringify(tags));
          payload.append("pdf", uploadedPdf);

          response = await apiClient.post("/knowledge", payload, {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          });
        } else {
          response = await apiClient.post("/knowledge", {
            ...formData,
            tags,
          });
        }

        const createdArticle = response.data.article;
        setArticles([
          ...articles,
          {
            id: createdArticle?.id ?? response.data.id ?? `kb-${Date.now()}`,
            title: createdArticle?.title ?? formData.title,
            category: createdArticle?.category ?? formData.category,
            content: createdArticle?.content ?? formData.content,
            tags: createdArticle?.tags ?? tags,
            sourceDoc: createdArticle?.sourceDoc ?? uploadedPdf?.name ?? null,
            createdAt: createdArticle?.createdAt ?? new Date().toISOString(),
            updatedAt: createdArticle?.updatedAt ?? new Date().toISOString(),
            views: 0,
          },
        ]);
      }
      handleCloseModal();
    } catch (err) {
      console.error("Failed to save article:", err);
      alert("Failed to save article. Please try again.");
    }
  };

  const handleDeleteArticle = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this article?")) {
      return;
    }

    try {
      await apiClient.delete(`/knowledge/${id}`);
      setArticles(articles.filter((a) => a.id !== id));
    } catch (err) {
      console.error("Failed to delete article:", err);
      alert("Failed to delete article. Please try again.");
    }
  };

  const categories = [
    "All Categories",
    ...new Set(articles.map((a) => a.category)),
  ];

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-800"></div>
          <p className="mt-4 text-gray-600">Loading knowledge base...</p>
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
            Knowledge Base
          </h1>
          <p className="text-gray-600 mt-2 font-lato">
            {filteredArticles.length} articles
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition shadow-lg"
        >
          <FaPlus size={16} />
          New Article
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
              placeholder="Search articles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800 outline-none"
            />
          </div>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800 outline-none"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat === "All Categories" ? "all" : cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Articles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredArticles.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <FaBook size={48} className="mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500">No articles found</p>
          </div>
        ) : (
          filteredArticles.map((article) => (
            <div
              key={article.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition flex flex-col"
            >
              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <span className="inline-block px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded font-semibold">
                    {article.category}
                  </span>
                  <span className="text-xs text-gray-500">
                    {article.views} views
                  </span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">
                  {article.title}
                </h3>
                <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                  {article.content}
                </p>
                <div className="flex flex-wrap gap-1 mb-4">
                  {article.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-block px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2 pt-4 border-t border-gray-200">
                <button
                  onClick={() => handleOpenModal(article)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded transition text-sm font-medium"
                >
                  <FaEdit size={14} /> Edit
                </button>
                <button
                  onClick={() => handleDeleteArticle(article.id)}
                  className="p-2 hover:bg-red-100 text-red-600 rounded transition"
                >
                  <FaTrash size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 font-playfair">
                {editingArticle ? "Edit Article" : "New Article"}
              </h2>
              <button
                onClick={handleCloseModal}
                className="p-2 hover:bg-gray-100 rounded transition"
              >
                <FaTimes size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="Article title"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800 outline-none"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800 outline-none"
                >
                  {allowedCategories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              {/* Content */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Content
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) =>
                    setFormData({ ...formData, content: e.target.value })
                  }
                  placeholder={
                    uploadedPdf
                      ? "Optional notes or manual fallback content..."
                      : "Article content..."
                  }
                  rows={8}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800 outline-none font-lato"
                />
              </div>

              {/* PDF Upload */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  PDF upload
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 bg-gray-50">
                  <input
                    type="file"
                    accept="application/pdf,.pdf"
                    onChange={handlePdfUpload}
                    className="w-full text-sm text-gray-700 file:mr-4 file:rounded-lg file:border-0 file:bg-gray-800 file:px-4 file:py-2 file:text-white hover:file:bg-gray-900"
                  />
                  <p className="mt-2 text-xs text-gray-500 flex items-center gap-2">
                    <FaFilePdf size={12} />
                    When a PDF is selected, the backend converts it to markdown before saving.
                  </p>
                  {uploadedPdf && (
                    <div className="mt-3 flex items-center justify-between rounded-lg bg-white border border-gray-200 px-3 py-2 text-sm text-gray-700">
                      <span className="flex items-center gap-2 truncate">
                        <FaUpload size={12} className="text-gray-500" />
                        {uploadedPdf.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => setUploadedPdf(null)}
                        className="text-gray-500 hover:text-gray-800"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) =>
                    setFormData({ ...formData, tags: e.target.value })
                  }
                  placeholder="e.g., password, account, security"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800 outline-none"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-6 flex items-center gap-3 justify-end">
              <button
                onClick={handleCloseModal}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveArticle}
                className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition font-medium"
              >
                <FaSave size={16} />
                {editingArticle ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
