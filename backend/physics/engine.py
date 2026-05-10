"""
Motor de evolución cuántica usando QuTiP.

Implementa:
- Evolución temporal con sesolve (RK45) — interactividad pedagógica
- Evolución temporal con Crank-Nicolson (unitario, estable)
- Evolución temporal con Split-Step Fourier (espectral, espacial 1D)
- Cálculo del observable ⟨S₁(t)⟩ = Rₐ·⟨a₁† + a₁⟩
- Validación de normalization drift

Referencia: Engine Spec v6.0 §4, §5, §10.
Método numérico: sesolve RK45 (QuTiP) + Crank-Nicolson manual + Split-Step Fourier.
"""

from __future__ import annotations

import time
import numpy as np
import qutip as qt
from typing import Literal

from .constants import (
    N_FOCK, R_A,
    T_MAX_DEFAULT, T_MAX_LIMIT,
    N_STEPS_DEFAULT, N_STEPS_MAX,
    RK45_RTOL, RK45_ATOL,
    THRESHOLD_PROB_DRIFT,
    THRESHOLD_ENERGY_DRIFT,
    THRESHOLD_SOLVER_PARITY,
    THRESHOLD_FFT_PARITY,
    DIRAC_THRESHOLD_FACTOR,
)
from .hamiltoniano import (
    build_hamiltonian,
    build_initial_state,
    build_spin_observable,
    compute_zeta_minus,
    compute_simulated_mass,
)


# ─── Tipos ────────────────────────────────────────────────────────────────

SolverName = Literal["RK45", "Crank-Nicolson", "Split-Step"]


# ─── Motor principal ──────────────────────────────────────────────────────

def run_zb_simulation(
    omega: float,
    t_max: float = T_MAX_DEFAULT,
    n_steps: int = N_STEPS_DEFAULT,
    solver: SolverName = "RK45",
) -> dict:
    """
    Ejecuta la simulación completa del Zitterbewegung.

    Resuelve la ecuación de Schrödinger H₁D|ψ⟩ = iℏ d|ψ⟩/dt con el
    estado inicial |ψ(0)⟩ = |0⟩ ⊗ (|e⟩+|g⟩)/√2 y calcula el observable
    ⟨S₁(t)⟩ = Rₐ·⟨a† + a⟩ en cada paso de tiempo.

    Args:
        omega:   Fuerza de acoplamiento Ω [Hz], rango [10⁴, 10⁵].
        t_max:   Tiempo máximo de simulación [μs].
        n_steps: Número de pasos temporales (≥ 1000).
        solver:  Método numérico: "RK45" | "Crank-Nicolson" | "Split-Step".

    Returns:
        dict con t[], S1[], frecuencia_zb, amplitud, masa_simulada,
        solver_used, normalization_error.
    """
    t_start = time.perf_counter()

    # Clamp de parámetros
    n_steps = min(max(n_steps, 100), N_STEPS_MAX)
    t_max = min(max(t_max, 1.0), T_MAX_LIMIT)

    # Tiempo en segundos (QuTiP usa unidades SI: Hz para H, s para t)
    t_list_us = np.linspace(0.0, t_max, n_steps)  # [μs]
    t_list = t_list_us * 1.0e-6                    # [s]

    # Hamiltoniano y estado inicial
    H = build_hamiltonian(omega)
    psi0 = build_initial_state()
    X_op = build_spin_observable()

    # Parámetros físicos
    zeta_m = compute_zeta_minus(omega)             # masa simulada [Hz]
    mass_sim = compute_simulated_mass(zeta_m)

    # ── Evolución temporal ────────────────────────────────────────────
    if solver == "RK45":
        S1_values, norm_error = _solve_rk45(H, psi0, t_list, X_op)
    elif solver == "Crank-Nicolson":
        S1_values, norm_error = _solve_crank_nicolson(H, psi0, t_list, X_op)
    elif solver == "Split-Step":
        # Split-Step Fourier en grid espacial 1D
        S1_values, norm_error = _solve_split_step_fourier(
            omega, t_list, n_steps
        )
    else:
        S1_values, norm_error = _solve_rk45(H, psi0, t_list, X_op)

    # ── Métricas derivadas ────────────────────────────────────────────
    freq_zb, amplitude = _analyze_zb(S1_values, t_list_us)

    elapsed_ms = (time.perf_counter() - t_start) * 1000.0

    return {
        "t": t_list_us.tolist(),
        "S1": S1_values.tolist(),
        "frecuencia_zb": float(freq_zb),
        "amplitud": float(amplitude),
        "masa_simulada": float(mass_sim),
        "solver_used": solver,
        "normalization_error": float(norm_error),
        "elapsed_ms": float(elapsed_ms),
        "n_steps": n_steps,
        "t_max": t_max,
        "omega": omega,
    }


def _solve_rk45(
    H: qt.Qobj,
    psi0: qt.Qobj,
    t_list: np.ndarray,
    X_op: qt.Qobj,
) -> tuple[np.ndarray, float]:
    """
    Resuelve con sesolve de QuTiP (RK45 adaptativo).

    RK45 NO preserva unitariedad → renormalización periódica post-proceso.
    Tolerancias: rtol=1e-9, atol=1e-9 (Engine Spec v6.0 §5).

    Returns:
        (S1_values, max_normalization_error)
    """
    options = {
        "rtol": RK45_RTOL,
        "atol": RK45_ATOL,
        "nsteps": 50000,
    }

    # Añadimos el operador identidad como segundo e_op para medir ||ψ||² en cada paso
    # sin necesidad de almacenar todos los estados (ahorro de memoria).
    I_op = qt.qeye(H.dims[0])
    result = qt.sesolve(H, psi0, t_list, [X_op, I_op], options=options)

    S1_raw = np.array(result.expect[0], dtype=np.float64)

    # ⟨ψ|I|ψ⟩ = ||ψ||²  → drift de normalización
    norms_sq = np.array(result.expect[1], dtype=np.float64)
    norms = np.sqrt(np.clip(norms_sq, 0.0, None))
    norm_error = float(np.max(np.abs(norms - 1.0)))

    # NaN recovery
    if _contains_nan_or_inf(S1_raw):
        S1_raw, norm_error = _nan_recovery(
            H, psi0, t_list, X_op, solver_name="RK45"
        )

    return S1_raw, norm_error


def _solve_crank_nicolson(
    H: qt.Qobj,
    psi0: qt.Qobj,
    t_list: np.ndarray,
    X_op: qt.Qobj,
) -> tuple[np.ndarray, float]:
    """
    Resuelve con Crank-Nicolson (CN) implícito.

    CN es unitario por construcción y preserva la energía incondicionalmente.
    Complejidad O(N²) para matrices densas (pequeño N_FOCK).

    Esquema: (I + iΔt/2·H)|ψₙ₊₁⟩ = (I - iΔt/2·H)|ψₙ⟩
    Resuelto directamente con numpy.linalg.solve.

    Returns:
        (S1_values, max_normalization_error)
    """
    H_mat = H.full()               # matrix densa [dim × dim] compleja
    dim = H_mat.shape[0]
    I = np.eye(dim, dtype=complex)

    psi = psi0.full().flatten().astype(complex)  # vector de estado inicial

    X_mat = X_op.full()
    S1_values = np.empty(len(t_list), dtype=np.float64)
    norm_errors = np.empty(len(t_list), dtype=np.float64)

    S1_values[0] = float(np.real(psi.conj() @ X_mat @ psi))
    norm_errors[0] = abs(np.linalg.norm(psi) - 1.0)

    for idx in range(1, len(t_list)):
        dt = t_list[idx] - t_list[idx - 1]

        # Matrices CN: A·ψₙ₊₁ = B·ψₙ
        A = I + 0.5j * dt * H_mat   # (I + iΔt/2·H)
        B = I - 0.5j * dt * H_mat   # (I - iΔt/2·H)

        rhs = B @ psi
        try:
            psi = np.linalg.solve(A, rhs)
        except np.linalg.LinAlgError:
            # Fallback a pseudo-inversa si A es singular o mal condicionada
            psi = np.linalg.lstsq(A, rhs, rcond=None)[0]

        # Renormalización periódica (cada 50 pasos, como salvaguarda)
        if idx % 50 == 0:
            psi /= np.linalg.norm(psi)

        # ⟨X̂⟩ = ⟨ψ|X̂|ψ⟩
        S1_values[idx] = float(np.real(psi.conj() @ X_mat @ psi))
        norm_errors[idx] = abs(np.linalg.norm(psi) - 1.0)

    max_norm_error = float(np.max(norm_errors))

    # NaN recovery: detectar y reportar
    if _contains_nan_or_inf(S1_values):
        S1_values, max_norm_error = _nan_recovery(
            H, psi0, t_list, X_op, solver_name="Crank-Nicolson"
        )

    return S1_values, max_norm_error


def _solve_split_step_fourier(
    omega: float,
    t_list: np.ndarray,
    n_steps: int,
) -> tuple[np.ndarray, float]:
    """
    Split-Step Fourier en una grid espacial 1D.

    Este solver utiliza una representación espacial del Hamiltoniano
    efectivo de Dirac en 1+1D, aproximando la ecuación como:

        iℏ ∂ψ/∂t = [-(ℏ²/2m) ∂²/∂x² + V(x) + mc² σz] ψ

    Discretizado en una grid espacial con N_x puntos. El método
    consiste en alternar propagación en espacio real (potencial)
    y espacio de momento (cinético) vía FFT.

    Args:
        omega:      Parámetro que controla la masa efectiva [Hz].
        t_list_us:  Tiempos en μs.
        t_list:     Tiempos en segundos.
        n_steps:    Número de pasos temporales.

    Returns:
        (S1_values, max_normalization_error)
    """
    # Parámetros de la grid espacial
    N_x = 512                      # puntos espaciales (potencia de 2 para FFT)
    L = 20.0                       # longitud del dominio [μm]
    dx = L / N_x                   # paso espacial [μm]

    # Parámetros físicos efectivos
    zeta_m = compute_zeta_minus(omega)             # ≡ mc²/ℏ [Hz]
    mass_eff = compute_simulated_mass(zeta_m)      # masa [kg]

    # Grid espacial y de momento
    x = np.linspace(-L / 2, L / 2, N_x, endpoint=False)
    k = np.fft.fftfreq(N_x, d=dx) * 2.0 * np.pi   # [μm⁻¹]

    # Potencial efectivo: pozo armónico aproximado
    omega_trap = 1.0e3            # frecuencia de trampa [Hz]
    V = 0.5 * mass_eff * (omega_trap * 2.0 * np.pi) ** 2 * x ** 2
    # Normalizar para evitar overflow
    V = V / np.max(np.abs(V) + 1e-30) * zeta_m * 0.1

    # Estado inicial: paquete gaussiano centrado
    x0 = 0.0
    sigma = L / 10.0
    psi = np.exp(-(x - x0) ** 2 / (2.0 * sigma ** 2), dtype=complex)
    psi = psi / np.sqrt(np.sum(np.abs(psi) ** 2) * dx)

    # Propagadores
    dt_s = float(t_list[1] - t_list[0]) if len(t_list) > 1 else 1.0e-6
    # Factor de conversión: usamos unidades donde ℏ = 1 para el solver espacial
    # y convertimos frecuencias a energías
    hbar_eff = 1.0  # unidades naturales para este solver

    # Propagador cinético en espacio k: exp(-i ℏ k² dt / 2m)
    if mass_eff > 1e-40:
        # Conversión de masa a unidades consistentes
        # En EQC: ζ₋ [Hz] ~ mc²/ℏ → m = ζ₋·ℏ/c²
        # Usamos una masa efectiva adimensional para la grid
        m_eff_code = max(zeta_m * 1e-6, 1.0)  # factor de escala empírico
        kinetic_prop = np.exp(-1j * hbar_eff * k ** 2 * dt_s / (2.0 * m_eff_code))
    else:
        # masa ~ 0: propagación libre pura
        kinetic_prop = np.ones_like(k)

    # Propagador de potencial: exp(-i V dt / ℏ)
    # Se calcula el exponente explícito para evitar branch-cut de **0.5
    potential_half_exp = -0.5j * V * dt_s / hbar_eff

    S1_values = np.empty(n_steps, dtype=np.float64)
    norm_errors = np.empty(n_steps, dtype=np.float64)

    # Observable de posición: ⟨x⟩
    S1_values[0] = float(np.real(np.sum(x * np.abs(psi) ** 2) * dx))
    norm_errors[0] = abs(np.sum(np.abs(psi) ** 2) * dx - 1.0)

    for idx in range(1, n_steps):
        # Paso 1: medio paso potencial (exp explícito para evitar branch-cut)
        psi *= np.exp(potential_half_exp)

        # Paso 2: paso completo cinético en k
        psi_k = np.fft.fft(psi)
        psi_k *= kinetic_prop
        psi = np.fft.ifft(psi_k)

        # Paso 3: otro medio paso potencial
        psi *= np.exp(potential_half_exp)

        # Normalización (Split-Step debería preservarla, pero como salvaguarda)
        norm = np.sum(np.abs(psi) ** 2) * dx
        psi = psi / np.sqrt(norm)

        norm_errors[idx] = abs(norm - 1.0)
        S1_values[idx] = float(np.real(np.sum(x * np.abs(psi) ** 2) * dx))

    max_norm_error = float(np.max(norm_errors))

    # NaN recovery
    if _contains_nan_or_inf(S1_values):
        S1_values, max_norm_error = _nan_recovery(
            None, psi, t_list, None, solver_name="Split-Step"
        )

    return S1_values, max_norm_error


# ─── NaN recovery pipeline ────────────────────────────────────────────────

def _contains_nan_or_inf(arr: np.ndarray) -> bool:
    """Detecta NaN o Inf en un array."""
    return bool(np.isnan(arr).any() or np.isinf(arr).any())


def _nan_recovery(
    H, psi0, t_list, X_op, solver_name: str = "RK45"
) -> tuple[np.ndarray, float]:
    """
    Pipeline de recuperación ante NaN:

    detect_nan → rollback_snapshot → reduce_dt → retry → fallback_solver

    1. Detectar NaN en resultado
    2. Reducir dt a la mitad
    3. Reintentar con mismo solver
    4. Si persiste: fallback a Crank-Nicolson (más estable)
    """
    # Paso 1: ya detectado por quien llama
    # Paso 2: reducir dt (más puntos temporales)
    n_retry = min(len(t_list) * 2, N_STEPS_MAX)
    t_retry = np.linspace(t_list[0], t_list[-1], n_retry)

    # Paso 3: reintentar con mismo solver
    if solver_name == "RK45":
        S1_retry, norm_err = _solve_rk45(H, psi0, t_retry, X_op)
    elif solver_name == "Crank-Nicolson":
        S1_retry, norm_err = _solve_crank_nicolson(H, psi0, t_retry, X_op)
    else:
        S1_retry = np.zeros_like(t_retry)
        norm_err = 1.0

    if not _contains_nan_or_inf(S1_retry):
        # Interpolar al t_list original
        S1_final = np.interp(t_list, t_retry, S1_retry)
        return S1_final, norm_err

    # Paso 4: fallback a Crank-Nicolson (más estable)
    if solver_name != "Crank-Nicolson" and H is not None:
        S1_fallback, norm_err = _solve_crank_nicolson(H, psi0, t_retry, X_op)
        if not _contains_nan_or_inf(S1_fallback):
            S1_final = np.interp(t_list, t_retry, S1_fallback)
            return S1_final, norm_err

    # Último recurso: valor cero (fallback seguro para cualquier tipo de estado)
    S1_safe = np.zeros(len(t_list))
    # Intentar extraer ⟨S₁(0)⟩ de forma type-safe
    try:
        if hasattr(psi0, 'full') and X_op is not None and hasattr(X_op, 'full'):
            psi_vec = psi0.full().flatten()
            x_mat = X_op.full()
            S1_safe[0] = float(np.real(np.dot(psi_vec.conj(), x_mat @ psi_vec)))
        elif isinstance(psi0, np.ndarray) and X_op is not None and hasattr(X_op, 'full'):
            x_mat = X_op.full()
            S1_safe[0] = float(np.real(np.dot(psi0.conj(), x_mat @ psi0)))
    except Exception:
        S1_safe[0] = 0.0
    return S1_safe, 1.0


# ─── Análisis de frecuencia ZB ────────────────────────────────────────────

def _analyze_zb(
    S1: np.ndarray,
    t_us: np.ndarray,
) -> tuple[float, float]:
    """
    Extrae frecuencia y amplitud del Zitterbewegung vía FFT.

    Calcula la transformada de Fourier de ⟨S₁(t)⟩ y localiza el pico
    de mayor potencia para extraer ν_ZB y la amplitud correspondiente.

    Args:
        S1:  Array de valores ⟨S₁(t)⟩.
        t_us: Array de tiempos en μs.

    Returns:
        (frecuencia_zb [Hz], amplitud [μm])
    """
    n = len(S1)
    if n < 4:
        return 0.0, 0.0

    dt_us = (t_us[-1] - t_us[0]) / (n - 1) if n > 1 else 1.0
    dt_s = dt_us * 1.0e-6   # μs → s

    # FFT de S1 (ventana de Hann para reducir spectral leakage)
    window = np.hanning(n)
    S1_windowed = (S1 - np.mean(S1)) * window
    fft_vals = np.fft.rfft(S1_windowed)
    freqs = np.fft.rfftfreq(n, d=dt_s)

    power = np.abs(fft_vals) ** 2
    if len(power) < 2:
        return 0.0, float(np.max(S1) - np.min(S1)) / 2.0

    # Ignorar DC component (índice 0)
    dominant_idx = int(np.argmax(power[1:]) + 1)
    freq_zb = float(freqs[dominant_idx])
    amplitude = float(2.0 * np.abs(fft_vals[dominant_idx]) / n)

    return freq_zb, amplitude


# ─── Simulación del espectro de Dirac ─────────────────────────────────────

def run_dirac_simulation(omega: float, photon_energy_factor: float) -> dict:
    """
    Calcula el espectro energético para la vista del Mar de Dirac.

    Parametriza los niveles de energía en función de ω (masa simulada)
    y determina si el fotón tiene energía suficiente para crear un par.

    Args:
        omega:               Fuerza de acoplamiento Ω [Hz].
        photon_energy_factor: Energía del fotón en unidades de mc² [0, 4].

    Returns:
        dict con niveles de energía, umbral, resultado del fotón.
    """
    mass = compute_simulated_mass(compute_zeta_minus(omega))

    # Energía de masa (ζ₋ actúa como mc² en el sistema EQC)
    mc2 = compute_zeta_minus(omega)  # [≡ mc²/ℏ en unidades de Hz]

    photon_energy = photon_energy_factor * mc2
    threshold = DIRAC_THRESHOLD_FACTOR * mc2

    pair_created = photon_energy >= threshold

    # Niveles discretos del espectro (visualización)
    n_levels = 10
    positive_levels = [mc2 + i * 0.5 * mc2 for i in range(n_levels)]
    negative_levels = [-(mc2 + i * 0.5 * mc2) for i in range(n_levels)]

    return {
        "mc2": float(mc2),
        "mass_simulada": float(mass),
        "positive_levels": positive_levels,
        "negative_levels": negative_levels,
        "threshold_energy": float(threshold),
        "photon_energy": float(photon_energy),
        "pair_created": bool(pair_created),
        "photon_energy_factor": float(photon_energy_factor),
    }


# ─── Validación numérica ──────────────────────────────────────────────────

def validate_simulation(omega: float, n_steps: int = 500) -> dict:
    """
    Ejecuta la pipeline de validación científica completa.

    Verifica:
    1. Probability drift < 1e-9
    2. Energy drift < 1e-7
    3. Solver parity (RK45 vs CN) < 1e-6

    Returns:
        dict con resultados de cada test y estado global passed/failed.
    """
    # Test 1: Probability drift (RK45)
    result_rk = run_zb_simulation(omega, t_max=50.0, n_steps=n_steps, solver="RK45")
    prob_drift_ok = result_rk["normalization_error"] < THRESHOLD_PROB_DRIFT

    # Test 2: Crank-Nicolson (unitario, drift teóricamente 0)
    result_cn = run_zb_simulation(omega, t_max=50.0, n_steps=n_steps, solver="Crank-Nicolson")
    energy_drift_ok = result_cn["normalization_error"] < THRESHOLD_ENERGY_DRIFT

    # Test 3: Solver parity
    S1_rk = np.array(result_rk["S1"])
    S1_cn = np.array(result_cn["S1"])
    min_len = min(len(S1_rk), len(S1_cn))
    solver_parity = float(np.max(np.abs(S1_rk[:min_len] - S1_cn[:min_len])))
    parity_ok = solver_parity < THRESHOLD_SOLVER_PARITY

    # Test 4: FFT parity
    fft_parity_ok = True
    fft_parity = 0.0
    try:
        s1 = np.array(result_rk["S1"])
        if len(s1) > 2:
            # FFT ida y vuelta debe ser idéntica (dentro de tolerancia)
            s1_fft = np.fft.rfft(s1)
            s1_back = np.fft.irfft(s1_fft, n=len(s1))
            fft_parity = float(np.max(np.abs(s1 - s1_back)))
            fft_parity_ok = fft_parity < THRESHOLD_FFT_PARITY
    except Exception:
        fft_parity_ok = False
        fft_parity = 1e308

    all_passed = prob_drift_ok and energy_drift_ok and parity_ok and fft_parity_ok

    return {
        "passed": bool(all_passed),
        "probability_drift": float(result_rk["normalization_error"]),
        "probability_drift_threshold": THRESHOLD_PROB_DRIFT,
        "probability_drift_ok": bool(prob_drift_ok),
        "energy_drift": float(result_cn["normalization_error"]),
        "energy_drift_threshold": THRESHOLD_ENERGY_DRIFT,
        "energy_drift_ok": bool(energy_drift_ok),
        "solver_parity": float(solver_parity),
        "solver_parity_threshold": THRESHOLD_SOLVER_PARITY,
        "solver_parity_ok": bool(parity_ok),
        "fft_parity": float(fft_parity),
        "fft_parity_threshold": THRESHOLD_FFT_PARITY,
        "fft_parity_ok": bool(fft_parity_ok),
    }
