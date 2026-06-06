"""
load_kb.py - Knowledge Base Loader untuk RAG Pipeline
======================================================
Tugas 3: Data Pipeline ke Vector DB
Author  : Kevin Alif Mahendra | NIM: 195150200111063
Project : Smart Helpdesk AI Chatbot - Epson ET-2400

Deskripsi:
    Load knowledge base dari PostgreSQL, validasi semua field,
    output ke format yang dibutuhkan untuk RAG pipeline.

Cara pakai:
    python load_kb.py
    python load_kb.py --output custom.json
    python load_kb.py --format chromadb
    python load_kb.py --strict
"""

import json, os, sys, argparse, hashlib
from datetime import datetime
from typing import Optional

from dotenv import load_dotenv
import psycopg
from psycopg.rows import dict_row

BASE_DIR        = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
load_dotenv(os.path.join(BASE_DIR, ".env"), override=True)
OUTPUT_PATH     = os.path.join(BASE_DIR, "data", "rag_ready_kb.json")
DATABASE_URL    = os.getenv("DATABASE_URL", "")
REQUIRED_FIELDS = ["id", "title", "category", "content"]
VALID_CATEGORIES = {
    "manufacturing",
    "production_line",
    "quality_control",
    "equipment_setup",
    "maintenance",
    "safety",
    "logistics",
}


def validate_entry(entry: dict, index: int) -> list:
    errors = []
    for field in REQUIRED_FIELDS:
        if field not in entry:
            errors.append(f"[entry #{index}] Missing field: '{field}'")
        elif not entry[field]:
            errors.append(f"[entry #{index}] Field '{field}' is empty")

    if "id" in entry and not str(entry["id"]).startswith("kb_"):
        errors.append(f"[entry #{index}] ID '{entry['id']}' harus dimulai dengan 'kb_'")

    if "category" in entry and entry["category"] not in VALID_CATEGORIES:
        errors.append(f"[entry #{index}] Kategori '{entry['category']}' tidak valid. Harus: {VALID_CATEGORIES}")

    if "content" in entry and entry["content"]:
        for kw in ["Gejala", "Penyebab", "Langkah"]:
            if kw not in entry["content"]:
                errors.append(f"[entry #{index}] Content tidak memiliki bagian '{kw}'")

    if "tags" in entry and entry["tags"] is not None and not isinstance(entry["tags"], list):
        errors.append(f"[entry #{index}] Field 'tags' harus berupa list")

    return errors


def validate_all(entries: list) -> tuple:
    all_errors, ids_seen = [], {}
    for i, entry in enumerate(entries):
        all_errors.extend(validate_entry(entry, i + 1))
        eid = entry.get("id", "")
        if eid in ids_seen:
            all_errors.append(f"[entry #{i+1}] Duplikasi ID '{eid}' (pertama di entry #{ids_seen[eid]})")
        else:
            ids_seen[eid] = i + 1
    problem_indices = set(e.split("entry #")[1].split("]")[0] for e in all_errors if "entry #" in e)
    return all_errors, len(entries) - len(problem_indices)


def fetch_knowledge_base_rows(database_url: str) -> list:
    if not database_url:
        raise ValueError("DATABASE_URL harus diisi agar loader bisa membaca PostgreSQL.")

    if "connect_timeout=" not in database_url:
        database_url = f"{database_url}{'&' if '?' in database_url else '?'}connect_timeout=5"

    query = """
        SELECT id, title, category, subcategory, content, tags, source_doc, created_at, updated_at
        FROM knowledge_base
        ORDER BY created_at ASC
    """
    with psycopg.connect(database_url, row_factory=dict_row) as connection:
        with connection.cursor() as cursor:
            cursor.execute(query)
            return cursor.fetchall()


def parse_content_sections(content: str) -> dict:
    sections = {"gejala": "", "penyebab": "", "langkah": []}
    current = None
    for line in content.split("\n"):
        line = line.strip()
        if line.startswith("Gejala:"):
            current = "gejala"
            sections["gejala"] = line.replace("Gejala:", "").strip()
        elif line.startswith("Penyebab:"):
            current = "penyebab"
            sections["penyebab"] = line.replace("Penyebab:", "").strip()
        elif line.startswith("Langkah:"):
            current = "langkah"
        elif current == "langkah" and line and line[0].isdigit():
            step_text = line.split(". ", 1)[-1] if ". " in line else line
            sections["langkah"].append(step_text)
        elif current in ("gejala", "penyebab") and line:
            sections[current] += " " + line
    return sections


def build_rag_document(entry: dict, chunk_size: int = 512) -> dict:
    sections = parse_content_sections(entry.get("content", ""))
    full_text = (
        f"[{entry.get('category','').upper().replace('_',' ')}] "
        f"{entry.get('title','')}\n\n"
        f"Gejala: {sections['gejala']}\n\n"
        f"Penyebab: {sections['penyebab']}\n\n"
        f"Langkah Penyelesaian:\n" +
        "\n".join(f"  {i+1}. {s}" for i, s in enumerate(sections["langkah"]))
    )
    content_hash = hashlib.md5(full_text.encode()).hexdigest()[:8]
    return {
        "id"            : entry["id"],
        "chunk_id"      : f"{entry['id']}_{content_hash}",
        "document"      : full_text,
        "metadata"      : {
            "title"      : entry.get("title", ""),
            "category"   : entry.get("category", ""),
            "subcategory": entry.get("subcategory", ""),
            "tags"       : entry.get("tags", []),
            "source_doc" : entry.get("source_doc", ""),
            "last_updated": entry.get("last_updated", ""),
            "gejala"     : sections["gejala"],
            "penyebab"   : sections["penyebab"],
            "n_steps"    : len(sections["langkah"]),
        },
        "embedding_text": full_text[:chunk_size],
    }


def transform_for_chromadb(rag_docs: list) -> dict:
    return {
        "ids"       : [d["chunk_id"] for d in rag_docs],
        "documents" : [d["document"] for d in rag_docs],
        "metadatas" : [d["metadata"] for d in rag_docs],
    }


def load_and_process(database_url=DATABASE_URL, output_path=OUTPUT_PATH,
                     output_format="rag_json", strict=False) -> Optional[dict]:
    print("=" * 60)
    print("  KB Loader - Smart Helpdesk RAG Pipeline")
    print("  Kevin Alif Mahendra | 195150200111063")
    print("=" * 60)

    print("\n[1/4] Loading knowledge base dari PostgreSQL...")
    try:
        rows = fetch_knowledge_base_rows(database_url)
    except Exception as error:
        print(f"  ERROR: Tidak bisa membaca PostgreSQL: {error}")
        return None

    entries = []
    for row in rows:
        entries.append({
            "id": row["id"],
            "title": row["title"],
            "category": row["category"],
            "subcategory": row.get("subcategory"),
            "content": row["content"],
            "tags": row.get("tags") or [],
            "source_doc": row.get("source_doc") or "",
            "last_updated": row.get("updated_at").isoformat() if row.get("updated_at") else "",
        })
    print(f"  OK: Berhasil load {len(entries)} entri")

    print(f"\n[2/4] Validasi semua field ...")
    all_errors, valid_count = validate_all(entries)
    if all_errors:
        print(f"  WARN: Ditemukan {len(all_errors)} masalah:")
        for err in all_errors[:10]:
            print(f"     {err}")
        if len(all_errors) > 10:
            print(f"     ... dan {len(all_errors)-10} masalah lainnya")
        if strict:
            print("\n  ERROR: Mode strict aktif - proses dihentikan.")
            return None
    else:
        print(f"  OK: Semua {len(entries)} entri valid!")

    print(f"\n[3/4] Transform ke format RAG ({output_format}) ...")
    rag_docs = [build_rag_document(e) for e in entries]
    cat_counts = {}
    for doc in rag_docs:
        cat = doc["metadata"]["category"]
        cat_counts[cat] = cat_counts.get(cat, 0) + 1
    print("  Distribusi kategori:")
    for cat, count in sorted(cat_counts.items()):
        print(f"    - {cat:<20} : {count} entri")

    print(f"\n[4/4] Menyimpan output ke: {output_path}")
    if output_format == "chromadb":
        output_data = transform_for_chromadb(rag_docs)
        output_data["_meta"] = {
            "generated_at": datetime.now().isoformat(),
            "source": database_url, "total_docs": len(rag_docs),
            "format": "chromadb_batch",
            "created_by": "Kevin Alif Mahendra (195150200111063)",
        }
    else:
        output_data = {
            "metadata": {
                "generated_at": datetime.now().isoformat(),
                "source": database_url,
                "total_docs": len(rag_docs),
                "format": "rag_json", "validation_errors": len(all_errors),
                "created_by": "Kevin Alif Mahendra (195150200111063)",
            },
            "documents": rag_docs,
        }
    os.makedirs(os.path.dirname(output_path) or ".", exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(output_data, f, ensure_ascii=False, indent=2)
    print(f"  OK: Output tersimpan ({os.path.getsize(output_path):,} bytes)")
    print("\n" + "=" * 60)
    print(f"  SELESAI: {len(rag_docs)} dokumen siap untuk RAG pipeline.")
    print("=" * 60 + "\n")
    return output_data


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Load KB untuk RAG pipeline Epson ET-2400")
    parser.add_argument("--database-url", default=DATABASE_URL)
    parser.add_argument("--output", default=OUTPUT_PATH)
    parser.add_argument("--format", default="rag_json", choices=["rag_json", "chromadb"])
    parser.add_argument("--strict", action="store_true")
    args = parser.parse_args()
    result = load_and_process(args.database_url, args.output, args.format, args.strict)
    sys.exit(0 if result else 1)
