"""
Ruta GET /presets — Los 5 escenarios educativos predefinidos.

Referencia: Engine Spec v6.0 §14 (Escenarios educativos).
"""

from fastapi import APIRouter
from ..models.schemas import PresetsResponse, PresetScenario
from ..physics.constants import OMEGA_MIN, OMEGA_MAX, OMEGA_DEFAULT

router = APIRouter(tags=["presets"])

# 5 escenarios educativos del Engine Spec v6.0 §14
_PRESETS: list[dict] = [
    {
        "id": 1,
        "name": "Partícula sin masa",
        "description": (
            "Reduce la masa a cero (m ≈ 0). La trayectoria debe ser una línea "
            "recta perfecta a la velocidad de la luz simulada, sin oscilaciones."
        ),
        "omega": OMEGA_MIN,
        "t_max": 200.0,
        "n_steps": 1000,
        "solver": "RK45",
        "pedagogy_level": "Beginner",
    },
    {
        "id": 2,
        "name": "Añadiendo masa",
        "description": (
            "Aumenta la masa gradualmente. La trayectoria recta comienza a ondularse; "
            "cuanto mayor la masa, más evidentes las oscilaciones ZB."
        ),
        "omega": OMEGA_DEFAULT,
        "t_max": 200.0,
        "n_steps": 1000,
        "solver": "RK45",
        "pedagogy_level": "Beginner",
    },
    {
        "id": 3,
        "name": "El Mar de Dirac (interferencia)",
        "description": (
            "Las oscilaciones ZB son causadas por la superposición de soluciones de "
            "energía positiva y negativa. Activar 'Mostrar Interferencia' para visualizarlo."
        ),
        "omega": OMEGA_MAX * 0.8,
        "t_max": 200.0,
        "n_steps": 1000,
        "solver": "Crank-Nicolson",
        "pedagogy_level": "Academic",
    },
    {
        "id": 4,
        "name": "Modo FFT",
        "description": (
            "Análisis espectral de ⟨S₁(t)⟩. El pico dominante revela la frecuencia "
            "del Zitterbewegung: ν_ZB = 2mc²/h."
        ),
        "omega": OMEGA_MAX * 0.6,
        "t_max": 200.0,
        "n_steps": 2000,
        "solver": "RK45",
        "pedagogy_level": "Academic",
    },
    {
        "id": 5,
        "name": "Comparación de Solvers",
        "description": (
            "Ejecuta la misma simulación con RK45 y Crank-Nicolson. "
            "Superpone las trayectorias para mostrar diferencias numéricas."
        ),
        "omega": OMEGA_DEFAULT,
        "t_max": 100.0,
        "n_steps": 1000,
        "solver": "RK45",
        "pedagogy_level": "Advanced",
    },
]


@router.get("/presets", response_model=PresetsResponse)
async def get_presets() -> PresetsResponse:
    """
    Devuelve los 5 escenarios educativos predefinidos con parámetros
    configurados para cada nivel pedagógico (Beginner / Academic / Advanced).
    """
    presets = [PresetScenario(**p) for p in _PRESETS]
    return PresetsResponse(presets=presets)
