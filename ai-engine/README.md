# AI Engine

## Setup

```bash
python -m venv venv
venv\Scripts\activate  # On Windows
pip install -r requirements.txt
cp .env.example .env
# Edit .env as needed
python src/chat_service.py  # Or: uvicorn src.chat_service:app --reload
```

## Provider switch

Set `AI_PROVIDER` in `.env`:

- `AI_PROVIDER=ollama` uses local Ollama via `OLLAMA_URL`, `OLLAMA_MODEL`, and `OLLAMA_EMBEDDING_MODEL`.
- `AI_PROVIDER=openai` uses `OPENROUTER_API_KEY` or `OPENAI_API_KEY`, `OPENAI_BASE_URL`, `OPENAI_MODEL`, and `OPENAI_EMBEDDING_MODEL`.

The chat endpoint keeps the same `/chat` payload, but the model provider is selected at startup from `.env`.
