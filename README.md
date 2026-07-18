# OKX.AI — Agent Service Provider

A full-stack AI agent marketplace platform. Retail traders deploy autonomous
trading agents. Quant developers publish and monetize strategies. Built on
React + Vite (frontend) and Node.js + Express + Prisma (backend).

---

## Current Production Setup (live)

| Piece | Where | URL / Notes |
|---|---|---|
| Frontend | Vercel | https://okx-asp.vercel.app |
| Backend | Render (free tier) | https://okx-asp.onrender.com — sleeps after 15 min idle, ~30-60s cold start |
| PostgreSQL | Neon (free tier) | `DATABASE_URL` env var on Render |
| Redis | Upstash (free tier) | `REDIS_URL` env var on Render |
| Repo | GitHub (private) | https://github.com/Itgottabedavidbabsy/okx-asp |
| CI/CD | Render + Vercel git integrations auto-deploy on push to `main`; GitHub Actions runs validate + a backup Vercel deploy | |

Backend start command (Render): `npx prisma db push --accept-data-loss && node src/server.js`
(uses `db push` because the repo is schema-only, no migration files).

Frontend production URLs are committed in `frontend/.env.production`.

Pending: OKX OAuth credentials (broker application under review) — until
`OKX_CLIENT_ID`/`OKX_CLIENT_SECRET`/`OKX_REDIRECT_URI` are set on Render,
"Connect OKX" and live position sync are inactive; all other features work.

Extra features beyond the original build guide:
- **On-chain performance verification** — closed trades are SHA-256 hashed,
  Merkle-batched, and anchored to a public chain (`services/ledger.js`;
  simulated-anchor mode until `LEDGER_RPC_URL`/`LEDGER_PRIVATE_KEY` are set).
  Public verify endpoints under `/api/performance/*`.
- **Agent composability** — agents can trigger other agents via signal
  chains (`services/composability.js`, AgentLink model, UI on Signal Hub).

---

## Architecture

- **Frontend** — React 18 + Vite + Tailwind CSS + Zustand → Vercel
- **Backend**  — Node.js + Express + Prisma + PostgreSQL + Redis → Railway
- **Auth**     — OKX OAuth 2.0 PKCE (no API key storage)
- **Realtime** — WebSocket server bridging OKX live feed to clients

---

## Local Development

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Redis 7+

### Setup

```bash
# 1. Copy environment config
cp .env.example .env

# 2. Edit .env — fill in DATABASE_URL, JWT_SECRET, OKX OAuth credentials
nano .env

# 3. Install all dependencies
npm install
cd backend  && npm install && cd ..
cd frontend && npm install && cd ..

# 4. Run database migrations
cd backend && npx prisma migrate dev --name init && cd ..

# 5. Start both servers with one command
npm run dev
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:4000/api
- WebSocket: ws://localhost:4000/ws

---

## Deploy to Production

### One-command deploy (first time)

```bash
bash scripts/deploy.sh YOUR_GITHUB_USERNAME YOUR_REPO_NAME
```

This script will:
1. Install all dependencies
2. Build the frontend
3. Initialize git and push to GitHub
4. Deploy frontend to Vercel (interactive)
5. Guide you through Railway backend setup

### After initial deploy — push updates

```bash
bash scripts/push.sh "feat: add new feature"
```

GitHub Actions auto-deploys on every push to `main`.

---

## Manual Deployment Steps

### Step 1: GitHub

```bash
git init -b main
git add -A
git commit -m "feat: initial commit"
git remote add origin https://github.com/USERNAME/REPO.git
git push -u origin main
```

### Step 2: Frontend on Vercel

```bash
npm install -g vercel
cd frontend
vercel --prod
```

Set these environment variables in Vercel dashboard:
- `VITE_API_URL` → your Railway backend URL (e.g. https://okx-asp-backend.railway.app)
- `VITE_WS_URL` → WSS URL of your backend (e.g. wss://okx-asp-backend.railway.app)

### Step 3: Backend on Railway

```bash
npm install -g @railway/cli
railway login
cd backend
railway init
railway add --plugin postgresql
railway add --plugin redis
railway up
```

Set these environment variables in Railway dashboard:
- `DATABASE_URL` — auto-set by Railway PostgreSQL plugin
- `REDIS_URL` — auto-set by Railway Redis plugin
- `JWT_SECRET` — generate with: `openssl rand -hex 32`
- `FRONTEND_URL` — your Vercel deployment URL
- `OKX_CLIENT_ID` — from OKX Developer Console
- `OKX_CLIENT_SECRET` — from OKX Developer Console
- `OKX_REDIRECT_URI` — `https://YOUR_RAILWAY_URL/api/auth/okx/callback`

### Step 4: GitHub Actions CI/CD (auto-deploy on push)

Add these secrets to your GitHub repo (Settings → Secrets → Actions):

| Secret | Where to get it |
|--------|----------------|
| `VERCEL_TOKEN` | vercel.com/account/tokens |
| `VERCEL_ORG_ID` | `.vercel/project.json` (after first `vercel` deploy) |
| `VERCEL_PROJECT_ID` | `.vercel/project.json` (after first `vercel` deploy) |
| `RAILWAY_TOKEN` | railway.app/account/tokens |
| `VITE_API_URL` | Your Railway backend URL |
| `VITE_WS_URL` | Your Railway WSS URL |

---

## Environment Variables Reference

### Backend (.env)

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `REDIS_URL` | Yes | Redis connection string |
| `JWT_SECRET` | Yes | 64-char random secret |
| `FRONTEND_URL` | Yes | Your Vercel URL |
| `OKX_CLIENT_ID` | Yes | OKX OAuth app client ID |
| `OKX_CLIENT_SECRET` | Yes | OKX OAuth app client secret |
| `OKX_REDIRECT_URI` | Yes | OAuth callback URL |

### Frontend (Vercel environment)

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Railway backend REST URL |
| `VITE_WS_URL` | Railway backend WebSocket URL |

---

## Project Structure

```
okx-asp/
├── .github/workflows/deploy.yml   # CI/CD — auto-deploy on push to main
├── scripts/
│   ├── deploy.sh                  # One-command first deploy
│   └── push.sh                   # Quick push + deploy updates
├── backend/
│   ├── prisma/schema.prisma       # Database schema (8 tables)
│   ├── railway.json               # Railway deployment config
│   └── src/
│       ├── server.js              # HTTP + WebSocket server entry
│       ├── app.js                 # Express app factory
│       ├── config/                # Environment config
│       ├── middleware/            # Auth, CORS, rate limiting
│       ├── routes/                # 7 API route groups
│       ├── services/              # OKX API, backtest engine, signals
│       ├── ws/                    # WebSocket server + OKX feed bridge
│       └── db/                    # Prisma client
└── frontend/
    ├── vercel.json                # Vercel deployment config
    ├── tailwind.config.js         # OKX design token system
    └── src/
        ├── App.jsx                # Router + protected routes
        ├── store/appStore.js      # Zustand global state + WS client
        ├── api/client.js          # Axios API client + JWT interceptor
        ├── components/layout/     # Sidebar, TopNav, Layout shell
        └── pages/                 # 10 module pages
```
