'use client';

/*
Layout de memoria lineal para el kernel WASM.

Engine Spec v6.0 §8 (WASM + Memory).
*/

// ─── Layout de memoria lineal (orden inmutable) ───────────────────────────

const MEMORY_LAYOUT = {
  HEADER: {
    offset: 0,
    size: 64,
    description: "versión, checksum, flags",
  },
  CONFIG: {
    offset: 64,
    size: 256,
    description: "parámetros simulación",
  },
  ECS_STORAGE: {
    offset: 320,
    size: null, // variable
    description: "componentes SoA",
  },
  WAVEFUNCTION: {
    offset: null, // calculado dinámicamente
    size: null,
    description: "Float64Array, 16-byte aligned",
  },
  FFT_SCRATCH: {
    offset: null,
    size: 64 * 1024 * 1024, // 64 MB max
    description: "buffer temporal FFT",
  },
  TELEMETRY: {
    offset: null,
    size: 8 * 1024 * 1024, // 8 MB max
    description: "RingBuffer métricas",
  },
  REPLAY: {
    offset: null,
    size: 32 * 1024 * 1024, // 32 MB max
    description: "snapshots binarios",
  },
  SCRATCH: {
    offset: null,
    size: null,
    description: "arena temporal",
  },
};

// ─── Wavefunction layout ──────────────────────────────────────────────────

const WAVE_OFFSET = 320; // bytes desde inicio WASM memory

function createWavefunctionView(wasmMemory, N_states) {
  // [Reψ₀, Imψ₀, Reψ₁, Imψ₁, ...]
  // Float64Array — OBLIGATORIO
  // 16-byte alignment — OBLIGATORIO
  return new Float64Array(
    wasmMemory.buffer,
    WAVE_OFFSET,
    N_states * 2 // real + imag por cada estado
  );
}

// ─── Memory Budget ────────────────────────────────────────────────────────

const MEMORY_BUDGET = {
  TOTAL_RAM: 512 * 1024 * 1024,    // 512 MB
  WASM_HEAP: 256 * 1024 * 1024,    // 256 MB
  FFT_SCRATCH: 64 * 1024 * 1024,   // 64 MB
  REPLAY: 32 * 1024 * 1024,        // 32 MB
  RENDERER: 64 * 1024 * 1024,      // 64 MB
  ECS_POOLS: 32 * 1024 * 1024,     // 32 MB
  TELEMETRY: 8 * 1024 * 1024,      // 8 MB
  UI: 32 * 1024 * 1024,            // 32 MB
};

// ─── Arena Allocator ──────────────────────────────────────────────────────

class ArenaAllocator {
  constructor(base) {
    this.base = base;
    this.offset = 0;
  }

  alloc(bytes) {
    const ptr = this.base + this.offset;
    this.offset += (bytes + 15) & ~15; // 16-byte align
    return ptr;
  }

  reset() {
    this.offset = 0;
  }
}

// ─── Zero-copy views (WASM ↔ JS) ──────────────────────────────────────────

function createZeroCopyView(wasmMemory, ptr, length, type = Float64Array) {
  // CORRECTO — zero-copy view sobre WASM memory
  return new type(wasmMemory.buffer, ptr, length);
}

// NUNCA hacer copias innecesarias:
// const s1Copy = Array.from(wasmOutput.s1); // INCORRECTO

// ─── Feature detection ────────────────────────────────────────────────────

function detectWasmFeatures() {
  const features = {
    wasm: typeof WebAssembly !== 'undefined',
    simd: false, // TODO: test SIMD con wasm-feature-detect
    sharedArrayBuffer: typeof SharedArrayBuffer !== 'undefined',
    offscreenCanvas: typeof OffscreenCanvas !== 'undefined',
    transferable: true, // postMessage con Transferable siempre en Workers modernos
  };

  // Detectar SharedArrayBuffer (requiere COOP/COEP headers)
  try {
    new SharedArrayBuffer(1);
  } catch (e) {
    features.sharedArrayBuffer = false;
  }

  return features;
}

// ─── Memory pressure monitoring ───────────────────────────────────────────

function checkMemoryPressure(wasmMemory) {
  const used = wasmMemory.buffer.byteLength;
  const limit = MEMORY_BUDGET.WASM_HEAP;
  const ratio = used / limit;

  if (ratio > 0.8) {
    console.warn(`[WASM] Memory pressure: ${(ratio * 100).toFixed(1)}%`);
    return true;
  }
  return false;
}

export {
  MEMORY_LAYOUT,
  WAVE_OFFSET,
  MEMORY_BUDGET,
  ArenaAllocator,
  createWavefunctionView,
  createZeroCopyView,
  detectWasmFeatures,
  checkMemoryPressure,
};
