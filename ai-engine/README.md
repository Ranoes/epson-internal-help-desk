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
