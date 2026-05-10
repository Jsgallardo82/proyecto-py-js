"""
Ruta POST /simulate/zb — Evolución cuántica del Zitterbewegung.
Ruta POST /simulate/dirac — Espectro del Mar de Dirac.
Ruta POST /simulate/zb/export — Exportación de resultados.

Referencia: Engine Spec v6.0 §23 (Backend checklist).
"""

import json
from fastapi import APIRouter, HTTPException
from fastapi.responses import PlainTextResponse, Response, JSONResponse

import numpy as np
import xxhash

from ..models.schemas import (
    ZBSimulationRequest, ZBSimulationResponse,
    DiracSimulationRequest, DiracSimulationResponse,
)
from ..physics.engine import run_zb_simulation, run_dirac_simulation
from ..physics.snapshots import (
    create_snapshot,
    export_csv,
    export_json,
    export_msgpack,
    export_binary_replay,
)

router = APIRouter(prefix="/simulate", tags=["simulation"])


@router.post("/zb", response_model=ZBSimulationResponse)
async def simulate_zb(req: ZBSimulationRequest) -> ZBSimulationResponse:
    """
    Ejecuta la simulación del Zitterbewegung.

    Resuelve H₁D|ψ⟩ = iℏ d|ψ⟩/dt con estado inicial |0⟩⊗(|e⟩+|g⟩)/√2
    y devuelve ⟨S₁(t)⟩ = Rₐ·⟨a†+a⟩ en cada instante.
    """
    try:
        result = run_zb_simulation(
            omega=req.omega,
            t_max=req.t_max,
            n_steps=req.n_steps,
            solver=req.solver,
        )

        # Checksum determinístico XXHash64 de los datos S1
        payload_bytes = json.dumps(result["S1"][:10], sort_keys=True).encode()
        checksum = xxhash.xxh64(payload_bytes).hexdigest()

        # Snapshot con metadata completa para reproducibilidad
        s1_arr = np.array(result["S1"], dtype=np.float64)
        snapshot = create_snapshot(
            psi=s1_arr,
            parameters={
                "omega": req.omega,
                "t_max": req.t_max,
                "n_steps": req.n_steps,
                "solver": req.solver,
            },
            solver_state={"elapsed_ms": result["elapsed_ms"]},
            build_hash="v6.0.0",
            solver_version=result["solver_used"],
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Simulation error: {exc}") from exc

    return ZBSimulationResponse(
        **result,
        checksum=checksum,
        build_hash=snapshot.build_hash,
    )


@router.post("/dirac", response_model=DiracSimulationResponse)
async def simulate_dirac(req: DiracSimulationRequest) -> DiracSimulationResponse:
    """
    Calcula el espectro energético para la vista del Mar de Dirac.

    Determina si el fotón (photon_energy_factor·mc²) tiene energía
    suficiente para crear un par electrón-positrón (umbral = 2mc²).
    """
    try:
        result = run_dirac_simulation(
            omega=req.omega,
            photon_energy_factor=req.photon_energy_factor,
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Dirac simulation error: {exc}") from exc

    return DiracSimulationResponse(**result)


@router.post("/zb/export")
async def simulate_zb_export(
    req: ZBSimulationRequest,
    export_format: str = "json",
):
    """
    Ejecuta la simulación y exporta en el formato solicitado.

    Formatos: csv | json | msgpack | binary
    """
    try:
        result = run_zb_simulation(
            omega=req.omega,
            t_max=req.t_max,
            n_steps=req.n_steps,
            solver=req.solver,
        )

        s1_arr = np.array(result["S1"], dtype=np.float64)
        snapshot = create_snapshot(
            psi=s1_arr,
            parameters={
                "omega": req.omega,
                "t_max": req.t_max,
                "n_steps": req.n_steps,
                "solver": req.solver,
            },
            solver_state={"elapsed_ms": result["elapsed_ms"]},
            build_hash="v6.0.0",
            solver_version=result["solver_used"],
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Simulation error: {exc}") from exc

    if export_format == "csv":
        content = export_csv(result["t"], result["S1"])
        return PlainTextResponse(content, media_type="text/csv", headers={
            "Content-Disposition": "attachment; filename=zitterbewegung.csv"
        })

    elif export_format == "json":
        data = export_json(result["t"], result["S1"], snapshot)
        return JSONResponse(data)

    elif export_format == "msgpack":
        content = export_msgpack(result["t"], result["S1"], snapshot)
        return Response(content, media_type="application/msgpack", headers={
            "Content-Disposition": "attachment; filename=zitterbewegung.msgpack"
        })

    elif export_format == "binary":
        content = export_binary_replay(result["t"], result["S1"], snapshot)
        return Response(content, media_type="application/octet-stream", headers={
            "Content-Disposition": "attachment; filename=zitterbewegung.zbw"
        })

    else:
        raise HTTPException(status_code=400, detail=f"Formato no soportado: {export_format}")
