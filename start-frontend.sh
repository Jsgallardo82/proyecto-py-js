#!/usr/bin/env bash
# start-frontend.sh — Inicia el servidor Next.js en modo desarrollo.
# Requiere: Node.js 20+ y npm install en frontend/

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/frontend"

echo "▶ Zitterbewegung Frontend — Next.js 16 + React 19"
echo "  URL: http://localhost:3000"
echo ""

npm run dev
