# ExamPilot NG

**Study smarter. Practise better. Ace your exams.**

An AI-powered exam preparation platform for Nigerian university students. Organise your courses, save lecture notes, get AI explanations grounded in your own material, generate timed practice tests, and track your progress — all in one place.

---

## Features

- **Courses** — create and organise your semester courses
- **Study materials** — paste notes or upload `.txt` / `.md` files
- **AI study buddy** — ask questions grounded in your own notes (server-side, key never exposed to browser)
- **Question generator** — AI-generated MCQs saved to your question bank
- **CBT practice** — timed tests with server-side timing and scoring; answers never sent to the client before submission
- **Results & review** — per-question review, explanations, topic breakdown
- **Performance history** — score trend chart, weak-topic recommendations from real data
- **Revision planner** — task CRUD with due dates, overdue detection, completion tracking
- **Settings** — profile update, password change, logout

---

## Tech stack

| Layer    | Technology |
|----------|-----------|
| Frontend | React 18, React Router v7, Lucide icons |
| Backend  | Node.js, Express 4 |
| Database | SQLite via better-sqlite3 (WAL mode, foreign keys) |
| Auth     | express-session + bcryptjs (sessions stored in SQLite) |
| AI       | OpenAI-compatible API (server-side only) |
| Build    | Vite 6 |

---

## Prerequisites

- **Node.js 18+** (or 20+)
- An **OpenAI-compatible API key** for the AI assistant and question generator (optional — all other features work without it)

---

## Local setup

### 1. Clone and install

```bash
git clone https://github.com/olag29144/ExamPilot-NG.git
cd ExamPilot-NG
npm install
```

### 2. Configure environment variables

Copy the example file and fill in your values:

```bash
cp .env.example .env
```

Open `.env` and set:

```env
# Required
SESSION_SECRET=replace_with_a_long_random_secret_string

# Optional — required only for AI features
AI_API_KEY=your_openai_or_compatible_key
AI_BASE_URL=https://api.openai.com/v1
AI_MODEL=gpt-4o-mini

# Server port (default 3001)
PORT=3001

# Frontend origin for CORS (default shown)
CLIENT_ORIGIN=http://localhost:5173
```

> **Never commit your `.env` file.** It is already in `.gitignore`.

### 3. Run in development

Run both the API server and the Vite dev server together:

```bash
npm run dev:full
```

Or run them separately in two terminals:

```bash
# Terminal 1 — API server (port 3001)
npm run server

# Terminal 2 — Vite dev server (port 5173)
npm run dev
```

Open **http://localhost:5173** in your browser.

### 4. Production build

```bash
npm run build       # compiles frontend to dist/
npm run server      # serves only the API; serve dist/ with a static host or nginx
```

The SQLite database file is created automatically at `data/exampilot.db` on first run. The `data/` directory is gitignored.

---

## Environment variables reference

| Variable        | Required | Description |
|-----------------|----------|-------------|
| `SESSION_SECRET`| Yes      | Long random string used to sign session cookies |
| `PORT`          | No       | API server port (default `3001`) |
| `AI_API_KEY`    | For AI   | Your OpenAI-compatible provider API key |
| `AI_BASE_URL`   | For AI   | API base URL (default `https://api.openai.com/v1`) |
| `AI_MODEL`      | For AI   | Model name (default `gpt-4o-mini`) |
| `CLIENT_ORIGIN` | No       | CORS allowed origin (default `http://localhost:5173`) |

---

## AI features

The AI study buddy and question generator require a valid `AI_API_KEY`. If the key is missing or invalid, all other features (courses, materials, CBT, planner, etc.) continue to work normally. The app shows a clear error message when AI is unavailable — it never returns fake generated content.

All model calls happen on the server. The API key is never included in the browser bundle or client-side code.

---

## Security notes

- Passwords are hashed with bcryptjs (cost factor 12). Plaintext passwords are never stored or logged.
- Sessions are stored server-side in SQLite and signed with `SESSION_SECRET`.
- Every private API endpoint checks ownership server-side — UI hiding is not the only protection.
- CBT scoring and timing are enforced by the server. Correct answers are not sent to the browser before submission.
- Input is validated with Zod on all API endpoints.
- Rate limiting is applied to auth and AI endpoints.
- File uploads accept only `.txt` and `.md` (checked by extension and MIME type), max 1 MB.

---

## Known limitations

- Email addresses cannot be changed after registration in this version.
- Password reset via email is not implemented (no email provider configured).
- PDF, Word, and image file uploads are not supported — notes must be plain text or Markdown.
- The AI question generator requires a paid API key from an OpenAI-compatible provider.
- AI-generated questions are practice material only. They are not official, leaked, or guaranteed exam questions.
- The app has not undergone a formal security audit. Do not use it to store sensitive personal data beyond standard study notes.
