#!/usr/bin/env bash
# OKX.AI ASP — Full Deployment Script
# Usage: bash scripts/deploy.sh YOUR_GITHUB_USERNAME YOUR_REPO_NAME
# Example: bash scripts/deploy.sh johndoe okx-asp

set -e

GITHUB_USER="${1:-YOUR_GITHUB_USERNAME}"
REPO_NAME="${2:-okx-asp}"
REPO_URL="https://github.com/${GITHUB_USER}/${REPO_NAME}.git"

echo ""
echo "========================================="
echo "  OKX.AI ASP — Deployment Script"
echo "========================================="
echo ""

# ── Step 1: Check prerequisites ────────────────────────────────
echo "[1/7] Checking prerequisites..."
command -v node  >/dev/null || { echo "ERROR: Node.js not installed"; exit 1; }
command -v git   >/dev/null || { echo "ERROR: Git not installed"; exit 1; }
command -v npm   >/dev/null || { echo "ERROR: npm not installed"; exit 1; }
NODE_VER=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
[ "$NODE_VER" -ge 18 ] || { echo "ERROR: Node.js 18+ required (have $NODE_VER)"; exit 1; }
echo "   Node.js $(node -v) — OK"
echo "   npm $(npm -v) — OK"

# ── Step 2: Install all dependencies ───────────────────────────
echo ""
echo "[2/7] Installing dependencies..."
npm install
cd backend  && npm install && npx prisma generate && cd ..
cd frontend && npm install && cd ..
echo "   All dependencies installed."

# ── Step 3: Build frontend for production ──────────────────────
echo ""
echo "[3/7] Building frontend..."
cd frontend && npm run build && cd ..
echo "   Frontend built to frontend/dist/"

# ── Step 4: Initialize Git repository ─────────────────────────
echo ""
echo "[4/7] Initializing Git repository..."
if [ ! -d ".git" ]; then
  git init -b main
  echo "   Git repository initialized."
else
  echo "   Git repository already exists."
fi

# Create .gitignore if missing
cat > .gitignore << 'GITIGNORE'
node_modules/
.env
dist/
build/
.DS_Store
*.log
.nyc_output/
coverage/
.prisma/
frontend/dist/
GITIGNORE

git add -A
git commit -m "feat: initial commit — OKX.AI Agent Service Provider v1.0" || echo "   Nothing new to commit."

# ── Step 5: Push to GitHub ─────────────────────────────────────
echo ""
echo "[5/7] Pushing to GitHub..."
echo ""
echo "   MANUAL STEP REQUIRED:"
echo "   1. Go to https://github.com/new"
echo "   2. Create a new repository named: ${REPO_NAME}"
echo "   3. Set visibility: Public or Private"
echo "   4. Do NOT initialize with README, .gitignore, or license"
echo "   5. Copy the repository URL"
echo ""
read -p "   Paste your GitHub repository URL here: " CUSTOM_URL
if [ -n "$CUSTOM_URL" ]; then
  REPO_URL="$CUSTOM_URL"
fi

git remote remove origin 2>/dev/null || true
git remote add origin "$REPO_URL"
git branch -M main
git push -u origin main
echo "   Code pushed to GitHub successfully."

# ── Step 6: Deploy Frontend to Vercel ─────────────────────────
echo ""
echo "[6/7] Deploying frontend to Vercel..."
if ! command -v vercel &>/dev/null; then
  echo "   Installing Vercel CLI..."
  npm install -g vercel
fi

echo ""
echo "   Running: vercel --cwd frontend"
echo "   - Select your Vercel account when prompted"
echo "   - Project name: okx-asp-frontend (or your choice)"
echo "   - Root directory: ./ (already inside frontend/)"
echo "   - Framework: Vite (auto-detected)"
echo "   - Override build settings: No"
echo ""
cd frontend
vercel --prod
cd ..

echo ""
echo "   Frontend deployed to Vercel."

# ── Step 7: Railway backend instructions ──────────────────────
echo ""
echo "[7/7] Backend deployment (Railway)..."
echo ""
echo "   To deploy the backend, do the following:"
echo ""
echo "   Option A — Railway CLI (recommended):"
echo "   1.  npm install -g @railway/cli"
echo "   2.  railway login"
echo "   3.  railway init       (create a new project)"
echo "   4.  railway add        (add PostgreSQL plugin)"
echo "   5.  railway add        (add Redis plugin)"
echo "   6.  cd backend && railway up"
echo ""
echo "   Option B — Railway Dashboard:"
echo "   1. Go to https://railway.app/new"
echo "   2. Connect your GitHub repo"
echo "   3. Set root directory to: backend"
echo "   4. Add PostgreSQL plugin from the dashboard"
echo "   5. Add Redis plugin from the dashboard"
echo "   6. Add environment variables (see .env.example)"
echo ""

echo "========================================="
echo "  DEPLOYMENT COMPLETE"
echo "========================================="
echo ""
echo "  Frontend: Check Vercel dashboard for your live URL"
echo "  Backend:  Set VITE_API_URL in Vercel to your Railway URL"
echo ""
echo "  Required GitHub Secrets for CI/CD auto-deploy:"
echo "  - VERCEL_TOKEN      (from vercel.com/account/tokens)"
echo "  - VERCEL_ORG_ID     (from .vercel/project.json after first deploy)"
echo "  - VERCEL_PROJECT_ID (from .vercel/project.json after first deploy)"
echo "  - VERCEL_TEAM_ID    (your Vercel username or team slug)"
echo "  - RAILWAY_TOKEN     (from railway.app/account/tokens)"
echo "  - VITE_API_URL      (your Railway backend URL)"
echo "  - VITE_WS_URL       (your Railway backend WSS URL)"
echo ""
