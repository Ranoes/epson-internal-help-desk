# Developer Guide — Smart Helpdesk Chatbot
### PT. Indonesia Epson Industry | Tim A5 – Tim 10

---

## Daftar Isi

1. [Latar Belakang & Tujuan Proyek](#1-latar-belakang--tujuan-proyek)
2. [Arsitektur Sistem](#2-arsitektur-sistem)
3. [Stack Teknologi](#3-stack-teknologi)
4. [Alur Request End-to-End](#4-alur-request-end-to-end)
5. [Hybrid AI Routing](#5-hybrid-ai-routing)
6. [Spesifikasi API (Backend Contract)](#6-spesifikasi-api-backend-contract)
7. [Skema Database (PostgreSQL)](#7-skema-database-postgresql)
8. [Knowledge Base Sintetik](#8-knowledge-base-sintetik)
9. [Panduan Implementasi](#9-panduan-implementasi)
10. [Timeline & Pembagian PIC](#10-timeline--pembagian-pic)
11. [Checklist & Kriteria Keberhasilan](#11-checklist--kriteria-keberhasilan)
12. [Catatan Penting & Koordinasi Tim](#12-catatan-penting--koordinasi-tim)

---

## 1. Latar Belakang & Tujuan Proyek

PT. Indonesia Epson Industry adalah perusahaan manufaktur printer besar. Proses helpdesk internal saat ini masih bersifat manual — laporan masalah dicatat di kertas (*Problem Report Form*) atau dikirim via email. Kondisi ini menyebabkan sejumlah masalah operasional:

- Tidak ada sistem terpusat untuk melacak masalah.
- Teknisi baru kesulitan menemukan solusi untuk masalah yang pernah terjadi sebelumnya.
- Knowledge teknis bersifat personal dan tidak terdistribusi ke seluruh tim.
- Risiko *stopline* produksi akibat lambatnya penanganan masalah printer, hardware, dan firmware.

**Solusi:** Sistem *Smart Helpdesk Chatbot* dengan arsitektur hybrid yang fleksibel. Frontend dan database berjalan di jaringan internal Epson, sementara AI engine dapat menggunakan model lokal, API eksternal, atau kombinasi keduanya.

**Kapabilitas sistem:**

- Menerima pertanyaan karyawan dalam bahasa alami (teks & gambar).
- Mencari jawaban dari knowledge base berisi laporan teknis manufaktur printer (sintetik).
- Menggunakan RAG (*Retrieval-Augmented Generation*) agar jawaban sesuai knowledge base.
- AI engine bersifat modular: Ollama lokal, API eksternal (OpenAI/Anthropic/Gemini), atau keduanya dengan routing otomatis.
- Data sensitif (chat logs, knowledge base, user data) tetap tersimpan di server internal.

---

## 2. Arsitektur Sistem

Sistem terdiri dari **3 layer utama** yang berkomunikasi melalui REST API JSON:

| Layer | Komponen |
|---|---|
| **Client Layer** | Browser (Chrome/Edge) di intranet Epson → Next.js Frontend (Chat UI, Login, Dashboard Admin) |
| **Application Layer** | Express.js Backend API → AI Router → [Ollama Lokal \| API Eksternal \| Keduanya] → RAG Pipeline → Response Generator → Escalation Handler |
| **Data Layer** | PostgreSQL (chat logs, tiket, users) + Vector DB (embeddings KB) + Knowledge Base Files (PDF/JSON) |

---

## 3. Stack Teknologi

| Layer | Teknologi | Keterangan |
|---|---|---|
| Frontend | Next.js (React) | UI chatbot, dashboard admin, login page |
| Backend API | Express.js / Fastify + Node.js | REST API, business logic, orchestration |
| AI Engine (Lokal) | Ollama + Clawbot *(opsional)* | Model LLM lokal — cepat, gratis, privat |
| AI Engine (Eksternal) | OpenAI API / Anthropic API / Gemini | Model cloud untuk pertanyaan kompleks |
| AI Router | Logika routing di backend | Menentukan engine per-request berdasarkan kompleksitas |
| Workflow Automation | n8n *(opsional)* | Pipeline RAG, notifikasi email, scheduled KB update |
| RAG Pipeline | LangChain / LlamaIndex | Chunking, embedding, retrieval dokumen |
| Vector DB | ChromaDB / pgvector | Menyimpan embedding knowledge base |
| Database | PostgreSQL + Prisma ORM | Chat logs, tiket, user, knowledge entries |
| Deployment | Ubuntu Server (On-Premise) | Server internal PT. Epson |

> **Catatan:** Clawbot dan n8n bersifat opsional. Pemilihan engine per-request ditentukan oleh AI Router berdasarkan kompleksitas pertanyaan dan konfigurasi tim.

---

## 4. Alur Request End-to-End

Berikut alur lengkap dari saat pengguna mengirim pesan hingga menerima jawaban:

| # | Step | Detail |
|---|---|---|
| 1 | **User Input** | Karyawan mengetik pertanyaan atau upload gambar defect printer via browser |
| 2 | **POST /api/chat** | Frontend mengirim JSON payload ke backend: `{ sessionId, userId, message, imageBase64? }` |
| 3 | **AI Router** | Backend menentukan engine: Ollama lokal (pertanyaan sederhana) atau API eksternal (kompleks/multimodal) |
| 4 | **Query Embedding** | Pertanyaan diubah menjadi vector embedding menggunakan model embedding lokal |
| 5 | **Vector Search** | Embedding dibandingkan dengan ChromaDB untuk mencari dokumen paling relevan |
| 6 | **Context Injection** | Top-K dokumen relevan dimasukkan ke prompt sebagai context (RAG) |
| 7 | **LLM Generation** | Engine terpilih men-generate jawaban berdasarkan context + pertanyaan asli |
| 8 | **Response Check** | Jika confidence rendah / jawaban tidak ditemukan → trigger escalation |
| 9 | **Log & Store** | Percakapan disimpan ke PostgreSQL (`chat_logs` table) |
| 10 | **Return Response** | Backend mengirim JSON response ke frontend → ditampilkan di chat UI |

---

## 5. Hybrid AI Routing

### Strategi Routing

AI Router secara otomatis memilih engine berdasarkan karakteristik pertanyaan:

| Tipe Pertanyaan | Engine | Contoh | Alasan |
|---|---|---|---|
| Sederhana & ada di KB | Ollama Lokal (llama3.2) | Cara ganti tinta, error E-01 | Cepat, gratis, privat |
| Kompleks / reasoning dalam | API Eksternal (GPT-4o-mini) | Analisis penyebab akar masalah multi-faktor | Model lokal kurang kemampuan reasoning |
| Analisis gambar (defect foto) | API Eksternal multimodal (GPT-4o) | Upload foto garis pada print | GPT-4o Vision lebih akurat dari LLaVA |
| Laporan analitik & summary | API Eksternal | Rangkuman top-issues mingguan | Butuh kualitas summarization tinggi |
| Fallback jika API down | Ollama Lokal | Semua tipe | Selalu tersedia meski offline |

### Perbandingan Engine

| Engine | Biaya | Kecepatan | Kualitas | Kapan Pakai |
|---|---|---|---|---|
| Ollama (Lokal) | Gratis setelah setup | Tergantung GPU/CPU | Cukup untuk FAQ | Pertanyaan standar, fallback, dev/testing |
| GPT-4o-mini | ~$0.15/1M token input | ~2–4 detik | Sangat Baik | Pertanyaan kompleks, reasoning mendalam |
| GPT-4o | ~$2.5/1M token input | ~3–6 detik | Terbaik | Analisis gambar defect, kasus kritis |
| Claude Haiku | ~$0.25/1M token input | Sangat Cepat | Baik | Alternatif hemat GPT-4o-mini |
| Gemini Flash | ~$0.075/1M token | Sangat Cepat | Baik | Volume tinggi, biaya minimum |

> **Rekomendasi:** Mulai dengan Ollama untuk semua query di fase MVP. Setelah sistem stabil, aktifkan hybrid routing untuk pertanyaan yang membutuhkan model lebih besar. Budget API eksternal dikendalikan dengan membatasi routing hanya pada query dengan `complexityScore` tinggi.

### Logika Routing (Pseudocode)

```js
// ai-engine/src/router.js
function selectEngine(query, hasImage, complexityScore) {
  if (!hasImage && complexityScore < 0.5) {
    return 'ollama-local';           // Murah, cepat, privat
  }
  if (hasImage) {
    return 'openai-gpt4o-vision';    // Atau gemini-pro-vision
  }
  if (complexityScore >= 0.5) {
    return 'openai-gpt4o-mini';      // Atau 'anthropic-claude-haiku'
  }
  return 'ollama-local';             // Default fallback
}

// complexityScore dihitung dari: panjang pertanyaan, jumlah entitas,
// kata seperti "analisis", "kenapa", "bandingkan", "rekomendasi", dll.
```

### Implementasi Lengkap AI Router

```js
// ai-engine/src/aiRouter.js
const COMPLEXITY_KEYWORDS = ['kenapa', 'analisis', 'bandingkan', 'rekomendasi',
  'jelaskan secara detail', 'apa penyebab'];

function calculateComplexity(message) {
  const lower = message.toLowerCase();
  const keywordHits = COMPLEXITY_KEYWORDS.filter(k => lower.includes(k)).length;
  const lengthScore = Math.min(message.length / 300, 1);
  return Math.min((keywordHits * 0.25) + (lengthScore * 0.5), 1.0);
}

async function selectAndGenerate(systemPrompt, userMessage, imageBase64 = null) {
  const complexity = calculateComplexity(userMessage);
  const hasImage = !!imageBase64;
  let engineUsed = '';

  try {
    if (hasImage) {
      engineUsed = 'openai-gpt4o';
      return { reply: await generateOpenAI(systemPrompt, userMessage, imageBase64, 'gpt-4o'), engineUsed };
    } else if (complexity >= 0.5) {
      engineUsed = 'openai-gpt4o-mini';
      return { reply: await generateOpenAI(systemPrompt, userMessage, null, 'gpt-4o-mini'), engineUsed };
    } else {
      engineUsed = 'ollama-local';
      return { reply: await generateOllama(systemPrompt, userMessage), engineUsed };
    }
  } catch (err) {
    console.warn(`Engine ${engineUsed} failed, falling back to Ollama:`, err.message);
    engineUsed = 'ollama-local-fallback';
    return { reply: await generateOllama(systemPrompt, userMessage), engineUsed };
  }
}

// Ollama (Lokal)
async function generateOllama(systemPrompt, userMessage) {
  const res = await fetch('http://localhost:11434/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'llama3.2',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ],
      stream: false
    })
  });
  const data = await res.json();
  return data.message.content;
}

// OpenAI API (Eksternal)
async function generateOpenAI(systemPrompt, userMessage, imageBase64 = null, model = 'gpt-4o-mini') {
  const userContent = imageBase64
    ? [
        { type: 'text', text: userMessage },
        { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${imageBase64}` } }
      ]
    : userMessage;

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent }
      ],
      max_tokens: 1000
    })
  });
  const data = await res.json();
  return data.choices[0].message.content;
}

module.exports = { selectAndGenerate };
```

---

## 6. Spesifikasi API (Backend Contract)

**Base URL:** `http://[internal-server]:3001/api`

Semua endpoint menggunakan format JSON. Setiap perubahan pada API contract **wajib dikomunikasikan** ke seluruh tim via GitHub Issues atau group chat sebelum diimplementasikan.

---

### Auth

#### `POST /api/auth/login`

```json
// Request Body
{
  "username": "karyawan001",
  "password": "password123"
}

// Response 200 OK
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "usr_001",
    "name": "Budi Santoso",
    "role": "user"   // "user" | "admin" | "manager"
  }
}

// Response 401 Unauthorized
{
  "success": false,
  "error": "Invalid credentials"
}
```

---

### Chat

#### `POST /api/chat/message`

```json
// Request Body
{
  "sessionId": "sess_abc123",
  "userId": "usr_001",
  "message": "Printer ET-2400 hasil print bergaris, bagaimana solusinya?",
  "imageBase64": null   // opsional, base64 string jika ada gambar
}

// Response 200 OK — jawaban ditemukan
{
  "success": true,
  "messageId": "msg_xyz789",
  "reply": "Berdasarkan knowledge base: Garis pada hasil print biasanya disebabkan oleh printhead tersumbat...",
  "confidence": 0.87,
  "sources": [
    { "docId": "kb_023", "title": "SOP Printhead Cleaning ET-Series", "relevance": 0.91 }
  ],
  "escalated": false,
  "timestamp": "2026-05-06T08:30:00Z"
}

// Response 200 OK — eskalasi triggered
{
  "success": true,
  "messageId": "msg_xyz790",
  "reply": "Maaf, saya tidak menemukan solusi untuk masalah ini di knowledge base. Tiket telah dibuat untuk tim IT Support.",
  "confidence": 0.12,
  "sources": [],
  "escalated": true,
  "ticketId": "tkt_00045",
  "timestamp": "2026-05-06T08:31:00Z"
}
```

#### `GET /api/chat/history/:sessionId`

```json
// Response 200 OK
{
  "success": true,
  "sessionId": "sess_abc123",
  "messages": [
    {
      "messageId": "msg_xyz001",
      "role": "user",
      "content": "Printer ET-2400 hasil print bergaris",
      "timestamp": "2026-05-06T08:29:00Z"
    },
    {
      "messageId": "msg_xyz789",
      "role": "assistant",
      "content": "Berdasarkan knowledge base: Garis pada hasil print...",
      "confidence": 0.87,
      "timestamp": "2026-05-06T08:30:00Z"
    }
  ]
}
```

---

### Knowledge Base

#### `GET /api/knowledge`

Query params: `?page=1&limit=20&category=hardware&search=printhead`

```json
// Response 200 OK
{
  "success": true,
  "total": 145,
  "page": 1,
  "limit": 20,
  "data": [
    {
      "id": "kb_023",
      "title": "SOP Printhead Cleaning ET-Series",
      "category": "hardware",
      "subcategory": "quality_printing",
      "content": "...",
      "tags": ["printhead", "cleaning", "ET-2400", "garis"],
      "createdAt": "2026-01-15T00:00:00Z",
      "updatedAt": "2026-04-01T00:00:00Z"
    }
  ]
}
```

#### `POST /api/knowledge` *(Admin only)*

```json
// Request Body
{
  "title": "Troubleshooting Firmware Error Code E-01",
  "category": "firmware",
  "subcategory": "error_codes",
  "content": "Error E-01 pada printer ET-4850 menandakan...",
  "tags": ["firmware", "error", "E-01", "ET-4850"],
  "sourceDocument": "Technical Report TR-2026-042"
}

// Response 201 Created
{
  "success": true,
  "id": "kb_146",
  "message": "Knowledge entry created and indexed successfully"
}
```

---

### Tiket & Eskalasi

#### `GET /api/tickets`

Query params: `?status=open&page=1&limit=20`

```json
// Response 200 OK
{
  "success": true,
  "data": [
    {
      "ticketId": "tkt_00045",
      "userId": "usr_001",
      "userName": "Budi Santoso",
      "question": "Masalah yang tidak dapat dijawab chatbot",
      "sessionId": "sess_abc123",
      "status": "open",   // "open" | "in_progress" | "resolved"
      "assignedTo": null,
      "createdAt": "2026-05-06T08:31:00Z"
    }
  ]
}
```

---

### Analytics *(Admin/Manager)*

#### `GET /api/analytics/summary`

Query params: `?from=2026-05-01&to=2026-05-06`

```json
// Response 200 OK
{
  "success": true,
  "period": { "from": "2026-05-01", "to": "2026-05-06" },
  "stats": {
    "totalMessages": 342,
    "resolvedByChatbot": 287,
    "escalated": 55,
    "resolutionRate": 0.839,
    "avgConfidence": 0.81,
    "topIssues": [
      { "category": "quality_printing", "count": 98 },
      { "category": "hardware_part",    "count": 74 },
      { "category": "firmware_error",   "count": 56 }
    ]
  }
}
```

---

## 7. Skema Database (PostgreSQL)

```sql
-- Tabel: knowledge_base
CREATE TABLE knowledge_base (
  id           VARCHAR(20)  PRIMARY KEY,         -- kb_001, kb_002, ...
  title        VARCHAR(255) NOT NULL,
  category     VARCHAR(50)  NOT NULL,             -- hardware, firmware, quality_printing
  subcategory  VARCHAR(100),
  content      TEXT         NOT NULL,             -- isi solusi / SOP
  tags         TEXT[],                            -- array of keywords
  source_doc   VARCHAR(255),                      -- referensi dokumen asli
  embedding_id VARCHAR(100),                      -- ID di vector DB
  created_at   TIMESTAMPTZ  DEFAULT NOW(),
  updated_at   TIMESTAMPTZ  DEFAULT NOW()
);

-- Tabel: chat_logs
CREATE TABLE chat_logs (
  id          VARCHAR(20)  PRIMARY KEY,
  session_id  VARCHAR(50)  NOT NULL,
  user_id     VARCHAR(20)  NOT NULL,
  role        VARCHAR(10)  NOT NULL,              -- user | assistant
  content     TEXT         NOT NULL,
  confidence  FLOAT,
  escalated   BOOLEAN      DEFAULT FALSE,
  kb_sources  TEXT[],                             -- array of kb_id yang dipakai
  engine_used VARCHAR(50),                        -- ollama-local | openai-gpt4o-mini, dll.
  created_at  TIMESTAMPTZ  DEFAULT NOW()
);

-- Tabel: tickets
CREATE TABLE tickets (
  id          VARCHAR(20)  PRIMARY KEY,
  user_id     VARCHAR(20)  NOT NULL,
  session_id  VARCHAR(50),
  question    TEXT         NOT NULL,
  status      VARCHAR(20)  DEFAULT 'open',        -- open | in_progress | resolved
  assigned_to VARCHAR(20),
  resolution  TEXT,
  created_at  TIMESTAMPTZ  DEFAULT NOW(),
  updated_at  TIMESTAMPTZ  DEFAULT NOW()
);

-- Tabel: users
CREATE TABLE users (
  id            VARCHAR(20)  PRIMARY KEY,
  username      VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name          VARCHAR(255),
  role          VARCHAR(20)  DEFAULT 'user',      -- user | admin | manager
  department    VARCHAR(100),
  created_at    TIMESTAMPTZ  DEFAULT NOW()
);
```

---

## 8. Knowledge Base Sintetik

Seluruh data knowledge base menggunakan data **sintetik** — tidak ada data asli PT. Epson yang digunakan. Fokus proyek adalah membuktikan arsitektur sistem bekerja dengan benar.

### Format Setiap Entri

Setiap entri mengikuti struktur: **Gejala → Penyebab → Langkah Penyelesaian (numbered)**

### Target Pembuatan Data (PIC: Kevin)

| Kategori | Subkategori | Target Entri |
|---|---|---|
| `quality_printing` | print_defect, color_accuracy, alignment, banding | 12 entri |
| `hardware` | connectivity, paper_feed, ink_system, part_replacement | 10 entri |
| `firmware` | error_codes, firmware_update, factory_reset, diagnostics | 8 entri |
| `general_ops` | preventive_maintenance, daily_checklist, onboarding | 5 entri |

**Total minimum: 35 entri**

### Contoh Entri JSON

```json
{
  "id": "kb_001",
  "title": "Garis Horizontal pada Hasil Print - Printhead Tersumbat",
  "category": "quality_printing",
  "subcategory": "print_defect",
  "content": "Gejala: Hasil cetak menunjukkan garis horizontal putih atau berwarna yang berulang. Penyebab: Nozzle printhead tersumbat oleh tinta kering. Langkah Penyelesaian: 1) Buka menu Settings > Maintenance pada printer ET-2400/ET-4850. 2) Pilih Print Head Cleaning dan jalankan proses standard cleaning (3-5 menit). 3) Cetak nozzle check pattern untuk verifikasi. 4) Jika masih bergaris, jalankan Power Cleaning. 5) Jika setelah 3x Power Cleaning masih bergaris, lakukan pengecekan fisik printhead dan hubungi supervisor teknis.",
  "tags": ["garis", "horizontal", "printhead", "nozzle", "tersumbat", "ET-2400", "ET-4850"],
  "source_doc": "Epson ET-Series Technical Manual v3.2 - Section 5.1"
}
```

Referensi publik: https://epson.com/Support/Printers/All-In-Ones/ET-Series/Epson-ET-2400/s/SPT_C11CJ67201

---

## 9. Panduan Implementasi

### Implementasi Chat Service

```js
// backend/src/services/chatService.js
const { selectAndGenerate } = require('../../ai-engine/src/aiRouter');
const { vectorSearch }      = require('./vectorStore');
const { OllamaClient }      = require('./ollamaClient');
const { db }                = require('../database');

async function processChat(userId, sessionId, message, imageBase64 = null) {
  // 1. Retrieve relevant KB documents
  const embedding = await OllamaClient.embed(message);
  const topDocs   = await vectorSearch(embedding, topK = 3);

  // 2. Build context string
  const context    = topDocs.map(doc => `[Source: ${doc.title}]\n${doc.content}`).join('\n\n---\n\n');
  const confidence = topDocs.length > 0 ? topDocs[0].score : 0;
  const escalated  = confidence < 0.60;

  // 3. Build prompt with RAG context
  const systemPrompt = `Kamu adalah asisten helpdesk teknis PT. Indonesia Epson Industry.
Jawab pertanyaan karyawan HANYA berdasarkan context di bawah ini.
Jika tidak ada informasi relevan, katakan tidak tahu dan sarankan eskalasi ke IT Support.
Gunakan bahasa Indonesia yang jelas dan berikan langkah-langkah yang spesifik.

CONTEXT:
${context}`;

  // 4. Call AI Router (atau fallback message jika eskalasi)
  const { reply, engineUsed } = escalated
    ? { reply: 'Maaf, saya tidak menemukan solusi untuk masalah ini. Tim IT Support akan segera dihubungi.', engineUsed: 'none' }
    : await selectAndGenerate(systemPrompt, message, imageBase64);

  // 5. Save to database
  const messageId = `msg_${Date.now()}`;
  await db.chat_logs.create({
    data: {
      id: messageId, session_id: sessionId, user_id: userId,
      role: 'assistant', content: reply, confidence, escalated,
      kb_sources: topDocs.map(d => d.id), engine_used: engineUsed
    }
  });

  // 6. Create ticket if escalated
  let ticketId = null;
  if (escalated) {
    const ticket = await db.tickets.create({
      data: { id: `tkt_${Date.now()}`, user_id: userId, session_id: sessionId, question: message, status: 'open' }
    });
    ticketId = ticket.id;
  }

  return { reply, confidence, sources: topDocs, escalated, ticketId, messageId };
}
```

---

## 10. Timeline & Pembagian PIC

| Minggu | Focus Area | Kegiatan Utama | PIC |
|---|---|---|---|
| 1–2 | Fondasi | Repo setup, finalisasi API contract, Figma wireframe, setup Ollama + PostgreSQL, KB sintetik awal (10 entri) | Adrian, Ilham, Ahmadhani, Kevin, Rasky |
| 3–4 | Core Development | Backend API (auth + chat endpoint), RAG pipeline dasar, Chat UI frontend, KB 35 entri | Ahmadhani, Rasky, Ilham, Kevin |
| 5–6 | Integrasi | Connect frontend–backend, integrasi AI engine, eskalasi tiket, dashboard admin v1 | Semua + Andri mulai test plan |
| 7 | Testing & Fix | Black-box 30 skenario, API testing Postman, bug fixing | Andri, semua fix bug |
| 8 | UAT & Polish | UAT dengan responden, SUS score, UI polish, performance test, finalisasi dokumentasi | Andri, Ilham, Adrian |
| 9 | Final | Demo preparation, laporan akhir, presentasi PoC | Adrian koordinasi semua |

---

## 11. Checklist & Kriteria Keberhasilan

| Kriteria | Target LK01 | PIC |
|---|---|---|
| Chatbot merespons pertanyaan teknis dalam bahasa alami | Fungsional | Rasky + Ahmadhani |
| Jawaban sesuai knowledge base (tidak halusinasi) | Akurasi ≥ 80% | Rasky + Kevin |
| Black-box testing 30 skenario | Pass rate ≥ 80% | Andri + Rasky |
| Eskalasi tiket otomatis jika chatbot tidak bisa jawab | Berfungsi | Ahmadhani + Rasky |
| Riwayat percakapan tersimpan 100% | Berfungsi | Ahmadhani |
| UAT dengan kuesioner SUS | Skor ≥ 70 | Andri + Ilham |
| Dashboard monitoring statistik masalah | Berfungsi | Ilham + Kevin |
| Data & KB tersimpan di server internal (on-premise) | Verified | Adrian + Ahmadhani |
| AI engine berjalan (lokal, API, atau hybrid) | Minimal 1 mode aktif | Rasky |
| Response time chatbot | < 3 detik (atau < 5 detik untuk LLM) | Andri (performance test) |
| PoC live demo tanpa crash | Stable demo | Semua |

---

## 12. Catatan Penting & Koordinasi Tim

**Data Produksi**
Seluruh data knowledge base menggunakan data sintetik. Tidak ada data asli PT. Epson yang digunakan. Fokus proyek adalah membuktikan arsitektur sistem bekerja dengan benar.

**Arsitektur AI Hybrid**
Sistem tidak wajib full on-premise untuk AI engine. Tiga opsi tersedia:

1. **Ollama Lokal saja** — gratis, privat, cocok untuk MVP dan pertanyaan standar.
2. **API Eksternal saja** — kualitas lebih tinggi, mudah setup, ada biaya per-token.
3. **Hybrid (direkomendasikan)** — Ollama untuk pertanyaan sederhana, API eksternal untuk pertanyaan kompleks atau analisis gambar.

Data sensitif (KB, chat logs, users) **tetap di server internal** dalam semua skenario.

**Koordinasi**
Setiap perubahan pada API contract **wajib dikomunikasikan** ke seluruh tim via GitHub Issues atau group chat sebelum diimplementasikan. Perubahan mendadak pada interface akan memblokir pekerjaan anggota lain.

---

*Dokumen ini dibuat berdasarkan overview.pdf, API_json.pdf, dan implementasi.pdf — Tim A5 Tim 10.*
