import warnings
from langchain_core.prompts import PromptTemplate
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional
import uvicorn

from model_provider import create_llm, get_llm_model, get_provider, load_or_build_vectorstore

warnings.filterwarnings("ignore")

# Konfigurasi Path & Model
THRESHOLD_SCORE = 0.55  # Sedikit diturunkan agar chatbot lebih berani menjawab
CLARIFICATION_THRESHOLD = 0.45 # Di bawah ini baru eskalasi
LLM_MODEL = get_llm_model()

app = FastAPI()

VECTORSTORE_CACHE = {}
LLM_CACHE = {}
VECTORSTORE_RELOAD_TOKEN = None
SESSION_FOLLOWUP_STATE = {}

class ChatRequest(BaseModel):
    userId: str
    sessionId: str
    message: str
    imageBase64: Optional[str] = None
    chatHistory: Optional[list[dict]] = None
    provider: Optional[str] = None
    engine: str = "ollama-local"
    complexity: float = 0.0


class ReloadKnowledgeRequest(BaseModel):
    provider: Optional[str] = None

def resolve_request_provider(request: ChatRequest) -> str:
    if request.provider:
        return get_provider(request.provider)

    engine = (request.engine or "").lower()
    if "openrouter" in engine or "openai" in engine:
        return "openai"
    return get_provider()


def setup_chat_environment(provider: str | None = None):
    """Inisialisasi Vector DB dan LLM sesuai provider di .env"""
    active_provider = get_provider(provider)
    if active_provider in VECTORSTORE_CACHE and active_provider in LLM_CACHE and VECTORSTORE_RELOAD_TOKEN == active_provider:
        return VECTORSTORE_CACHE[active_provider], LLM_CACHE[active_provider]

    print("[1/2] Memuat Vector DB (ChromaDB)...")
    vectorstore = load_or_build_vectorstore(active_provider)

    print(f"[2/2] Memuat LLM ({LLM_MODEL}) via {active_provider}...")
    llm = create_llm(active_provider, temperature=0.1) # Temperature 0.1 agar jawaban faktual/tidak kreatif

    VECTORSTORE_CACHE[active_provider] = vectorstore
    LLM_CACHE[active_provider] = llm
    globals()["VECTORSTORE_RELOAD_TOKEN"] = active_provider
    
    return vectorstore, llm


def refresh_vectorstore(provider: str | None = None):
    active_provider = get_provider(provider)
    vectorstore = load_or_build_vectorstore(active_provider, force_rebuild=True)
    VECTORSTORE_CACHE[active_provider] = vectorstore
    globals()["VECTORSTORE_RELOAD_TOKEN"] = active_provider
    return vectorstore


def is_small_talk_or_greeting(query: str) -> bool:
    text = (query or "").strip().lower()
    short_text = len(text) <= 6
    greeting_words = {
        "halo",
        "hai",
        "hi",
        "test",
        "testing",
        "pagi",
        "siang",
        "sore",
        "malam",
        "hello",
    }
    return short_text or text in greeting_words


def wants_direct_escalation(query: str) -> bool:
    text = (query or "").lower()
    escalation_words = (
        "buat ticket",
        "buat tiket",
        "eskalasi",
        "eskalate",
        "human",
        "admin",
        "petugas",
        "cs",
        "customer support",
    )
    return any(word in text for word in escalation_words)

def generate_helpdesk_response(
    query: str,
    vectorstore,
    llm,
    session_id: str | None = None,
    chat_history: Optional[list[dict]] = None,
):
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
        "ticket_suggestion": None,
        "sources": []
    }
    
    session_key = session_id or "default"
    session_state = SESSION_FOLLOWUP_STATE.get(session_key, {"clarification_count": 0})

    if is_small_talk_or_greeting(query):
        SESSION_FOLLOWUP_STATE[session_key] = {"clarification_count": 0}
        api_response["response_text"] = (
            "Halo, ada yang bisa aku bantu terkait masalah kerja atau equipment Epson? "
            "Coba kasih tahu gejala, pesan error, atau nama mesinnya ya."
        )
        return api_response

    if wants_direct_escalation(query):
        SESSION_FOLLOWUP_STATE[session_key] = {"clarification_count": 0}
        api_response["escalated"] = True
        api_response["response_text"] = (
            "Oke, aku lanjutkan ke eskalasi. Klik tombol Buat Ticket Eskalasi supaya admin bisa ambil alih ya."
        )
        api_response["ticket_suggestion"] = "Buat Ticket Eskalasi"
        return api_response

    # LOGIKA BARU: Clarification vs Escalation
    if highest_score < CLARIFICATION_THRESHOLD:
        clarification_count = int(session_state.get("clarification_count", 0)) + 1

        if clarification_count < 2:
            SESSION_FOLLOWUP_STATE[session_key] = {"clarification_count": clarification_count}
            api_response["response_text"] = (
                "Aku belum nemu jawaban yang pas dari knowledge base. "
                "Biar aku cek lebih tepat, bisa kirim model mesin, pesan error, atau gejala yang muncul?"
            )
            return api_response

        SESSION_FOLLOWUP_STATE[session_key] = {"clarification_count": 0}
        api_response["escalated"] = True
        api_response["response_text"] = (
            "Aku masih belum dapat jawaban yang cocok walau sudah coba cocokkan dengan knowledge base. "
            "Sekarang baru aku arahkan ke eskalasi. Klik tombol Buat Ticket Eskalasi ya."
        )
        api_response["ticket_suggestion"] = "Buat Ticket Eskalasi"
        return api_response
    
    elif highest_score < THRESHOLD_SCORE:
        # Jika skor menengah (mungkin nyambung tapi ragu), minta klarifikasi
        api_response["escalated"] = False
        SESSION_FOLLOWUP_STATE[session_key] = {"clarification_count": 0}
        # Gunakan prompt singkat untuk meminta detail tambahan
        clarification_prompt = (
            f"Kayaknya ada kemungkinan nyambung, tapi aku butuh 1 detail lagi biar gak salah arah. "
            f"Boleh sebutin pesan error yang muncul, model mesin, atau gejala utamanya? "
            f"Kalau bisa, kirim juga langkah yang sudah kamu coba."
        )
        api_response["response_text"] = clarification_prompt
        return api_response

    # Jika skor >= THRESHOLD_SCORE (0.55), proses dengan RAG normal
    context_text = "\n\n".join([doc.page_content for doc, score in docs_and_scores])
    history_text = ""
    if chat_history:
        safe_turns = chat_history[-8:]
        history_lines = []
        for turn in safe_turns:
            role = str(turn.get("role", "user")).strip().lower()
            content = str(turn.get("content", "")).strip()
            if not content:
                continue
            speaker = "Karyawan" if role == "user" else "Asisten"
            history_lines.append(f"- {speaker}: {content}")
        history_text = "\n".join(history_lines)
    
    # Menyimpan sumber dokumen untuk transparansi (Gunakan .metadata.get('id', 'unknown'))
    for doc, score in docs_and_scores:
        # Cek metadata 'id' atau 'title' agar tidak muncul 'unknown_kb'
        kb_id = doc.metadata.get("id") or doc.metadata.get("title") or "unknown_kb"
        api_response["sources"].append(kb_id)

    # System Prompt Ketat
    prompt_template = """Kamu adalah customer service internal yang ramah, santai, dan profesional untuk pegawai manufaktur Epson.

ATURAN MENJAWAB:
- Jawab hanya berdasarkan konteks (dokumen KB) yang disediakan di bagian "KONTEKS".
- Perhatikan "RIWAYAT SESI" untuk menjaga konteks percakapan sebelumnya.
- Gaya bahasa santai profesional, pakai kata "aku" dan "kamu".
- Kalau bisa jawab, buka dengan ringkas lalu beri langkah berurutan bernomor.
- Kalau perlu info tambahan, tanya satu hal paling penting dulu, jangan banyak sekaligus.
- Kalau masalah tidak ada di knowledge base, bilang dengan jujur dan arahkan ke tombol "Buat Ticket Eskalasi".
- Rapikan format jawaban: pakai judul singkat, poin pendek, dan langkah yang mudah dibaca.

KONTEKS:
{context}

RIWAYAT SESI:
{history}

PERTANYAAN:
{question}

Jawaban Helpdesk:"""

    prompt = PromptTemplate(template=prompt_template, input_variables=["context", "history", "question"])
    
    # 3. GENERASI JAWABAN OLEH LLM
    final_prompt = prompt.format(context=context_text, history=history_text, question=query)
    response_text = llm.invoke(final_prompt)
    
    api_response["response_text"] = response_text.strip()
    return api_response

@app.post("/chat")
async def chat_endpoint(request: ChatRequest):
    try:
        provider = resolve_request_provider(request)
        vectorstore, llm = setup_chat_environment(provider)
        response = generate_helpdesk_response(
            request.message,
            vectorstore,
            llm,
            request.sessionId,
            request.chatHistory,
        )
        
        # Add engine metadata
        response["engine_used"] = request.engine
        response["provider_used"] = provider
        
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/reload-knowledge")
async def reload_knowledge(request: ReloadKnowledgeRequest):
    try:
        provider = get_provider(request.provider)
        vectorstore = refresh_vectorstore(provider)
        return {
            "success": True,
            "provider_used": provider,
            "knowledge_count": len(vectorstore.get().get("ids", [])),
        }
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