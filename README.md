# NovaTech Blog + Interview Platform

Full-stack project with:
- Frontend: Next.js (App Router)
- Backend: Express + MongoDB + Groq API

This README focuses on **clone/setup/run/deploy commands** and required environment configuration.

## 1. Prerequisites

Install these first:
- Node.js 20+ (recommended)
- npm 10+
- MongoDB (local, if running local DB)

Check versions:

```bash
node -v
npm -v
```

## 2. Clone On A New Device

```bash
git clone <your-repo-url>
cd blog
```

## 3. Environment Setup

### Backend env

Copy and edit:

```bash
cd backend
cp .env.example .env
```

Set values in `backend/.env`:
- `NODE_ENV=development` for local
- `MONGODB_URI_LOCAL` for local mongo
- `MONGODB_URI_LIVE` for production/live deployment
- `JWT_SECRET_KEY` (required)
- `GROQ_API_KEY` (required for AI chat/evaluation/code-check)

Notes:
- `MONGODB_URI` (if set) overrides local/live selection.
- Startup seeding runs in both development and production by default.
- Set `SEED_ON_STARTUP=false` when you want to skip startup seeding.

### Frontend env

```bash
cd ../frontend
cp .env.example .env
```

Set in `frontend/.env`:
- `NEXT_PUBLIC_API_BASE_URL=http://localhost:5000` (local backend)

For production frontend, set `NEXT_PUBLIC_API_BASE_URL` to your deployed backend URL.

## 4. Install Dependencies

From repo root:

```bash
cd backend && npm install
cd ../frontend && npm install
```

## 5. Run Locally

Use two terminals.

### Terminal A: Backend

```bash
cd backend
npm start
```

Backend default URL: `http://localhost:5000`

### Terminal B: Frontend

```bash
cd frontend
npm run dev
```

Frontend default URL: `http://localhost:3000`

## 6. Build Checks (Before Push/Deploy)

### Frontend production build

```bash
cd frontend
npm run build
```

### Backend syntax check

```bash
cd backend
node --check server.js
```

## 7. Optional Lint Check

```bash
cd frontend
npm run lint
```

## 8. Seed Behavior

On backend startup:
- Default users and demo topics are upserted (idempotent) in both development and production.
- Set `SEED_ON_STARTUP=false` to disable seeding.

## 9. Deploy On Render (Backend)

1. Push this repo to GitHub.
2. In Render, click **New +** -> **Web Service**.
3. Connect your repo.
4. Configure service:
	- Root Directory: `backend`
	- Build Command: `npm install`
	- Start Command: `npm start`
	- Environment: `Node`
5. Add environment variables in Render:
	- `NODE_ENV=production`
	- `MONGODB_URI_LIVE=<your-mongodb-atlas-uri>` (or set `MONGODB_URI`)
	- `JWT_SECRET_KEY=<strong-secret>`
	- `GROQ_API_KEY=<your-groq-key>`
	- `CORS_ORIGINS=<your-vercel-frontend-url>`
	- `SEED_ON_STARTUP=true` (optional, default is enabled)
6. Deploy and copy the generated Render backend URL, for example: `https://your-api.onrender.com`

## 10. Deploy On Vercel (Frontend)

1. Import the same repo in Vercel.
2. Set project Root Directory to `frontend`.
3. Keep framework as Next.js (auto-detected).
4. Add environment variable:
	- `NEXT_PUBLIC_API_BASE_URL=https://your-api.onrender.com`
5. Deploy and open your Vercel URL.
6. Go back to Render and ensure `CORS_ORIGINS` includes this exact Vercel domain.

## 11. Deployment Essentials

### Backend env (Render)
- `NODE_ENV=production`
- `MONGODB_URI_LIVE` or `MONGODB_URI`
- `JWT_SECRET_KEY`
- `GROQ_API_KEY`
- `CORS_ORIGINS`
- `SEED_ON_STARTUP` (optional)

### Frontend env (Vercel)
- `NEXT_PUBLIC_API_BASE_URL=<render-backend-url>`

## 12. Troubleshooting

### AI endpoints failing
- Verify backend `GROQ_API_KEY` is valid and present.

### Auth/token issues
- Verify same backend URL is used by frontend env.
- Ensure `JWT_SECRET_KEY` is set and consistent in backend env.

### Database connection issues
- Confirm selected URI exists and is reachable.
- For local: ensure MongoDB is running.

### Build warning about `baseline-browser-mapping`
Optional update:

```bash
cd frontend
npm i baseline-browser-mapping@latest -D
```

## 13. Security Notes

- Never commit real `.env` files.
- Rotate secrets immediately if exposed.
- Keep production and local env values separate.
