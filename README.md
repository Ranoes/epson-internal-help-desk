# epson-internal-help-desk

## Quick Start (Docker Compose)

1. Copy and edit environment files as needed:
	- `cp backend/.env.example backend/.env`
	- `cp ai-engine/.env.example ai-engine/.env`

2. Build and start all services:
	```sh
	docker-compose up --build
	```

3. Access the apps:
	- Frontend: http://localhost:3000
	- Backend API: http://localhost:3001
	- AI Engine: http://localhost:8000

---

## Manual Setup (Local)

### 1. Database (PostgreSQL)
Start PostgreSQL locally or with Docker. Create a database (e.g., `epson_helpdesk`).

### 2. Backend
```sh
cd backend
npm install
cp .env.example .env  # Edit as needed
npx prisma migrate dev
npm run dev
```

### 3. AI Engine
```sh
cd ai-engine
python -m venv venv
venv\Scripts\activate  # On Windows
pip install -r requirements.txt
cp .env.example .env  # Edit as needed
python src/chat_service.py  # Or: uvicorn src.chat_service:app --reload
```

### 4. Frontend
```sh
cd frontend
npm install
npm run dev
```

---

## Notes
- Ensure all `.env` files are configured with correct URLs and secrets.
- Ollama or OpenAI API key required for AI engine.
- For Docker Compose, ensure Docker Desktop is running.