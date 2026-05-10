"""
Constantes físicas del modelo EQC (Electrodinámica Cuántica de Cavidades).
Valores experimentales típicos de la propuesta de Juan Gallardo.
Todas las frecuencias en Hz, posiciones en μm.

Sección de referencia: Engine Spec v6.0 — Sección 2 (constantes base).
"""

# ─── Constantes base del modelo EQC ─────────────────────────────────────────

LAMBDA_BASE: float = 1.0e5          # λ  — tasa de acoplamiento base [Hz]
LAMBDA_A: float = LAMBDA_BASE / 2   # λₐ — acoplamiento modo cavidad [Hz]
DELTA_A: float = 20.0 * LAMBDA_BASE # Δₐ — desintonía átomo-cavidad [Hz]

# Escala de longitud (calibrada para observabilidad en pantalla)
R_A: float = 1.0                    # Rₐ — constante de escala [μm]

# Velocidad de la luz simulada
C_SIM: float = 1.25 * R_A          # c_sim [kHz·μm] ≈ 1.25 μm·kHz

# ─── Constantes cuánticas ──────────────────────────────────────────────────

HBAR: float = 1.0545718e-34         # ℏ [J·s]
HBAR_NATURAL: float = 1.0           # ℏ = 1 en unidades naturales (para solvers)

# ─── Rango de acoplamiento clásico (sliders de masa) ──────────────────────

OMEGA_MIN: float = 1.0e4            # Ω_min [Hz] → masa ≈ 0
OMEGA_MAX: float = 1.0e5            # Ω_max [Hz] → masa grande
OMEGA_DEFAULT: float = 5.0e4        # Ω_default [Hz]

# ─── Tiempo de simulación ────────────────────────────────────────────────

T_MAX_DEFAULT: float = 5000.0       # t_max [μs] — 5 ms muestra ~2 ciclos ZB
T_MAX_LIMIT: float = 5000.0         # límite de seguridad [μs]
N_STEPS_DEFAULT: int = 2000         # resolución mínima
N_STEPS_MAX: int = 5000             # resolución máxima

# ─── Dimensión del espacio de Hilbert ────────────────────────────────────

N_FOCK: int = 20                    # dimensión del espacio de Fock (número de fotones)

# ─── Fórmula de masa simulada ─────────────────────────────────────────────
# m = ζ₊′ / (Δₐ · Rₐ · λₐ²)²
# donde ζ₊′ ∝ Ω (parametrizada linealmente en el slider)
MASS_DENOMINATOR: float = (DELTA_A * R_A * LAMBDA_A**2) ** 2  # denominador fijo

# ─── Thresholds de validación numérica (Engine Spec v6.0 §10) ────────────

THRESHOLD_PROB_DRIFT: float = 1.0e-9    # drift de probabilidad máximo
THRESHOLD_ENERGY_DRIFT: float = 1.0e-7  # drift de energía máximo
THRESHOLD_FFT_PARITY: float = 1.0e-8   # paridad FFT
THRESHOLD_REPLAY_DIVERGENCE: float = 1.0e-10  # divergencia de replay
THRESHOLD_SOLVER_PARITY: float = 1.0e-6        # paridad entre solvers

# ─── Versión del solver ──────────────────────────────────────────────────

SOLVER_VERSION: str = "6.0.0"

# ─── Tolerancias del solver RK45 ─────────────────────────────────────────

RK45_RTOL: float = 1.0e-9
RK45_ATOL: float = 1.0e-9
RK45_DT_MIN: float = 1.0e-8
RK45_DT_MAX: float = 1.0e-3

# ─── Energía umbral del Mar de Dirac ─────────────────────────────────────

DIRAC_THRESHOLD_FACTOR: float = 2.0  # E ≥ 2mc² para creación de pares
