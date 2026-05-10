"""
Ruta POST /validate — Verificación numérica del motor de simulación.
Ruta POST /benchmark — Profiling del motor.

Referencia: Engine Spec v6.0 §10 (Validation Engine), §25 (Performance targets).
"""

import time
from fastapi import APIRouter, HTTPException

from ..models.schemas import (
    ValidateRequest, ValidateResponse,
    BenchmarkRequest, BenchmarkResponse,
)
from ..physics.engine import validate_simulation, run_zb_simulation

router = APIRouter(tags=["validation"])


@router.post("/validate", response_model=ValidateResponse)
async def validate(req: ValidateRequest) -> ValidateResponse:
    """
    Ejecuta la pipeline de validación científica completa.

    Verifica:
    - Probability drift < 1e-9
    - Energy drift < 1e-7
    - Solver parity (RK45 vs Crank-Nicolson) < 1e-6
    """
    try:
        result = validate_simulation(omega=req.omega, n_steps=req.n_steps)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Validation error: {exc}") from exc

    return ValidateResponse(**result)


@router.post("/benchmark", response_model=BenchmarkResponse)
async def benchmark(req: BenchmarkRequest) -> BenchmarkResponse:
    """
    Mide el tiempo de ejecución del motor de simulación.
    """
    try:
        t0 = time.perf_counter()
        result = run_zb_simulation(
            omega=req.omega,
            t_max=50.0,
            n_steps=req.n_steps,
            solver=req.solver,
        )
        elapsed_ms = (time.perf_counter() - t0) * 1000.0
        steps_per_second = req.n_steps / (elapsed_ms / 1000.0) if elapsed_ms > 0 else 0.0
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Benchmark error: {exc}") from exc

    return BenchmarkResponse(
        elapsed_ms=elapsed_ms,
        steps_per_second=steps_per_second,
        solver=req.solver,
        n_steps=req.n_steps,
        omega=req.omega,
        normalization_error=result["normalization_error"],
    )
