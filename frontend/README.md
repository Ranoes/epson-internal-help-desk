# Frontend Setup and Installation

This is the Next.js frontend for the Smart Helpdesk Chatbot.

## Quick Start

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Development Mode (with Mock API)

The frontend is pre-configured to use mock data, so you can develop without the backend:

```bash
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000) in your browser.

### Demo Credentials

- **Username:** `karyawan001`
- **Password:** `password123`

### 3. Switch to Real Backend

Once the backend is ready, update `.env.local`:

```env
NEXT_PUBLIC_USE_MOCK_API=false
NEXT_PUBLIC_API_BASE_URL=http://your-backend-server:3001/api
```

Then restart the dev server.

## Project Structure

```
frontend/
├── src/
│   ├── app/              # Next.js App Router
│   │   ├── page.tsx      # Home (redirects to /login)
│   │   ├── layout.tsx    # Root layout
│   │   ├── globals.css   # Global styles
│   │   ├── login/
│   │   │   └── page.tsx  # Login page
│   │   └── chat/
│   │       └── page.tsx  # Chat page
│   ├── components/
│   │   └── chat/
│   │       ├── MessageBubble.tsx
│   │       ├── InputBar.tsx
│   │       └── TypingIndicator.tsx
│   ├── lib/
│   │   ├── api-client.ts    # HTTP client with mock interceptor
│   │   └── mockData.ts      # Mock responses
│   └── types/
│       └── api.ts           # TypeScript types
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── next.config.js
└── .env.local
```

## Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **HTTP Client:** Axios
- **Form Handling:** React Hook Form
- **State Management:** Zustand (or Context API)
- **Data Fetching:** React Query (optional for future upgrades)

## Build and Deployment

```bash
# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint

# Type check
npm run type-check
```

## API Integration

The frontend is built to match the API contract in [FRONTEND_REFERENCE.md](../references/FRONTEND_REFERENCE.md).

All endpoints are in `src/lib/api-client.ts` and use types from `src/types/api.ts`.

### Key Endpoints

- `POST /api/auth/login` - User authentication
- `POST /api/chat/message` - Send chat message
- `GET /api/chat/history/:sessionId` - Get chat history
- `GET /api/analytics/summary` - Analytics data
- `GET /api/tickets` - Tickets list

## Features (Sprint 1)

- ✅ Login and authentication
- ✅ Chat interface with message sending
- ✅ Chat history loading
- ✅ Escalation handling
- ✅ Mock data support for independent development
- ✅ Route protection and role-based access foundation

## Next Steps (Sprint 2)

- Admin dashboard with analytics
- Ticket management UI
- Knowledge base management interface
- Full role-based access control

## Development Notes

- The mock API adds ~800ms delay to simulate realistic network conditions.
- All mock data is realistic and matches the API contract.
- Switching between mock and real API requires only changing one environment variable.
- Error handling and loading states are in place for production readiness.
