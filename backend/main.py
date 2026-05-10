"""
ZITTERBEWEGUNG ENGINE LITE v6.0 — FastAPI Backend.

Motor científico para el simulador del Efecto Zitterbewegung.
Juan Gallardo · IUB 2026.

Rutas:
  POST /simulate/zb       — evolución cuántica (⟨S₁(t)⟩)
  POST /simulate/dirac    — espectro Mar de Dirac
  POST /validate          — verificación numérica
  POST /benchmark         — profiling
  GET  /presets           — 5 escenarios educativos
  GET  /health            — estado del servidor
"""

import os

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routes.simulate import router as simulate_router
from .routes.validate import router as validate_router
from .routes.presets import router as presets_router
from .routes.replay import router as replay_router
from .models.schemas import HealthResponse

load_dotenv()

app = FastAPI(
    title="Zitterbewegung Engine Lite v6.0",
    description=(
        "Simulador científico del Efecto Zitterbewegung basado en el modelo "
        "EQC (Electrodinámica Cuántica de Cavidades). Juan Gallardo · IUB 2026."
    ),
    version="6.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ─── CORS (permite peticiones desde el frontend Next.js) ──────────────────
_cors_raw = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in _cors_raw.split(",")],
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

# ─── Routers ──────────────────────────────────────────────────────────────
app.include_router(simulate_router)
app.include_router(validate_router)
app.include_router(presets_router)
app.include_router(replay_router)


@app.get("/health", response_model=HealthResponse, tags=["health"])
async def health_check() -> HealthResponse:
    """Estado del servidor y versión del motor."""
    return HealthResponse(
        status="ok",
        version="6.0.0",
        backend="FastAPI + QuTiP",
    )
