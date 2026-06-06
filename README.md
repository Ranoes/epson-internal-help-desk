# epson-internal-help-desk

Internal help desk platform with a Next.js frontend, Node.js backend, PostgreSQL, and a Python AI engine.

## Prerequisites

- Node.js 18+ and npm
- Python 3.10+
- PostgreSQL 14+
- Optional: Docker Desktop for the Compose-based setup

## Project Layout

- `frontend/` - Next.js app
- `backend/` - Express API + Prisma
- `ai-engine/` - Python AI service
- `database/` - SQL schema files

## Quick Start with Docker Compose

1. Copy and edit environment files as needed:
   - `backend/.env.example` -> `backend/.env`
   - `ai-engine/.env.example` -> `ai-engine/.env`

2. Start the stack:

```sh
docker-compose up --build
```

3. Open the apps:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001
   - AI Engine: http://localhost:8000

## Local LLM Guide

The AI engine can run with a local Ollama model for chat and embeddings.

### 1. Install Ollama

Install and start Ollama on your machine, then pull the models used by this project:

```sh
ollama pull llama3.2:3b
ollama pull nomic-embed-text
```

### 2. Configure the AI engine

Edit `ai-engine/.env`:

```env
AI_PROVIDER=ollama
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2:3b
OLLAMA_EMBEDDING_MODEL=nomic-embed-text
DATABASE_URL=postgresql://postgres:admin@localhost:5432/helpdesk
```

### 3. Run the AI engine

```sh
cd ai-engine
python -m venv .venv
.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
python src/chat_service.py
```

## Knowledge Base Guide

The knowledge base is stored in PostgreSQL and exported into a RAG-ready file by `ai-engine/src/load_kb.py`.

### 1. Make sure the database is ready

Apply the schema in `database/schema.sql` and seed or import your knowledge base records into the `knowledge_base` table.

### 2. Export the knowledge base

```sh
cd ai-engine
.venv\Scripts\Activate.ps1
python src/load_kb.py
```

Optional formats:

```sh
python src/load_kb.py --format rag_json
python src/load_kb.py --format chromadb
python src/load_kb.py --strict
```

### 3. Output file

By default, the loader writes to `ai-engine/data/rag_ready_kb.json`.

## Manual Setup

### 1. Database

Create a PostgreSQL database, for example `epson_helpdesk`, then apply the schema in `database/schema.sql`.

Example with `psql`:

```sh
psql -U postgres -d epson_helpdesk -f database/schema.sql
```

### 2. Backend

```sh
cd backend
npm install
copy .env.example .env
npx prisma migrate dev
npm run dev
```

### 3. AI Engine

Create and activate a Python virtual environment named `.venv`, then install the AI engine dependencies from `ai-engine/requirements.txt`:

```sh
cd ai-engine
python -m venv .venv
.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
copy .env.example .env
python src/chat_service.py
```

If you are using Command Prompt instead of PowerShell:

```bat
.venv\Scripts\activate.bat
```

### 4. Frontend

```sh
cd frontend
npm install
npm run dev
```

## Environment Files

- `backend/.env` should point `DATABASE_URL` to your PostgreSQL database.
- `ai-engine/.env` should configure the AI provider and local LLM settings.
- `frontend/.env.local` can be used to switch between mock API and real API.

## Useful Commands

Backend:

```sh
cd backend
npm run dev
npm run db:migrate
npm run db:seed
npm run db:studio
```

Frontend:

```sh
cd frontend
npm run dev
```

AI Engine:

```sh
cd ai-engine
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python src/chat_service.py
```

Knowledge base export:

```sh
cd ai-engine
.venv\Scripts\Activate.ps1
python src/load_kb.py
```

## Notes

- Keep `DATABASE_URL` only in server-side environment files.
- Ensure the Python environment is activated before installing AI engine dependencies from `ai-engine/requirements.txt`.
- If you use Docker Compose, make sure Docker Desktop is running before starting the stack.