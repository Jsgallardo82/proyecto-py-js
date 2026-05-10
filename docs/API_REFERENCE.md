# API Reference — Zitterbewegung Engine Lite v6.0

Documentacion tecnica del backend FastAPI para el equipo de frontend.

**Base URL:** `http://localhost:8000`  
**CORS:** Permitido desde `http://localhost:3000` (Next.js dev server).  
**OpenAPI:** Disponible en `/docs` (Swagger UI) y `/redoc` (ReDoc).

---

## Indice

1. [Resumen de Endpoints](#resumen-de-endpoints)
2. [Simulacion ZB](#post-simulatezb)
3. [Simulacion Dirac](#post-simulatedirac)
4. [Exportacion](#post-simulatezbexport)
5. [Validacion Cientifica](#post-validate)
6. [Benchmark](#post-benchmark)
7. [Presets](#get-presets)
8. [Health Check](#get-health)
9. [Replay](#post-replayverify)
10. [Constantes del Motor](#constantes-del-motor)
11. [Esquemas Pydantic](#esquemas-pydantic)
12. [Manejo de Errores](#manejo-de-errores)

---

## Resumen de Endpoints

| Metodo | Endpoint | Tags | Descripcion |
|--------|----------|------|-------------|
| POST | `/simulate/zb` | simulation | Evolucion cuantica del Zitterbewegung |
| POST | `/simulate/dirac` | simulation | Espectro energetico del Mar de Dirac |
| POST | `/simulate/zb/export` | simulation | Exporta resultados en CSV/JSON/MsgPack/Binary |
| POST | `/validate` | validation | Verificacion numerica completa (4 tests) |
| POST | `/benchmark` | validation | Profiling de performance (steps/segundo) |
| GET | `/presets` | presets | 5 escenarios educativos predefinidos |
| GET | `/health` | health | Estado del servidor y version |
| POST | `/replay/verify` | replay | Verifica reproducibilidad bit-exacta |
| POST | `/replay/import` | replay | Importa archivo `.zbw` binario |

---

## POST /simulate/zb

Ejecuta la simulacion del Efecto Zitterbewegung. Resuelve la ecuacion de Schrodinger con el Hamiltoniano H_1D del modelo EQC y devuelve el observable de posicion `S1(t)` = R_a * <a^dagger + a>.

### Request Body

```typescript
interface ZBSimulationRequest {
  omega: number;        // Fuerza de acoplamiento Omega [Hz]. Rango: [1e4, 1e5]
  omega1?: number;      // Variante Omega1 (opcional, para futuros features)
  omega2?: number;      // Variante Omega2 (opcional, para futuros features)
  t_max: number;        // Tiempo maximo de simulacion [us]. Rango: [1.0, 5000.0]. Default: 5000.0
  n_steps: number;      // Numero de pasos temporales. Rango: [100, 5000]. Default: 2000
  solver: "RK45" | "Crank-Nicolson" | "Split-Step";  // Metodo numerico. Default: "RK45"
}
```

**Nota sobre solvers:**

- **RK45**: QuTiP `sesolve` con Runge-Kutta adaptivo. Rapido pero NO preserva unitariedad exacta. Requiere renormalizacion post-proceso. Tolerancias: `rtol=1e-9`, `atol=1e-9`. Ideal para interactividad pedagogica.
- **Crank-Nicolson**: Implicito, unitario por construccion, preserva energia incondicionalmente. Complejidad O(N^2). Mas estable ante mass grandes. Ideal para validacion cientifica.
- **Split-Step Fourier**: Metodo espectral en grid espacial 1D (512 puntos). FFT para propagacion cinética. Excelente para visualizacion de paquetes de onda. Ideal para vista 3D y analisis espectral.

### Response Body

```typescript
interface ZBSimulationResponse {
  t: number[];               // Array de tiempos en microsegundos [us]. Longitud = n_steps
  S1: number[];              // Array de posiciones <S1(t)> en micrometros [um]. Longitud = n_steps
  frecuencia_zb: number;     // Frecuencia dominante extraida por FFT [Hz]
  amplitud: number;          // Amplitud de oscilacion estimada [um]
  masa_simulada: number;     // Masa efectiva simulada [unidades naturales EQC]
  solver_used: string;       // Nombre del solver realmente utilizado
  normalization_error: number;  // Maximo drift de ||psi||^2 respecto a 1.0
  elapsed_ms: number;        // Tiempo de computacion del backend [ms]
  n_steps: number;           // Pasos temporales efectivos
  t_max: number;             // Tiempo maximo efectivo [us]
  omega: number;             // Omega efectivo (clamped si fue necesario)
  checksum: string;          // XXHash64 de los primeros 10 puntos de S1 (deterministico)
  build_hash: string;        // Version del motor (ej: "v6.0.0")
}
```

### Ejemplo con fetch

```typescript
const res = await fetch("http://localhost:8000/simulate/zb", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    omega: 50000,
    t_max: 200,
    n_steps: 1000,
    solver: "RK45",
  }),
});

const data: ZBSimulationResponse = await res.json();
```

---

## POST /simulate/dirac

Calcula el espectro energetico del Mar de Dirac. Determina si un foton incidente tiene energia suficiente para crear un par electron-positron.

### Request Body

```typescript
interface DiracSimulationRequest {
  omega: number;                // Fuerza de acoplamiento Omega [Hz]. Rango: [1e4, 1e5]
  photon_energy_factor: number; // Energia del foton en unidades de mc^2. Rango: [0.0, 4.0]. Default: 1.5
}
```

**Fisica:** El umbral de creacion de pares es `E_threshold = 2 * mc^2` (factor 2.0 configurable en `DIRAC_THRESHOLD_FACTOR`). Si `photon_energy_factor >= 2.0`, el foton crea un par.

### Response Body

```typescript
interface DiracSimulationResponse {
  mc2: number;                  // Energia de masa efectiva mc^2 [Hz]
  mass_simulada: number;        // Masa simulada [kg]
  positive_levels: number[];    // 10 niveles de energia positiva [Hz]
  negative_levels: number[];    // 10 niveles de energia negativa [Hz]
  threshold_energy: number;     // Energia umbral para creacion de pares [Hz]
  photon_energy: number;        // Energia del foton incidente [Hz]
  pair_created: boolean;        // true si photon_energy >= threshold_energy
  photon_energy_factor: number; // Factor recibido (eco)
}
```

### Ejemplo con fetch

```typescript
const res = await fetch("http://localhost:8000/simulate/dirac", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    omega: 50000,
    photon_energy_factor: 2.5,  // > 2.0 → crea par
  }),
});

const data: DiracSimulationResponse = await res.json();
```

---

## POST /simulate/zb/export

Ejecuta la misma simulacion que `/simulate/zb` pero devuelve los datos en formato descargable.

### Query Parameters

| Parametro | Tipo | Descripcion |
|-----------|------|-------------|
| `format` | string | `csv` | `json` | `msgpack` | `binary` |

### Request Body

Identico a `ZBSimulationRequest`.

### Response

- **`csv`**: `text/csv` con headers `t_us,S1_um`. Descarga directa con `Content-Disposition: attachment`.
- **`json`**: `application/json` con estructura `{ metadata: Snapshot, data: { t, S1 } }`.
- **`msgpack`**: `application/msgpack` (binario compacto, ideal para runtime WASM).
- **`binary`**: `application/octet-stream` con formato `.zbw` (header 64B + snapshot JSON + arrays Float64).

### Ejemplo de descarga CSV

```typescript
const res = await fetch("http://localhost:8000/simulate/zb/export?format=csv", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ omega: 50000, t_max: 200, n_steps: 1000, solver: "RK45" }),
});

const blob = await res.blob();
const url = URL.createObjectURL(blob);
const a = document.createElement("a");
a.href = url;
a.download = "zitterbewegung.csv";
a.click();
```

---

## POST /validate

Pipeline de validacion cientifica completa. Ejecuta 4 tests numericos y devuelve un reporte detallado.

### Request Body

```typescript
interface ValidateRequest {
  omega: number;    // Rango: [1e4, 1e5]
  n_steps: number;  // Rango: [50, 2000]. Default: 500
}
```

### Response Body

```typescript
interface ValidateResponse {
  passed: boolean;                    // true si TODOS los tests pasan
  probability_drift: number;          // Drift maximo de probabilidad (RK45)
  probability_drift_threshold: number; // Umbral: 1e-9
  probability_drift_ok: boolean;
  energy_drift: number;               // Drift maximo de energia (Crank-Nicolson)
  energy_drift_threshold: number;     // Umbral: 1e-7
  energy_drift_ok: boolean;
  solver_parity: number;              // Maxima diferencia RK45 vs CN
  solver_parity_threshold: number;    // Umbral: 1e-6
  solver_parity_ok: boolean;
  fft_parity: number;                 // Divergencia FFT ida-vuelta
  fft_parity_threshold: number;       // Umbral: 1e-8
  fft_parity_ok: boolean;
}
```

**Interpretacion para UI:**

- `probability_drift_ok`: Si falla, el solver RK45 perdio precision. Sugerir usar Crank-Nicolson.
- `energy_drift_ok`: Si falla, hay error numerico grave. Reportar como bug.
- `solver_parity_ok`: Si falla, RK45 y CN divergen significativamente. Verificar parametros.
- `fft_parity_ok`: Si falla, la FFT introdujo artefactos numericos.

### Ejemplo

```typescript
const res = await fetch("http://localhost:8000/validate", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ omega: 50000, n_steps: 500 }),
});
const data: ValidateResponse = await res.json();
console.log(data.passed ? "VALIDACION EXITOSA" : "VALIDACION FALLIDA");
```

---

## POST /benchmark

Mide el rendimiento del motor de simulacion.

### Request Body

```typescript
interface BenchmarkRequest {
  omega: number;    // Rango: [1e4, 1e5]
  n_steps: number;  // Rango: [50, 1000]. Default: 200
  solver: "RK45" | "Crank-Nicolson";  // Split-Step no soportado en benchmark
}
```

### Response Body

```typescript
interface BenchmarkResponse {
  elapsed_ms: number;         // Tiempo total de simulacion [ms]
  steps_per_second: number;   // Throughput: n_steps / (elapsed_ms / 1000)
  solver: string;
  n_steps: number;
  omega: number;
  normalization_error: number;
}
```

**Nota:** El benchmark siempre ejecuta con `t_max = 50.0 us` para normalizar resultados entre corridas.

---

## GET /presets

Devuelve los 5 escenarios educativos preconfigurados.

### Response Body

```typescript
interface PresetScenario {
  id: number;
  name: string;
  description: string;
  omega: number;
  t_max: number;
  n_steps: number;
  solver: string;
  pedagogy_level: "Beginner" | "Academic" | "Advanced";
}

interface PresetsResponse {
  presets: PresetScenario[];
}
```

**Escenarios incluidos:**

1. **Particula sin masa** (`omega = 1e4`): Trayectoria recta sin oscilaciones. Solver RK45.
2. **Anadiendo masa** (`omega = 5e4`): Ondulacion gradual. Solver RK45.
3. **El Mar de Dirac** (`omega = 8e4`): Interferencia positivo-negativo. Solver Crank-Nicolson.
4. **Modo FFT** (`omega = 6e4`): Analisis espectral con alta resolucion. Solver RK45, 2000 steps.
5. **Comparacion de Solvers** (`omega = 5e4`): Superposicion RK45 vs CN. Solver RK45.

---

## GET /health

Endpoint de estado del servidor.

### Response Body

```typescript
interface HealthResponse {
  status: "ok";
  version: "6.0.0";
  backend: "FastAPI + QuTiP";
}
```

---

## POST /replay/verify

Verifica que un replay reproduce exactamente los mismos datos que el original (divergencia < 1e-10).

### Request Body

```typescript
interface ReplayVerifyRequest {
  S1_original: number[];  // Datos S1 del original
  S1_replayed: number[];  // Datos S1 del replay
}
```

### Response Body

```typescript
interface ReplayVerifyResponse {
  passed: boolean;       // true si divergencia < 1e-10
  divergence: number;    // Maxima diferencia absoluta |S1_orig - S1_replay|
  max_allowed: number;   // 1e-10
  length_compared: number;  // min(len(S1_original), len(S1_replayed))
}
```

---

## POST /replay/import

Importa un archivo binario `.zbw` (formato propietario de replay) y devuelve los datos.

### Request

Content-Type: `multipart/form-data`  
Campo: `file` (archivo `.zbw`)

### Response Body

```typescript
interface ReplayImportResponse {
  snapshot: object;   // Metadata completa del snapshot
  t: number[];        // Array de tiempos
  S1: number[];       // Array de posiciones
}
```

**Formato binario `.zbw`:**

```
[header 64B]  → magic="ZBWREPLY" (8B) + lens_snapshot(8B) + lens_t(8B) + lens_S1(8B)
[snapshot JSON]
[t array: Float64 * n_steps]
[S1 array: Float64 * n_steps]
```

---

## Constantes del Motor

Valores exportados desde `backend/physics/constants.py` utiles para validacion en frontend.

| Constante | Valor | Descripcion |
|-----------|-------|-------------|
| `OMEGA_MIN` | 1.0e4 | Omega minimo [Hz] → masa ~ 0 |
| `OMEGA_MAX` | 1.0e5 | Omega maximo [Hz] → masa grande |
| `OMEGA_DEFAULT` | 5.0e4 | Omega por defecto |
| `T_MAX_DEFAULT` | 5000.0 | Tiempo maximo por defecto [us] |
| `T_MAX_LIMIT` | 5000.0 | Limite de seguridad [us] |
| `N_STEPS_DEFAULT` | 2000 | Pasos por defecto |
| `N_STEPS_MAX` | 5000 | Maximo de pasos |
| `THRESHOLD_PROB_DRIFT` | 1.0e-9 | Umbral drift probabilidad |
| `THRESHOLD_ENERGY_DRIFT` | 1.0e-7 | Umbral drift energia |
| `THRESHOLD_SOLVER_PARITY` | 1.0e-6 | Umbral paridad solvers |
| `THRESHOLD_FFT_PARITY` | 1.0e-8 | Umbral paridad FFT |
| `DIRAC_THRESHOLD_FACTOR` | 2.0 | Factor umbral creacion de pares (E >= 2*mc^2) |
| `RK45_RTOL` | 1.0e-9 | Tolerancia relativa RK45 |
| `RK45_ATOL` | 1.0e-9 | Tolerancia absoluta RK45 |
| `N_FOCK` | 20 | Dimension del espacio de Fock |
| `R_A` | 1.0 | Constante de escala [um] |
| `C_SIM` | 1.25 | Velocidad de la luz simulada [um*kHz] |

**Mapeo conceptual EQC ↔ Dirac:**

| Parametro EQC | Analogo Dirac | Rol fisico |
|---------------|---------------|------------|
| zeta_prime = lambda_a^2 / Delta_a | c (velocidad de la luz) | Acoplamiento campo-espin, constante |
| zeta_minus = (Omega/Delta_a) * lambda_a | mc^2 / hbar | Masa efectiva, proporcional a Omega |
| omega_zb = 2 * zeta_minus | 2*mc^2/hbar | Frecuencia del Zitterbewegung |
| S1(t) = R_a * <sigma_y> | x(t) | Posicion/tremor del electron |

---

## Manejo de Errores

Todos los endpoints devuelven errores HTTP estandar con el siguiente formato:

```json
{
  "detail": "Mensaje descriptivo del error"
}
```

| Codigo | Situacion |
|--------|-----------|
| `400` | Parametros fuera de rango (validacion Pydantic) |
| `422` | Body JSON malformado o tipos incorrectos |
| `500` | Error interno del motor (QuTiP, NumPy, NaN recovery fallido) |

**Notas sobre resiliencia:**

- El backend tiene un pipeline de `NaN recovery`: si RK45 diverge, reduce dt a la mitad y reintenta. Si persiste, hace fallback a Crank-Nicolson.
- Si todo falla, devuelve `S1 = [0, 0, ..., 0]` con `normalization_error = 1.0`.
- El frontend debe manejar `normalization_error > 1e-6` como senal de alerta de precision.

---

## Workflow tipico del Frontend

```
1. Inicio → GET /health (verificar backend activo)
2. Usuario ajusta sliders → valores clamped localmente con OMEGA_MIN/MAX
3. PLAY → POST /simulate/zb (o /dirac segun tab activa)
4. Recibir response → renderizar canvas con t[] y S1[]
5. Telemetry → mostrar frecuencia_zb, amplitud, normalization_error
6. VALIDATE → POST /validate (si usuario lo solicita)
7. BENCHMARK → POST /benchmark (si usuario lo solicita)
8. EXPORT → POST /simulate/zb/export?format=csv
9. Dirac Sea → POST /simulate/dirac con photon_energy_factor
10. Replay → POST /replay/verify para comparar dos corridas
```

---

## Archivos relacionados

- `backend/main.py` — Entrypoint FastAPI, CORS, routers
- `backend/routes/simulate.py` — Logica de /simulate/zb, /simulate/dirac, /export
- `backend/routes/validate.py` — Logica de /validate y /benchmark
- `backend/routes/presets.py` — 5 escenarios predefinidos
- `backend/routes/replay.py` — Import/export de replays binarios
- `backend/models/schemas.py` — Esquemas Pydantic (request/response)
- `backend/physics/engine.py` — Motor cuantico (RK45, CN, Split-Step)
- `backend/physics/hamiltoniano.py` — Construccion de H_1D y operadores
- `backend/physics/snapshots.py` — Exportacion CSV/JSON/MsgPack/Binary
- `backend/physics/constants.py` — Constantes fisicas y umbrales

---

*Documentacion generada para Zitterbewegung Engine Lite v6.0. Juan Gallardo · IUB 2026.*
