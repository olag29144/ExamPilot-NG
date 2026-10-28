# ExamPilot NG

A responsive React + Vite starter for ExamPilot NG, a study platform for Nigerian students. This package is a standalone reconstruction, not an exact export of every file in the Floot project.

## Features
- Responsive dashboard and mobile navigation
- Courses and study-material management
- CBT practice quiz with timer, scoring, explanations, and history
- Revision task planner
- Study assistant UI with a server-side AI endpoint
- Local browser persistence for demo courses, materials, tasks, and quiz history
- API key stays on the server in `.env`

## Requirements
- Node.js 18.18+ (Node 20 LTS recommended)
- npm

## Run the website
1. Extract the ZIP.
2. Open the `exampilot-ng` folder in VS Code.
3. In a terminal run:

   ```bash
   npm install
   npm run dev
   ```

4. Open the local URL Vite prints (usually `http://localhost:5173`).

The front end works without an AI key. The AI assistant shows a helpful configuration message until the backend is running and a valid key is configured.

## Enable AI
1. Copy `.env.example` to `.env`.
2. Replace `AI_API_KEY` with a newly generated provider key. Do not reuse a key that has been posted in chat.
3. Confirm `AI_BASE_URL` and `AI_MODEL` match your provider.
4. In another terminal run `npm run server`.
5. The Vite development server proxies `/api` requests to port 8787.

For both servers at once, run `npm run dev:full`.

## Build for deployment
```bash
npm run build
npm run preview
```

The static frontend can be hosted on a static host. The `server/` API must be deployed to a server environment that supports Node.js and environment variables. Do not deploy `.env`.

## Important
This standalone starter uses localStorage for demo data. It is not a production multi-user database/authentication implementation. Add secure authentication, a real database, rate limits, and deployment-specific security before using it with real student accounts.
