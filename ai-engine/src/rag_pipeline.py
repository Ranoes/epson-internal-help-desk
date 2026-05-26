import json
import os
from langchain_core.documents import Document
from langchain_community.embeddings import OllamaEmbeddings
from langchain_community.vectorstores import Chroma

RAG_DATA_PATH = os.path.join("data", "rag_ready_kb.json")
CHROMA_DB_DIR = "chroma_db"

def build_vector_store():
    print("[1/3] Memuat file rag_ready_kb.json...")
    if not os.path.exists(RAG_DATA_PATH):
        raise FileNotFoundError(f"File {RAG_DATA_PATH} tidak ditemukan.")
        
    with open(RAG_DATA_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)
    
    # Memuat dokumen (Tugas 2a & 2b)
    documents = []
    for item in data.get("documents", []):
        doc = Document(
            page_content=item["document"], 
            metadata=item["metadata"]      
        )
        documents.append(doc)
    
    print(f"      Berhasil memuat {len(documents)} dokumen RAG.")

    # Setup Embedding (Tugas 2c)
    print("[2/3] Inisialisasi model embedding 'nomic-embed-text' via Ollama...")
    embeddings = OllamaEmbeddings(model="nomic-embed-text")

    # Simpan ke ChromaDB (Tugas 2d)
    print("[3/3] Memproses vektor dan menyimpan ke ChromaDB...")
    vectorstore = Chroma.from_documents(
        documents=documents,
        embedding=embeddings,
        persist_directory=CHROMA_DB_DIR,
        collection_metadata={"hnsw:space": "cosine"}
    )
    
    print("\n[V] Database Vektor (ChromaDB) berhasil dibuat di direktori lokal!")
    return vectorstore

def get_retriever(vectorstore):
    # Setup Retriever (Tugas 2e)
    return vectorstore.as_retriever(search_kwargs={"k": 3})

if __name__ == "__main__":
    # jalankan pipeline
    v_store = build_vector_store()
    retriever = get_retriever(v_store)
    
    # uji coba pencarian
    print("\n" + "="*50)
    print("MENGUJI RETRIEVER")
    print("="*50)
    
    test_query = "Bagaimana cara membersihkan nozzle printer Epson ET-2400 yang tersumbat?"
    print(f"Pertanyaan uji: '{test_query}'\n")
    
    results = retriever.invoke(test_query)
    
    for i, res in enumerate(results):
        print(f"--- Top {i+1} Dokumen ---")
        print(f"Judul    : {res.metadata.get('title')}")
        print(f"Kategori : {res.metadata.get('category')}")
        print(f"Isi      : {res.page_content[:150]}...\n")