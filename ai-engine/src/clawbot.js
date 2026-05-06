/**
 * Clawbot – lightweight RAG (Retrieval-Augmented Generation) helper.
 *
 * Clawbot reads the Markdown SOP files from the knowledge-base directory,
 * performs a simple keyword/TF-IDF-style search to find the most relevant
 * chunks, and prepends them as context to the Ollama prompt.
 *
 * In a production system you would replace the in-memory search with a proper
 * vector store (e.g. Chroma, Qdrant, pgvector).  For now this keeps the
 * dependency footprint minimal.
 */

const fs = require("fs");
const path = require("path");

const DEFAULT_KB_DIR = path.join(__dirname, "../../knowledge-base/sop");

/** Get the knowledge-base directory, reading env var at call-time. */
function getKbDir() {
  return process.env.KNOWLEDGE_BASE_DIR || DEFAULT_KB_DIR;
}

const CHUNK_SIZE = 500; // characters per chunk
const TOP_K = 3;        // number of chunks to return

/** Split a document into overlapping chunks. */
function chunkDocument(text, size = CHUNK_SIZE) {
  const chunks = [];
  for (let i = 0; i < text.length; i += Math.floor(size * 0.8)) {
    chunks.push(text.slice(i, i + size));
    if (i + size >= text.length) break;
  }
  return chunks;
}

/** Very simple TF-score: count how many query tokens appear in the chunk. */
function score(chunk, queryTokens) {
  const lower = chunk.toLowerCase();
  return queryTokens.reduce((acc, t) => acc + (lower.includes(t) ? 1 : 0), 0);
}

/** Load and index all Markdown files in the knowledge-base directory. */
function loadKnowledgeBase() {
  const KB_DIR = getKbDir();
  if (!fs.existsSync(KB_DIR)) return [];

  const files = fs.readdirSync(KB_DIR).filter((f) => f.endsWith(".md"));
  const allChunks = [];

  for (const file of files) {
    const content = fs.readFileSync(path.join(KB_DIR, file), "utf-8");
    const chunks = chunkDocument(content);
    chunks.forEach((chunk, idx) =>
      allChunks.push({ source: file, chunkIndex: idx, text: chunk })
    );
  }

  return allChunks;
}

/**
 * Search the knowledge base for the most relevant chunks.
 *
 * @param {string} query
 * @param {number} topK
 * @returns {{ source: string, chunkIndex: number, text: string, score: number }[]}
 */
function search(query, topK = TOP_K) {
  const chunks = loadKnowledgeBase();
  const tokens = query
    .toLowerCase()
    .split(/\W+/)
    .filter((t) => t.length > 2);

  return chunks
    .map((chunk) => ({ ...chunk, score: score(chunk.text, tokens) }))
    .filter((c) => c.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}

/**
 * Build a system prompt that includes relevant SOP context for the query.
 *
 * @param {string} query
 * @returns {string}
 */
function buildSystemPrompt(query) {
  const relevantChunks = search(query);

  const contextSection =
    relevantChunks.length > 0
      ? `\n\nReferensi SOP yang relevan:\n${relevantChunks
          .map((c) => `--- (${c.source}) ---\n${c.text}`)
          .join("\n\n")}`
      : "";

  return (
    `Kamu adalah asisten helpdesk internal Epson yang membantu karyawan dengan pertanyaan ` +
    `terkait prosedur manufaktur sintetik dan operasional.  Jawab dengan sopan, ringkas, ` +
    `dan berdasarkan SOP yang tersedia.  Jika tidak menemukan informasi yang relevan, ` +
    `minta pengguna menghubungi tim teknis.` +
    contextSection
  );
}

module.exports = { search, buildSystemPrompt, loadKnowledgeBase };
