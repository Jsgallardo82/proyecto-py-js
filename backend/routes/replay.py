"""
Ruta POST /replay — Reproducción determinista de simulaciones.
Ruta POST /replay/verify — Verificación de divergencia de replay.

Referencia: Engine Spec v6.0 §11 (Replay + Reproducibility).
"""

from fastapi import APIRouter, HTTPException, UploadFile, File

import numpy as np

from ..models.schemas import (
    ReplayVerifyRequest, ReplayVerifyResponse, ReplayResponse,
)
from ..physics.snapshots import (
    import_binary_replay,
)

MAX_REPLAY_SIZE = 50 * 1024 * 1024  # 50 MB limit

router = APIRouter(prefix="/replay", tags=["replay"])


@router.post("/verify", response_model=ReplayVerifyResponse)
async def replay_verify(req: ReplayVerifyRequest) -> ReplayVerifyResponse:
    """
    Verifica que un replay reproduce bits idénticos al original.

    Compara dos resultados S₁(t) y calcula divergencia máxima.
    """
    try:
        s1_original = np.array(req.S1_original, dtype=np.float64)
        s1_replayed = np.array(req.S1_replayed, dtype=np.float64)

        min_len = min(len(s1_original), len(s1_replayed))
        if min_len == 0:
            raise HTTPException(status_code=400, detail="Empty S1 arrays")

        diff = float(np.max(np.abs(s1_original[:min_len] - s1_replayed[:min_len])))
        passed = diff < 1e-10

        return ReplayVerifyResponse(
            passed=passed,
            divergence=diff,
            max_allowed=1e-10,
            length_compared=min_len,
        )
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Replay verify error: {exc}") from exc


@router.post("/import", response_model=ReplayResponse)
async def replay_import(file: UploadFile = File(...)) -> ReplayResponse:
    """
    Importa un archivo de replay binario (.zbw) y devuelve los datos.

    Formato: [header 32B][snapshot JSON][t array Float64][S1 array Float64]
    """
    content = await file.read(MAX_REPLAY_SIZE + 1)
    if len(content) > MAX_REPLAY_SIZE:
        raise HTTPException(status_code=413, detail=f"Replay file too large (max {MAX_REPLAY_SIZE // 1024 // 1024} MB)")

    try:
        snapshot, t_arr, S1_arr = import_binary_replay(content)
    except (ValueError, struct_error, json.JSONDecodeError) as exc:
        raise HTTPException(status_code=400, detail=f"Invalid replay file: {exc}") from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Replay import error: {exc}") from exc

    return ReplayResponse(
        snapshot=snapshot,
        t=t_arr.tolist(),
        S1=S1_arr.tolist(),
    )


import json
import struct
struct_error = struct.error