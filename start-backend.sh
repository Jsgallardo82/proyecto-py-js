#!/usr/bin/env bash
# start-backend.sh — Inicia el servidor FastAPI en modo desarrollo.
# Requiere: .venv/ activado y dependencias instaladas (pip install -r backend/requirements.txt)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Activa el entorno virtual si no está activado
if [[ -z "${VIRTUAL_ENV:-}" ]]; then
  source .venv/bin/activate
fi

echo "▶ Zitterbewegung Backend — FastAPI + QuTiP"
echo "  URL: http://localhost:8000"
echo "  Docs: http://localhost:8000/docs"
echo ""

uvicorn backend.main:app \
  --host 0.0.0.0 \
  --port 8000 \
  --reload \
  --reload-dir backend \
  --log-level info
