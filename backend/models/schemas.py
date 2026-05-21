"""
Esquemas Pydantic para request/response de la API.

Todas las validaciones de rango se realizan aquí en la frontera del sistema.
Referencia: Engine Spec v6.0 §23 (Requerimientos funcionales Backend).
"""

from pydantic import BaseModel, Field
from typing import Literal
from ..physics.constants import (
    OMEGA_MIN, OMEGA_MAX, OMEGA_DEFAULT,
    T_MAX_DEFAULT, T_MAX_LIMIT,
    N_STEPS_DEFAULT, N_STEPS_MAX,
)


# ─── Request schemas ──────────────────────────────────────────────────────

class ZBSimulationRequest(BaseModel):
    """Request para POST /simulate/zb"""

    omega: float = Field(
        default=OMEGA_DEFAULT,
        description="Fuerza de acoplamiento clásica Ω [Hz]",
        ge=OMEGA_MIN,
        le=OMEGA_MAX,
    )

    t_max: float = Field(
        default=T_MAX_DEFAULT,
        description="Tiempo máximo de simulación [μs]",
        ge=1.0,
        le=T_MAX_LIMIT,
    )
    n_steps: int = Field(
        default=N_STEPS_DEFAULT,
        description="Número de pasos temporales",
        ge=100,
        le=N_STEPS_MAX,
    )
    solver: Literal["RK45", "Crank-Nicolson", "Split-Step"] = Field(
        default="RK45",
        description="Método numérico de evolución temporal",
    )

    model_config = {"json_schema_extra": {"example": {
        "omega": 5.0e4,
        "t_max": 200.0,
        "n_steps": 1000,
        "solver": "RK45",
    }}}


class DiracSimulationRequest(BaseModel):
    """Request para POST /simulate/dirac"""

    omega: float = Field(
        default=OMEGA_DEFAULT,
        ge=OMEGA_MIN,
        le=OMEGA_MAX,
        description="Fuerza de acoplamiento Ω [Hz]",
    )
    photon_energy_factor: float = Field(
        default=1.5,
        ge=0.0,
        le=4.0,
        description="Energía del fotón en unidades de mc² [0, 4]",
    )


class ValidateRequest(BaseModel):
    """Request para POST /validate"""

    omega: float = Field(
        default=OMEGA_DEFAULT,
        ge=OMEGA_MIN,
        le=OMEGA_MAX,
    )
    n_steps: int = Field(default=500, ge=100, le=5000)


class BenchmarkRequest(BaseModel):
    """Request para POST /benchmark"""

    omega: float = Field(default=OMEGA_DEFAULT, ge=OMEGA_MIN, le=OMEGA_MAX)
    n_steps: int = Field(default=200, ge=100, le=1000)
    solver: Literal["RK45", "Crank-Nicolson", "Split-Step"] = "RK45"


# ─── Response schemas ─────────────────────────────────────────────────────

class ZBSimulationResponse(BaseModel):
    """Response de POST /simulate/zb"""

    t: list[float]
    S1: list[float]
    frecuencia_zb: float
    amplitud: float
    masa_simulada: float
    solver_used: str
    normalization_error: float
    elapsed_ms: float
    n_steps: int
    t_max: float
    omega: float
    checksum: str = ""
    build_hash: str = "v6.0.0"


class DiracSimulationResponse(BaseModel):
    """Response de POST /simulate/dirac — espectro relativista E(k) vs k"""

    mc2: float
    zeta_prime: float
    mass_simulada: float
    k_values: list[float]
    positive_branch: list[float]
    negative_branch: list[float]
    dos: list[float]
    threshold_energy: float
    photon_energy: float
    pair_created: bool
    photon_energy_factor: float


class ValidateResponse(BaseModel):
    """Response de POST /validate"""

    passed: bool
    probability_drift: float
    probability_drift_threshold: float
    probability_drift_ok: bool
    energy_drift: float
    energy_drift_threshold: float
    energy_drift_ok: bool
    solver_parity: float
    solver_parity_threshold: float
    solver_parity_ok: bool
    fft_parity: float = 0.0
    fft_parity_threshold: float = 1.0e-8
    fft_parity_ok: bool = True


class BenchmarkResponse(BaseModel):
    """Response de POST /benchmark"""

    elapsed_ms: float
    steps_per_second: float
    solver: str
    n_steps: int
    omega: float
    normalization_error: float


class PresetScenario(BaseModel):
    """Un escenario educativo preconfigurado"""

    id: int
    name: str
    description: str
    omega: float
    t_max: float
    n_steps: int
    solver: str
    pedagogy_level: Literal["Beginner", "Academic", "Advanced"]


class PresetsResponse(BaseModel):
    """Response de GET /presets"""

    presets: list[PresetScenario]


class HealthResponse(BaseModel):
    """Response de GET /health"""

    status: str
    version: str
    backend: str


class ReplayVerifyRequest(BaseModel):
    """Request para POST /replay/verify"""

    S1_original: list[float]
    S1_replayed: list[float]


class ReplayResponse(BaseModel):
    """Response de POST /replay"""

    snapshot: dict
    t: list[float]
    S1: list[float]


class ReplayVerifyResponse(BaseModel):
    """Response de POST /replay/verify"""

    passed: bool
    divergence: float
    max_allowed: float
    length_compared: int
