# epson-internal-help-desk

> Sistem helpdesk internal Epson berbasis AI untuk mendukung operasional manufaktur sintetik.

## Arsitektur

```
epson-internal-help-desk/
├── frontend/          # Next.js 16 – antarmuka pengguna
├── backend/           # Express.js + Prisma – REST API & database
├── ai-engine/         # Clawbot (RAG) + Ollama – mesin AI
└── knowledge-base/    # File SOP manufaktur sintetik (Markdown)
```

### Stack

| Komponen | Teknologi |
|---|---|
| Frontend | Next.js 16, TypeScript, Tailwind CSS |
| Backend | Express.js, Prisma ORM, SQLite (dev) / PostgreSQL (prod) |
| AI Engine | Ollama (LLM lokal), Clawbot (RAG berbasis keyword) |
| Knowledge Base | File Markdown SOP |

---

## Quickstart

### Prasyarat

- Node.js ≥ 18
- [Ollama](https://ollama.com/) terinstal dan berjalan secara lokal

### 1. Siapkan Ollama

```bash
ollama pull llama3      # unduh model (satu kali)
ollama serve            # jalankan server Ollama (port 11434)
```

### 2. Backend

```bash
cd backend
cp .env.example .env    # sesuaikan DATABASE_URL jika perlu
npm install
npx prisma migrate dev  # buat skema database
npm run dev             # http://localhost:4000
```

### 3. AI Engine

```bash
cd ai-engine
cp .env.example .env
npm install
npm run dev             # http://localhost:5000
```

### 4. Frontend

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev             # http://localhost:3000
```

---

## Fitur

- **Tiket Dukungan** – buat, lacak, dan perbarui tiket helpdesk
- **Asisten AI** – chat dengan AI yang memiliki konteks SOP manufaktur sintetik
- **Knowledge Base** – cari dan baca SOP secara langsung dari browser
- **RAG (Retrieval-Augmented Generation)** – Clawbot secara otomatis menyisipkan potongan SOP yang relevan ke dalam prompt AI

## SOP yang Tersedia

| Kode | Judul |
|---|---|
| SOP-001 | Proses Pencampuran Tinta Sintetik |
| SOP-002 | Pengujian Kualitas Tinta |
| SOP-201 | Keselamatan Kerja di Area Produksi |
| SOP-301 | Pemeliharaan Preventif Mesin Pencampur |
| SOP-401 | Pengelolaan Akun & Akses Sistem IT |

Tambahkan SOP baru dengan menyalin `knowledge-base/templates/sop-template.md` ke `knowledge-base/sop/`.

---

## Pengembangan

```bash
# Backend tests
cd backend && npm test

# AI engine tests
cd ai-engine && npm test

# Frontend build check
cd frontend && npm run build

# Frontend lint
cd frontend && npm run lint
```

## Variabel Lingkungan

Lihat file `.env.example` di masing-masing direktori (`backend/`, `ai-engine/`, `frontend/`).
