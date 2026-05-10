# Zitterbewegung Engine Lite v6.0

Simulador científico educativo del efecto **Zitterbewegung** (ZB) — vibración trémula predicha por la ecuación de Dirac para el electrón relativista libre.

**Juan Gallardo · IUB 2026**

---

## Stack

| Capa | Tecnología |
|------|-----------|
| Backend | FastAPI + QuTiP + SciPy + NumPy (Python 3.13) |
| Frontend | Next.js 15 + React 19 + Tailwind CSS v4 |
| Renderer | HTML5 Canvas2D (60 FPS) |

## Instalación rápida

### Backend (Python)

```bash
# Crear entorno virtual (si no existe)
python3 -m venv .venv
source .venv/bin/activate

# Instalar dependencias
pip install -r backend/requirements.txt

# Iniciar servidor
./start-backend.sh
# o directamente:
uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```

### Frontend (Node.js)

```bash
cd frontend
npm install
npm run dev
```

O con el script raíz:

```bash
./start-frontend.sh
```

## Acceso

- **App**: http://localhost:3000
- **API docs**: http://localhost:8000/docs
- **Health check**: http://localhost:8000/health

## Las 3 vistas

1. **Data Dashboard** — Gráfica `⟨S₁(t)⟩` vs tiempo + configuración atómica + probabilidad
2. **Particle View** — Electrón con rastro ZB + baseline sin masa
3. **Dirac Sea View** — Mar de Dirac + fotón + creación de pares

## Física central

- Estado inicial: `|ψ(0)⟩ = |0⟩ ⊗ (|e⟩+|g⟩)/√2`
- Hamiltoniano: `H₁D = ζ₊′·(Sx⊗(a+a†)) + ζ₋·(Sz⊗I)`
- Observable: `⟨S₁(t)⟩ = Rₐ · ⟨a† + a⟩`
- Constantes: `λ=10⁵ Hz`, `λₐ=λ/2`, `Δₐ=20λ`, `Rₐ=1.0 μm`, `N_FOCK=20`
- Solvers: RK45 (QuTiP sesolve, rtol=1e-9) · Crank-Nicolson (implícito, unitario)

## Validación

```bash
# Ejecutar validación completa
curl -X POST http://localhost:8000/validate \
  -H "Content-Type: application/json" \
  -d '{"omega": 50000, "n_steps": 1000}'
```

Thresholds Engine Spec v6.0:
- Probability drift `< 1e-9`
- Energy drift `< 1e-7`
- FFT parity `< 1e-8`

## Estructura

```
backend/
├── main.py                  # FastAPI app + CORS
├── physics/
│   ├── constants.py         # λ, λₐ, Δₐ, Rₐ, ℏ
│   ├── hamiltoniano.py      # H₁D, estado inicial, observable
│   └── engine.py            # Solvers RK45 + Crank-Nicolson + FFT
├── models/schemas.py        # Pydantic request/response
└── routes/
    ├── simulate.py          # POST /simulate/zb, /simulate/dirac
    ├── validate.py          # POST /validate, /benchmark
    └── presets.py           # GET /presets

frontend/src/
├── app/                     # Next.js App Router
├── components/              # DataDashboard, ParticleView, DiracSeaView, ...
├── context/                 # SimulationContext (useReducer)
└── hooks/                   # useSimulation (bootstrap, simulate, play, export)
```
