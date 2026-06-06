# AI Engine

## Setup

```sh
python -m venv .venv
.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
copy .env.example .env
python src/chat_service.py
```

## Local LLM Guide

Use Ollama for a fully local setup.

### Models

```sh
ollama pull llama3.2:3b
ollama pull nomic-embed-text
```

### `.env` settings

```env
AI_PROVIDER=ollama
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2:3b
OLLAMA_EMBEDDING_MODEL=nomic-embed-text
```

## Knowledge Base Guide

The loader reads knowledge base rows from PostgreSQL, validates them, and exports a RAG-ready file.

### Run the loader

```sh
.venv\Scripts\Activate.ps1
python src/load_kb.py
```

### Optional flags

```sh
python src/load_kb.py --format rag_json
python src/load_kb.py --format chromadb
python src/load_kb.py --strict
```

### Output

The default export is `data/rag_ready_kb.json`.

## Provider switch

Set `AI_PROVIDER` in `.env`:

- `AI_PROVIDER=ollama` uses local Ollama via `OLLAMA_URL`, `OLLAMA_MODEL`, and `OLLAMA_EMBEDDING_MODEL`.
- `AI_PROVIDER=openai` uses `OPENROUTER_API_KEY` or `OPENAI_API_KEY`, `OPENAI_BASE_URL`, `OPENAI_MODEL`, and `OPENAI_EMBEDDING_MODEL`.

The chat endpoint keeps the same `/chat` payload, but the model provider is selected at startup from `.env`.
