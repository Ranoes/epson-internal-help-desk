# Frontend Sprint 1 Checklist

Purpose: execute the first frontend sprint with clear deliverables aligned to API contract and project context.

## Sprint Goal

Deliver a working internal web frontend with:

1. Login flow
2. Core chat flow (send message, show response, show escalation)
3. Chat history loading
4. Role-based route protection foundation

## Scope Boundary (Sprint 1)

In scope:

1. `/login`
2. `/chat`
3. Basic shared layout and auth guard
4. API integration for auth and chat endpoints

Out of scope (next sprint):

1. Full admin analytics dashboard visuals
2. Ticket table management UI
3. Full knowledge base CRUD UI

## Preconditions (Can Proceed Without Backend)

1. ✅ Mock data structure understood (see `FRONTEND_MOCK_DATA.md`).
2. ✅ Chat endpoint contract finalized as `/api/chat/message`.
3. ✅ Development can start immediately with mock API.
4. 🔔 Once backend is ready, switch via `NEXT_PUBLIC_USE_MOCK_API=false` in `.env.local`.

## Task Checklist

## A) Project Setup & Mock Infrastructure

1. **Initialize Next.js + TypeScript + Tailwind + ESLint.**
2. **Create mock data infrastructure:**
   - Copy realistic mock responses from `FRONTEND_MOCK_DATA.md` into `src/lib/mockData.ts`.
   - Build API client wrapper in `src/lib/api-client.ts` with mock interceptor (template provided in `FRONTEND_MOCK_DATA.md`).
   - Add `NEXT_PUBLIC_USE_MOCK_API=true` to `.env.local`.
   - Verify mock responses work without backend (delay simulates ~800ms network latency).
3. Add dependencies:
   - axios
   - react-query (or SWR)
   - react-hook-form
   - zustand (or context)
4. Create base folders:
   - `src/app`
   - `src/components`
   - `src/features`
   - `src/lib`
   - `src/types`

Definition of done:

1. App runs locally without TypeScript errors.
2. Base styling and layout render correctly in Chrome and Edge.

## B) Auth Flow

1. Build login page UI at `/login`.
2. Connect form submit to `POST /api/auth/login`.
3. Store auth token + user role in client session storage strategy.
4. Implement redirect after login:
   - `user` -> `/chat`
   - `admin/manager` -> `/chat` (dashboard in later sprint)
5. Add logout action and session clear.

Definition of done:

1. Valid credentials log in successfully.
2. Invalid credentials show clear error message.
3. Refresh behavior matches chosen auth persistence strategy.

## C) Route Protection

1. Add `AuthGuard` to protect `/chat`.
2. Redirect unauthenticated users to `/login`.
3. Add `RoleGuard` utility for future `/admin` routes.

Definition of done:

1. Unauthenticated access to protected pages is blocked.
2. Guard logic is reusable for admin pages next sprint.

## D) Chat UI Core

1. Build chat page shell:
   - message list area
   - input bar
   - send button
2. Add components:
   - `MessageBubbleUser`
   - `MessageBubbleAssistant`
   - `TypingIndicator`
3. Send message to `POST /api/chat/message` with payload:
   - `sessionId`
   - `userId`
   - `message`
   - `imageBase64` (nullable for now)
4. Render assistant response fields:
   - `reply`
   - `confidence`
   - `sources`
   - `escalated`
   - `ticketId` (if escalated)
5. Add UI callout for escalation ticket.

Definition of done:

1. User can send and receive chat messages.
2. Typing/loading state is visible during request.
3. Escalation state is clearly visible with ticket ID if present.

## E) Chat History

1. On chat page load, call `GET /api/chat/history/:sessionId`.
2. Merge history into message list with proper role styling.
3. Handle empty history state.

Definition of done:

1. Existing session history is displayed correctly.
2. No-history state shows informative placeholder.

## F) Error and UX States

1. Add toast notifications for success/error.
2. Add inline retry for failed chat request.
3. Add disabled send button during in-flight request.
4. Add error boundary at app/layout level.

Definition of done:

1. Network/API failures are user-visible and recoverable.
2. UI never silently fails.

## G) API and Types Hardening

1. Centralize HTTP client in `src/lib/api-client.ts`.
2. Define shared types in `src/types/api.ts`.
3. Add runtime-safe response checks where needed.

Definition of done:

1. No endpoint URL duplication across UI code.
2. Type coverage for auth/chat/history responses is complete.

## H) Sprint 1 QA Checklist

Functional checks:

1. Login success and failure path.
2. Protected route redirect behavior.
3. Send chat and receive response.
4. Escalation response shows ticket callout.
5. Load and display chat history.

Non-functional checks:

1. Works on Chrome and Edge.
2. No major layout break on common laptop widths.
3. Error handling works when backend is down.

## Suggested Execution Order (5 Working Days)

1. **Day 1:** Setup + Mock infrastructure + Auth page + API client foundation.
2. **Day 2:** Auth guard + session management + route flow (all with mock data).
3. **Day 3:** Chat UI core + send message integration (with mock responses).
4. **Day 4:** Chat history + escalation callout + source panel basics (using mock history).
5. **Day 5:** UX polish + QA pass + bug fixes (remains mock until backend ready).

## Sprint 1 Exit Criteria

1. Demoable login-to-chat flow end-to-end (using mock data with realistic delays).
2. API-integrated chat with history and escalation handling (mock responses).
3. Stable error/loading states.
4. Mock API client can be easily switched to real backend (one env var change).
5. Clean handoff for Sprint 2 admin pages.
6. **Backend Integration Ready:** once backend team provides test endpoint, flip `NEXT_PUBLIC_USE_MOCK_API=false` and adjust `NEXT_PUBLIC_API_BASE_URL` to live backend—UI should work without code changes.
