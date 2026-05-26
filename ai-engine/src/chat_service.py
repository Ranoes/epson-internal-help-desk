import json
import warnings
import os
from langchain_community.llms import Ollama
from langchain_community.embeddings import OllamaEmbeddings
from langchain_community.vectorstores import Chroma
from langchain_core.prompts import PromptTemplate
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional
import uvicorn
import requests

warnings.filterwarnings("ignore")

# Konfigurasi Path & Model
CHROMA_DB_DIR = "chroma_db"
LLM_MODEL = "qwen3.5:2b" # Disesuaikan ke Qwen yang tersedia (misal: qwen2.5:1.5b atau qwen2.5:3b)
EMBEDDING_MODEL = "nomic-embed-text"
THRESHOLD_SCORE = 0.55  # Sedikit diturunkan agar chatbot lebih berani menjawab
CLARIFICATION_THRESHOLD = 0.45 # Di bawah ini baru eskalasi
EVAL_DATA_PATH = os.path.join("data", "eval_dataset.json")

app = FastAPI()

class ChatRequest(BaseModel):
    userId: str
    sessionId: str
    message: str
    imageBase64: Optional[str] = None
    engine: str = "ollama-local"
    complexity: float = 0.0

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
    Fungsi utama yang menyatukan RAG, Prompt Engineering, 
    dan Confidence Scoring & Escalation Logic.
    """
    # Ambil top 3 dokumen beserta relevance score-nya (0.0 - 1.0)
    docs_and_scores = vectorstore.similarity_search_with_relevance_scores(query, k=3)
    
    # Ambil skor tertinggi dari dokumen pertama (jika ada)
    highest_score = docs_and_scores[0][1] if docs_and_scores else 0.0
    
    # Menyiapkan kerangka respons JSON
    api_response = {
        "query": query,
        "confidence_score": round(highest_score, 2),
        "escalated": False,
        "response_text": "",
        "sources": []
    }
    
    # LOGIKA BARU: Clarification vs Escalation
    if highest_score < CLARIFICATION_THRESHOLD:
        # Jika skor sangat rendah (benar-benar tidak nyambung), baru eskalasi
        api_response["escalated"] = True
        api_response["response_text"] = (
            "Maaf, saya tidak menemukan informasi yang relevan di panduan resmi Epson "
            "untuk menyelesaikan masalah Anda. Saya sarankan untuk mengeskalasi tiket ini "
            "ke agen manusia (Customer Support) agar mendapat penanganan lebih lanjut."
        )
        return api_response
    
    elif highest_score < THRESHOLD_SCORE:
        # Jika skor menengah (mungkin nyambung tapi ragu), minta klarifikasi
        api_response["escalated"] = False
        # Gunakan prompt singkat untuk meminta detail tambahan
        clarification_prompt = (
            f"Saya menemukan beberapa panduan yang mungkin berkaitan dengan Epson, "
            f"namun saya ingin memastikan agar memberikan solusi yang tepat. "
            f"Bisakah Anda menjelaskan lebih detail mengenai pesan error yang muncul atau "
            f"tipe printer yang Anda gunakan? (Saat ini saya mendeteksi '{query}')"
        )
        api_response["response_text"] = clarification_prompt
        return api_response

    # Jika skor >= THRESHOLD_SCORE (0.55), proses dengan RAG normal
    context_text = "\n\n".join([doc.page_content for doc, score in docs_and_scores])
    
    # Menyimpan sumber dokumen untuk transparansi (Gunakan .metadata.get('id', 'unknown'))
    for doc, score in docs_and_scores:
        # Cek metadata 'id' atau 'title' agar tidak muncul 'unknown_kb'
        kb_id = doc.metadata.get("id") or doc.metadata.get("title") or "unknown_kb"
        api_response["sources"].append(kb_id)

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

@app.post("/chat")
async def chat_endpoint(request: ChatRequest):
    try:
        if "openai" in request.engine:
            # Handle OpenAI routing if needed (needs implementation of generate_openai)
            # For PoC, we primarily use the RAG pipeline with local Ollama
            pass
        
        # Use our existing RAG-Ollama pipeline
        response = generate_helpdesk_response(request.message, v_store, llama_model)
        
        # Add engine metadata
        response["engine_used"] = request.engine
        
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    print("="*60)
    print("MENGAKSES SMART HELPDESK CHATBOT (Fase 3 & 4)")
    print("="*60)
    
    v_store, llama_model = setup_chat_environment()
    
    # Nonaktifkan sscrip pengujian otomatis agar tidak mengganggu jalannya server
    """
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
    """

    # Jalankan FastAPI Server
    uvicorn.run(app, host="0.0.0.0", port=8000)