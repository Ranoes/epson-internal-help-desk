import json
import warnings
from langchain_community.llms import Ollama
from langchain_community.embeddings import OllamaEmbeddings
from langchain_community.vectorstores import Chroma
from langchain_core.prompts import PromptTemplate

warnings.filterwarnings("ignore")

# Konfigurasi Path & Model
CHROMA_DB_DIR = "./chroma_db"
LLM_MODEL = "llama3.2"
EMBEDDING_MODEL = "nomic-embed-text"
THRESHOLD_SCORE = 0.6  # threshold eskalasi
EVAL_DATA_PATH = "ai-engine/data/eval_dataset.json"

def setup_chat_environment():
    """Inisialisasi Vector DB dan LLM Ollama"""
    print("[1/2] Memuat Vector DB (ChromaDB)...")
    embeddings = OllamaEmbeddings(model=EMBEDDING_MODEL)
    vectorstore = Chroma(
        persist_directory=CHROMA_DB_DIR,
        embedding_function=embeddings,
        collection_metadata={"hnsw:space": "cosine"}
    )
    
    print(f"[2/2] Memuat LLM ({LLM_MODEL}) via Ollama...")
    llm = Ollama(model=LLM_MODEL, temperature=0.1) # Temperature 0.1 agar jawaban faktual/tidak kreatif
    
    return vectorstore, llm

def generate_helpdesk_response(query: str, vectorstore, llm):
    """
    Fungsi utama yang menyatukan RAG, Prompt Engineering (Tugas 3), 
    dan Confidence Scoring & Escalation Logic (Tugas 4).
    Nantinya fungsi ini yang akan dipanggil oleh endpoint API Ahmadhani.
    """
    # Ambil top 3 dokumen beserta relevance score-nya (0.0 - 1.0)
    docs_and_scores = vectorstore.similarity_search_with_relevance_scores(query, k=3)
    
    # Ambil skor tertinggi dari dokumen pertama (jika ada)
    highest_score = docs_and_scores[0][1] if docs_and_scores else 0.0
    
    # Menyiapkan kerangka respons JSON untuk API Ahmadhani
    api_response = {
        "query": query,
        "confidence_score": round(highest_score, 2),
        "escalated": False,
        "response_text": "",
        "sources": []
    }
    
    # Logika ekskalasi
    if highest_score < THRESHOLD_SCORE:
        api_response["escalated"] = True
        api_response["response_text"] = (
            "Maaf, saya tidak menemukan informasi yang relevan di panduan resmi Epson "
            "untuk menyelesaikan masalah Anda. Saya sarankan untuk mengeskalasi tiket ini "
            "ke agen manusia (Customer Support) agar mendapat penanganan lebih lanjut."
        )
        return api_response

    # Jika skor >= 0.6, susun context dari dokumen yang ditemukan
    context_text = "\n\n".join([doc.page_content for doc, score in docs_and_scores])
    
    # Menyimpan sumber dokumen untuk transparansi
    for doc, score in docs_and_scores:
        api_response["sources"].append(doc.metadata.get("id", "unknown_kb"))

    # System Prompt Ketat
    prompt_template = """Kamu adalah asisten helpdesk teknis PT. Indonesia Epson Industry.
Jawab HANYA berdasarkan context berikut.
Jika tidak ada informasi relevan dalam context, katakan tidak tahu dan sarankan eskalasi.
Jangan membuat-buat informasi (no hallucination). Jawablah dengan bahasa Indonesia yang profesional, ramah, dan terstruktur.

Context:
{context}

Pertanyaan:
{question}

Jawaban Helpdesk:"""

    prompt = PromptTemplate(template=prompt_template, input_variables=["context", "question"])
    
    # 3. GENERASI JAWABAN OLEH LLM
    final_prompt = prompt.format(context=context_text, question=query)
    response_text = llm.invoke(final_prompt)
    
    api_response["response_text"] = response_text.strip()
    return api_response

if __name__ == "__main__":
    print("="*60)
    print("MENGAKSES SMART HELPDESK CHATBOT (Fase 3 & 4)")
    print("="*60)
    
    v_store, llama_model = setup_chat_environment()
    
    # Mengambil beberapa pertanyaan uji dari Andri untuk testing
    print("\n[Membaca eval_dataset.json untuk pengujian...]")
    with open(EVAL_DATA_PATH, "r", encoding="utf-8") as f:
        eval_data = json.load(f)
    
    test_questions = eval_data.get("eval_dataset", [])
    
    # uji 2 skenario: 1 pertanyaan relevan, 1 pertanyaan ngawur (untuk tes eskalasi)
    scenario_1 = test_questions[0]["question"]
    scenario_2 = "Bagaimana cara memasak rendang daging sapi yang empuk?"
    
    queries_to_test = [scenario_1, scenario_2]
    
    for i, q in enumerate(queries_to_test):
        print(f"\n--- SKENARIO UJI {i+1} ---")
        print(f"User     : {q}")
        
        # Panggil fungsi chat
        result = generate_helpdesk_response(q, v_store, llama_model)
        
        print(f"Bot      : {result['response_text']}")
        print(f"[DEBUG] Confidence : {result['confidence_score']}")
        print(f"[DEBUG] Escalated  : {result['escalated']}")
        print(f"[DEBUG] Sources KB : {result['sources']}")
    
    print("\n" + "="*60)
    print("Selesai! Endpoint siap diintegrasikan dengan POST /api/chat/message")