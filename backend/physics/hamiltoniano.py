"""
Hamiltoniano H₁D del modelo EQC.

Implementa el Hamiltoniano efectivo de la Ecuación 4.46 del documento de
Juan Gallardo, que es matemáticamente equivalente al Hamiltoniano de la
ecuación de Dirac en 1+1 dimensiones.

Referencia: Propuesta PDF §4, Ecuación 4.46.
Método numérico: QuTiP tensor product operators.
"""

import qutip as qt
from .constants import (
    LAMBDA_A, DELTA_A, R_A, N_FOCK,
)


def compute_zeta_prime() -> float:
    """
    Calcula ζ₊′ — parámetro de acoplamiento FIJO en el modelo EQC.

    En el mapeo EQC → Dirac 1+1D, ζ₊′ actúa como la 'velocidad de la luz'
    simulada: controla la amplitud del acoplamiento campo-espín.
    Es CONSTANTE (no depende de Ω): ζ₊′ = λₐ² / Δₐ.

    Referencia: Propuesta PDF §4 — régimen dispersivo.

    Returns:
        ζ₊′ [Hz] — acoplamiento fijo λₐ²/Δₐ.
    """
    # ζ₊′ = λₐ² / Δₐ  — acoplamiento campo-espín dispersivo [Hz]
    return (LAMBDA_A ** 2) / DELTA_A  # = (5e4)²/2e6 = 1250 Hz


def compute_zeta_minus(omega: float) -> float:
    """
    Calcula ζ₋ — parámetro de masa simulada que varía con Ω.

    En el mapeo EQC → Dirac 1+1D, ζ₋ actúa como mc²/ℏ:
    controla la frecuencia del Zitterbewegung ω_ZB = 2ζ₋.
    Para partícula sin masa: Ω=0 → ζ₋=0 → sin ZB.
    Para partícula masiva:   Ω>0 → ζ₋>0 → ZB visible.

    Args:
        omega: Fuerza de acoplamiento clásica Ω [Hz], rango [0, 10⁵].

    Returns:
        ζ₋ [Hz] — masa simulada.
    """
    # ζ₋ = (Ω / Δₐ) · λₐ  — masa proporcional a Ω [Hz]
    return (omega / DELTA_A) * LAMBDA_A


def compute_simulated_mass(zeta_minus: float) -> float:
    """
    Masa simulada en unidades naturales del sistema.

    m = ζ₋ / (Δₐ · Rₐ · λₐ²)²

    donde ζ₋ = (Ω/Δₐ)·λₐ es el parámetro de masa que varía con Ω.

    Args:
        zeta_minus: Parámetro de masa ζ₋ [Hz].

    Returns:
        Masa simulada m [unidades naturales del sistema].
    """
    denom = (DELTA_A * R_A * LAMBDA_A**2) ** 2
    if denom == 0.0:
        return 0.0
    return zeta_minus / denom


def build_hamiltonian(omega: float) -> qt.Qobj:
    """
    Construye el Hamiltoniano H₁D del sistema EQC.

    El Hamiltoniano efectivo en el régimen dispersivo toma la forma:
        H₁D = ζ₊′((a + a†) ⊗ Sx) + ζ₋(I ⊗ Sz)
    que es el análogo cuántico-óptico del Hamiltoniano de Dirac 1+1.

    Convención:
        - Espacio de Fock: N_FOCK niveles, base {|0⟩,...,|N-1⟩}
        - Espacio atómico: qubit de 2 niveles {|e⟩, |g⟩}
        - Orden tensor: campo ⊗ átomo

    Args:
        omega: Fuerza de acoplamiento Ω [Hz].

    Returns:
        Objeto QuTiP Qobj representando H₁D.
    """
    # Operadores del campo de la cavidad (espacio de Fock)
    a = qt.destroy(N_FOCK)          # operador de aniquilación
    a_dag = qt.create(N_FOCK)       # operador de creación
    I_field = qt.qeye(N_FOCK)       # identidad del campo

    # Operadores del átomo (qubit de 2 niveles)
    Sx = qt.sigmax() / 2.0          # Sx = σₓ/2
    Sz = qt.sigmaz() / 2.0          # Sz = σ_z/2
    I_atom = qt.qeye(2)             # identidad atómica

    # ζ₊′ — acoplamiento campo-espín FIJO (análogo a 'c_sim'):
    zeta_prime = compute_zeta_prime()  # = λₐ²/Δₐ = 1250 Hz (constante)

    # ζ₋ — término de masa que varía con Ω (análogo a mc²/ℏ):
    # Para Ω=0: ζ₋=0 → partícula sin masa → S₁=0 (sin ZB)
    # Para Ω>0: ζ₋>0 → partícula masiva → ZB visible en ⟨σ_y⟩
    zeta_minus = compute_zeta_minus(omega)

    # H1D = zeta_prime * (a + a_dag) x Sx + zeta_minus * (I_field x Sz)
    H_interaction = zeta_prime * qt.tensor(a + a_dag, Sx)
    H_mass = zeta_minus * qt.tensor(I_field, Sz)

    H = H_interaction + H_mass
    return H


def build_initial_state() -> qt.Qobj:
    """
    Estado inicial del sistema: |ψ(0)⟩ = |0⟩ ⊗ (|e⟩ + |g⟩) / √2.

    - |0⟩: estado vacío del campo de la cavidad (cero fotones)
    - (|e⟩ + |g⟩)/√2: superposición de estado excitado y fundamental del átomo

    Returns:
        Objeto QuTiP Qobj representando |ψ(0)⟩.
    """
    # |0⟩ — estado de vacío del campo (primer elemento de la base de Fock)
    vacuum = qt.basis(N_FOCK, 0)

    # |e⟩ = [1, 0]ᵀ  (excited)
    e_state = qt.basis(2, 0)
    # |g⟩ = [0, 1]ᵀ  (ground)
    g_state = qt.basis(2, 1)

    # Superposición atómica normalizada
    atom_superposition = (e_state + g_state).unit()

    # Estado total: producto tensorial campo ⊗ átomo
    psi0 = qt.tensor(vacuum, atom_superposition)
    return psi0


def build_spin_observable() -> qt.Qobj:
    """
    Observable de Zitterbewegung: S1 = Ra . I_campo . sigma_y.

    En el mapeo EQC -> Dirac 1+1D, el ZB aparece en la componente
    de espin <sigma_y>(t), que:
      - Es exactamente 0 para particula sin masa (zeta_minus=0)
      - Oscila con amplitud creciente al aumentar zeta_minus (masa)
      - Distingue claramente los regimenes masico y sin masa

    Nota: <(a+a+)> = 0 en todo momento para el estado inicial
    |0_fock>|+x> con este Hamiltoniano (conservado exactamente),
    por lo que sigma_y es el observable correcto para el ZB.

    Returns:
        Objeto QuTiP Qobj representando S1 = Ra . (I_campo . sigma_y).
    """
    I_field = qt.qeye(N_FOCK)
    sigma_y = qt.sigmay()  # σ_y — componente spin-y del qubit

    S1_op = R_A * qt.tensor(I_field, sigma_y)
    return S1_op
