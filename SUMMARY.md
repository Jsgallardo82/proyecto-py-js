# Project State — Zitterbewegung & Dirac Sea

## MVP Architecture (Engine Spec v6.0)

### Backend (FastAPI)
- `POST /simulate/zb` — Zitterbewegung (RK45 / Crank-Nicolson) ✓
- `POST /simulate/dirac` — Dirac sea spectrum E(k) ✓
- `POST /validate` — solver validation pipeline ✓
- `POST /benchmark` — performance benchmark ✓
- `GET /health`, `GET /presets` ✓
- Tests: 18 passing

### Frontend (Next.js 14)
- **SimulatorCanvas** — ZB animation canvas (wavefunction, probability) ✓
- **DiracSeaView** — Dirac sea spectrum renderer ✓
  - Polygon gradient fill + DoS-weighted dot grid (120×8 samples)
  - Dispersion curves on top
  - ZB-frequency pulsing per k-state
  - Pair creation overlay (photon → electron–positron)
- **BottomBar** — Play/Pause/Reset + Notebook ✓
  - Fixed: play button now tab-aware, calls `simulateDirac()` on Dirac tab
- **DiracSea3D** — Three.js 3D visualization ✓
- **TelemetryPanel**, **ProbabilityChart**, **DataDashboard** ✓
- **NotebookView** — interactive pedagogical notebook ✓
- **AtomicConfig**, **MissionsPanel**, **OnboardingOverlay** ✓
- Tests: builds clean (0 errors)

### Infrastructure
- Dockerfile (multi-stage), docker-compose-ready, start-*.sh scripts
- AGENTS.md with repo conventions for AI-assisted dev

### Fixes Implemented
- **DiracSeaView redesign** (May 2026): polygon gradient fill + DoS-weighted dot grid + ZB frequency pulsing
- **Play button bug** (May 2026): BottomBar now checks `activeTab === 'dirac'` before calling simulate
- **Canvas hardening** (May 2026): try/catch in rAF loop + Math.round for sub-pixel canvas sizing
