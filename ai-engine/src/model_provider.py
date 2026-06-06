import os
import json
from typing import List

from dotenv import load_dotenv
from langchain_community.embeddings import OllamaEmbeddings
from langchain_community.llms import Ollama
from langchain_community.vectorstores import Chroma
from langchain_core.documents import Document
from openai import OpenAI
import psycopg
from psycopg.rows import dict_row

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
load_dotenv(os.path.join(BASE_DIR, ".env"), override=True)


def _env(name: str, default: str = "") -> str:
    return os.getenv(name, default).strip()


def get_provider(provider: str | None = None) -> str:
    provider_value = provider if provider is not None else _env("AI_PROVIDER", "ollama")
    provider_value = str(provider_value).lower().strip()
    if provider_value in {"openai", "openrouter", "api", "api-key", "api_key"}:
        return "openai"
    return "ollama"


def get_llm_model(provider: str | None = None) -> str:
    if get_provider(provider) == "openai":
        return _env("OPENAI_MODEL", "gpt-4o-mini")
    return _env("OLLAMA_MODEL", "llama3.2:3b")


def get_embedding_model(provider: str | None = None) -> str:
    if get_provider(provider) == "openai":
        return _env("OPENAI_EMBEDDING_MODEL", "text-embedding-3-small")
    return _env("OLLAMA_EMBEDDING_MODEL", "nomic-embed-text")


def get_chroma_dir(provider: str | None = None) -> str:
    def _resolve_directory(value: str) -> str:
        return value if os.path.isabs(value) else os.path.join(BASE_DIR, value)

    if get_provider(provider) == "openai":
        return _resolve_directory(_env("OPENAI_CHROMA_DB_DIR", "chroma_db_openai"))
    return _resolve_directory(_env("OLLAMA_CHROMA_DB_DIR", "chroma_db"))


def get_ollama_base_url() -> str:
    return _env("OLLAMA_URL", "http://localhost:11434")


def get_openai_api_key() -> str:
    return _env("OPENROUTER_API_KEY") or _env("OPENAI_API_KEY")


def load_rag_documents() -> List[Document]:
    database_url = _env("DATABASE_URL")
    if not database_url:
        raise ValueError("DATABASE_URL harus diisi untuk memuat knowledge base dari PostgreSQL")

    if "connect_timeout=" not in database_url:
        database_url = f"{database_url}{'&' if '?' in database_url else '?'}connect_timeout=5"

    query = """
        SELECT id, title, category, subcategory, content, tags, source_doc, updated_at
        FROM knowledge_base
        ORDER BY updated_at DESC, created_at DESC
    """

    documents: List[Document] = []
    with psycopg.connect(database_url, row_factory=dict_row) as connection:
        with connection.cursor() as cursor:
            cursor.execute(query)
            rows = cursor.fetchall()

    for item in rows:
        steps = []
        for raw_line in str(item["content"]).split("\n"):
            line = raw_line.strip()
            if line and line[0].isdigit():
                steps.append(line.split(". ", 1)[-1] if ". " in line else line)

        content_lines = [
            f"[{str(item['category']).upper().replace('_', ' ')}] {item['title']}",
            "",
            f"Gejala: {extract_section_value(item['content'], 'Gejala')}",
            "",
            f"Penyebab: {extract_section_value(item['content'], 'Penyebab')}",
            "",
            "Langkah Penyelesaian:",
            *[f"  {index + 1}. {step}" for index, step in enumerate(steps)],
        ]

        full_text = "\n".join(content_lines).strip()
        documents.append(
            Document(
                page_content=full_text,
                metadata={
                    "id": item["id"],
                    "title": item["title"],
                    "category": item["category"],
                    "subcategory": item.get("subcategory"),
                    "tags": item.get("tags") or [],
                    "source_doc": item.get("source_doc"),
                    "updated_at": item.get("updated_at").isoformat() if item.get("updated_at") else None,
                },
            )
        )
    return documents


def extract_section_value(content: str, section_name: str) -> str:
    prefix = f"{section_name}:"
    for raw_line in str(content).split("\n"):
        line = raw_line.strip()
        if line.startswith(prefix):
            return line.replace(prefix, "", 1).strip()
    return ""


class OpenAIEmbeddingsAdapter:
    def __init__(self, model: str, api_key: str, base_url: str = ""):
        client_kwargs = {"api_key": api_key}
        if base_url:
            client_kwargs["base_url"] = base_url
        self.client = OpenAI(**client_kwargs)
        self.model = model

    def _embed(self, texts: List[str]) -> List[List[float]]:
        if not texts:
            return []
        response = self.client.embeddings.create(model=self.model, input=texts)
        return [item.embedding for item in response.data]

    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        return self._embed(texts)

    def embed_query(self, text: str) -> List[float]:
        embeddings = self._embed([text])
        return embeddings[0] if embeddings else []


class OpenAIChatAdapter:
    def __init__(self, model: str, api_key: str, base_url: str = "", temperature: float = 0.1):
        client_kwargs = {"api_key": api_key}
        if base_url:
            client_kwargs["base_url"] = base_url
        self.client = OpenAI(**client_kwargs)
        self.model = model
        self.temperature = temperature

    def invoke(self, prompt: str) -> str:
        response = self.client.chat.completions.create(
            model=self.model,
            messages=[{"role": "user", "content": prompt}],
            temperature=self.temperature,
        )
        return response.choices[0].message.content or ""


def create_embeddings(provider: str | None = None):
    active_provider = get_provider(provider)
    if active_provider == "openai":
        api_key = get_openai_api_key()
        if not api_key:
            raise ValueError("OPENROUTER_API_KEY harus diisi saat AI_PROVIDER=openai")
        return OpenAIEmbeddingsAdapter(
            model=get_embedding_model(active_provider),
            api_key=api_key,
            base_url=_env("OPENAI_BASE_URL", "https://openrouter.ai/api/v1"),
        )

    return OllamaEmbeddings(
        model=get_embedding_model(active_provider),
        base_url=get_ollama_base_url(),
    )


def create_llm(provider: str | None = None, temperature: float = 0.1):
    active_provider = get_provider(provider)
    if active_provider == "openai":
        api_key = get_openai_api_key()
        if not api_key:
            raise ValueError("OPENROUTER_API_KEY harus diisi saat AI_PROVIDER=openai")
        return OpenAIChatAdapter(
            model=get_llm_model(active_provider),
            api_key=api_key,
            base_url=_env("OPENAI_BASE_URL", "https://openrouter.ai/api/v1"),
            temperature=temperature,
        )

    return Ollama(
        model=get_llm_model(active_provider),
        base_url=get_ollama_base_url(),
        temperature=temperature,
    )


def load_or_build_vectorstore(provider: str | None = None, force_rebuild: bool = False):
    active_provider = get_provider(provider)
    chroma_dir = get_chroma_dir(active_provider)
    embeddings = create_embeddings(active_provider)
    has_existing_store = os.path.exists(os.path.join(chroma_dir, "chroma.sqlite3"))

    if has_existing_store and not force_rebuild:
        return Chroma(
            persist_directory=chroma_dir,
            embedding_function=embeddings,
            collection_metadata={"hnsw:space": "cosine"},
        )

    documents = load_rag_documents()
    return Chroma.from_documents(
        documents=documents,
        embedding=embeddings,
        persist_directory=chroma_dir,
        collection_metadata={"hnsw:space": "cosine"},
    )