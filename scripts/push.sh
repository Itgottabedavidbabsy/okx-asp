#!/usr/bin/env bash
# Quick push and deploy — run after making changes
MSG="${1:-update: $(date '+%Y-%m-%d %H:%M')}"
set -e
echo "Building frontend..."
cd frontend && npm run build && cd ..
echo "Committing: $MSG"
git add -A
git commit -m "$MSG" || echo "Nothing to commit"
git push origin main
echo "Pushed. Vercel and Railway will auto-deploy via GitHub Actions."
