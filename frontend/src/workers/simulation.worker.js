/*
Web Worker del motor de simulacin ECS.

Implementa:
- Fixed timestep scheduler (120 Hz physics)
- Structure of Arrays (SoA) ECS runtime
- Zero-copy Float64Array transfer
- Comunicacin va postMessage

Referencia: Engine Spec v6.0 7 (ECS Runtime), 8 (WASM).
*/

// ─── Constantes ───────────────────────────────────────────────────────────

const FIXED_DT = 1 / 120; // 120 Hz physics
const MAX_ENTITIES = 1024;
const TRAIL_MAX_LEN = 100;

// ─── Telemetry label enum (numeric, not string) ───────────────────────────
const TEL_LABEL = {
  physics_step: 0,
  frame_draw: 1,
  gc_spike: 2,
};

// ─── Estado del motor ─────────────────────────────────────────────────────

let engineState = 'UNINITIALIZED';
let accumulator = 0;
let lastFrameTime = 0;

// ─── ECS: Structure of Arrays ─────────────────────────────────────────────

const ecs = {
  // Pool de entidades activas
  active: new Int32Array(MAX_ENTITIES),
  activeCount: 0,

  // Componente Transform: posicin (x, y)
  transform: {
    x: new Float64Array(MAX_ENTITIES),
    y: new Float64Array(MAX_ENTITIES),
  },

  // Componente Wavefunction: valor complejo (re, im)
  wave: {
    re: new Float64Array(MAX_ENTITIES),
    im: new Float64Array(MAX_ENTITIES),
  },

  // Componente Trail: historial de posiciones
  trail: {
    x: new Float64Array(MAX_ENTITIES * TRAIL_MAX_LEN),
    y: new Float64Array(MAX_ENTITIES * TRAIL_MAX_LEN),
    len: new Int32Array(MAX_ENTITIES),
    opacity: new Float64Array(MAX_ENTITIES * TRAIL_MAX_LEN),
  },

  // Componente Telemetry: RingBuffer circular
  telemetry: {
    buffer: new Float64Array(256),
    head: 0,
    size: 0,
  },
};

// ─── Arena Allocator ──────────────────────────────────────────────────────

const arena = {
  base: 0,
  offset: 0,
  alloc(bytes) {
    const ptr = this.base + this.offset;
    this.offset += (bytes + 15) & ~15; // 16-byte align
    return ptr;
  },
  reset() {
    this.offset = 0;
  },
};

// ─── Utilidades ───────────────────────────────────────────────────────────

function recordTelemetry(label, value) {
  const { buffer, head } = ecs.telemetry;
  buffer[head] = performance.now();
  buffer[(head + 1) % buffer.length] = TEL_LABEL[label] ?? 0;
  buffer[(head + 2) % buffer.length] = value;
  ecs.telemetry.head = (head + 3) % buffer.length;
  ecs.telemetry.size = Math.min(ecs.telemetry.size + 3, buffer.length);
}

function resetECS() {
  ecs.activeCount = 0;
  ecs.telemetry.head = 0;
  ecs.telemetry.size = 0;
  arena.reset();
}

// ─── Bootstrap pipeline (16 pasos) ────────────────────────────────────────

function bootstrap(config) {
  engineState = 'BOOTING';

  // 1. Browser inspection (no-op en Worker)
  // 2. Feature validation
  const hasOffscreenCanvas = typeof OffscreenCanvas !== 'undefined';
  const hasSIMD = false;

  // 3-5. Worker allocation ya est hecho (somos el Worker)
  // 6-7. WASM binary fetch / instantiation (placeholder)
  // 8. Arena allocators
  arena.base = 0;
  arena.reset();

  // 9. ECS initialization
  resetECS();

  // 10. Solver registry
  // 11. Validation engine
  // 12. Telemetry
  // 13. Renderer
  // 14. Visualization
  // 15. UI sync (no-op en Worker)

  // 16. Ready
  engineState = 'READY';
  self.postMessage({ type: 'ENGINE_READY', features: { hasOffscreenCanvas, hasSIMD } });
}

// ─── Physics step ─────────────────────────────────────────────────────────

function physicsStep(dt) {
  // Iterar solo entidades activas
  for (let i = 0; i < ecs.activeCount; i++) {
    const eid = ecs.active[i];
    // Placeholder: actualizar posicin segn simulacin
    // En implementacin real: llamar a solver WASM o recibir datos del backend
    ecs.transform.x[eid] += (Math.random() - 0.5) * 0.1;
    ecs.transform.y[eid] += (Math.random() - 0.5) * 0.1;

    // Actualizar trail
    const trailLen = ecs.trail.len[eid];
    const base = eid * TRAIL_MAX_LEN;
    if (trailLen < TRAIL_MAX_LEN) {
      ecs.trail.x[base + trailLen] = ecs.transform.x[eid];
      ecs.trail.y[base + trailLen] = ecs.transform.y[eid];
      ecs.trail.opacity[base + trailLen] = 1.0;
      ecs.trail.len[eid] = trailLen + 1;
    } else {
      // Desplazar trail
      for (let j = 0; j < TRAIL_MAX_LEN - 1; j++) {
        ecs.trail.x[base + j] = ecs.trail.x[base + j + 1];
        ecs.trail.y[base + j] = ecs.trail.y[base + j + 1];
        ecs.trail.opacity[base + j] = ecs.trail.opacity[base + j + 1] * 0.98;
      }
      ecs.trail.x[base + TRAIL_MAX_LEN - 1] = ecs.transform.x[eid];
      ecs.trail.y[base + TRAIL_MAX_LEN - 1] = ecs.transform.y[eid];
      ecs.trail.opacity[base + TRAIL_MAX_LEN - 1] = 1.0;
    }
  }
}

function waveUpdate(dt) {
  // Placeholder: actualizar wavefunction
}

function normalization() {
  // Placeholder: normalizar estados
}

function validationCheck() {
  // Placeholder: verificar drift
}

// ─── Game loop ────────────────────────────────────────────────────────────

function gameLoop(frameTime) {
  accumulator += frameTime;

  while (accumulator >= FIXED_DT) {
    physicsStep(FIXED_DT);
    waveUpdate(FIXED_DT);
    normalization();
    validationCheck();
    recordTelemetry('physics_step', FIXED_DT);
    accumulator -= FIXED_DT;
  }

  // Interpolacin para renderer (60 FPS)
  const alpha = accumulator / FIXED_DT;

  // Transferir estado a main thread (zero-copy)
  const state = {
    type: 'ENGINE_STATE',
    state: engineState,
    alpha,
    transformX: ecs.transform.x.slice(0, ecs.activeCount),
    transformY: ecs.transform.y.slice(0, ecs.activeCount),
    trailLen: ecs.trail.len.slice(0, ecs.activeCount),
  };

  self.postMessage(state);
}

// ─── Mensajes del main thread ─────────────────────────────────────────────

self.onmessage = (event) => {
  const { type, payload } = event.data;

  switch (type) {
    case 'BOOTSTRAP': {
      bootstrap(payload);
      break;
    }
    case 'START': {
      engineState = 'RUNNING';
      lastFrameTime = performance.now();
      setTimeout(tick, 16);
      break;
    }
    case 'PAUSE': {
      engineState = 'PAUSED';
      break;
    }
    case 'RESET': {
      resetECS();
      engineState = 'READY';
      break;
    }
    case 'SIMULATION_DATA': {
      // Recibir datos del backend para visualizacin
      if (payload && payload.S1) {
        // Sincronizar con ECS
        const s1 = payload.S1;
        for (let i = 0; i < Math.min(s1.length, MAX_ENTITIES); i++) {
          ecs.active[i] = i;
          ecs.transform.x[i] = s1[i];
          ecs.transform.y[i] = 0;
        }
        ecs.activeCount = Math.min(s1.length, MAX_ENTITIES);
      }
      break;
    }
    case 'SET_STATE': {
      engineState = payload;
      break;
    }
    default:
      if (typeof process === 'undefined' || process.env.NODE_ENV !== 'production') {
        console.warn('[Worker] Unknown message type:', type);
      }
  }
};

function tick() {
  if (engineState !== 'RUNNING') return;

  const now = performance.now();
  const frameTime = Math.min((now - lastFrameTime) / 1000, 0.1); // cap a 100ms
  lastFrameTime = now;

  gameLoop(frameTime);

  setTimeout(tick, 16);
}