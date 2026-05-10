'use client';

/*
Sistema de Quality Tiers y degradación automática de performance.

Engine Spec v6.0 §26 (Performance Profiling).
*/

// ─── Quality Tiers ────────────────────────────────────────────────────────

const QUALITY_TIERS = {
  0: {
    // Intel UHD antiguas — mínimo funcional
    Nx: 256,
    fft_size: 512,
    trail_len: 20,
    telemetry_hz: 5,
    use_wasm: false,
    renderer: 'canvas2d_main',
    label: 'MINIMUM',
  },
  1: {
    // Intel UHD modernas
    Nx: 512,
    fft_size: 1024,
    trail_len: 50,
    telemetry_hz: 10,
    use_wasm: true,
    renderer: 'canvas2d_offscreen',
    label: 'LOW',
  },
  2: {
    // Iris Xe / integrated GPU moderno
    Nx: 1024,
    fft_size: 2048,
    trail_len: 100,
    telemetry_hz: 20,
    use_wasm: true,
    renderer: 'canvas2d_offscreen',
    label: 'MEDIUM',
  },
  3: {
    // Ryzen APU / discrete GPU
    Nx: 2048,
    fft_size: 4096,
    trail_len: 200,
    telemetry_hz: 20,
    use_wasm: true,
    renderer: 'webgl_light',
    label: 'HIGH',
  },
};

// ─── Detección de tier ────────────────────────────────────────────────────

function detectQualityTier() {
  const cores = navigator.hardwareConcurrency ?? 2;
  const hasWasm = typeof WebAssembly !== 'undefined';

  // Heurísticas simples basadas en cores y WASM
  if (cores >= 8 && hasWasm) return 3;
  if (cores >= 4 && hasWasm) return 2;
  if (cores >= 2 && hasWasm) return 1;
  return 0;
}

// ─── Frame Profiler ───────────────────────────────────────────────────────

class FrameProfiler {
  constructor(capacity = 120) {
    this.samples = new Float32Array(capacity);
    this.idx = 0;
    this.capacity = capacity;
  }

  mark(dt) {
    this.samples[this.idx++ % this.capacity] = dt;
  }

  report() {
    const valid = this.samples.slice(0, Math.min(this.idx, this.capacity));
    const sorted = [...valid].sort((a, b) => a - b);
    const n = sorted.length;

    if (n === 0) return { avg: 0, p95: 0, p99: 0 };

    const avg = sorted.reduce((s, v) => s + v, 0) / n;
    const p95 = sorted[Math.floor(n * 0.95)] ?? sorted[n - 1];
    const p99 = sorted[Math.floor(n * 0.99)] ?? sorted[n - 1];

    return { avg, p95, p99 };
  }

  isDegraded(thresholdMs = 6.0, consecutiveFrames = 30) {
    const valid = this.samples.slice(0, Math.min(this.idx, this.capacity));
    if (valid.length < consecutiveFrames) return false;

    const recent = valid.slice(-consecutiveFrames);
    return recent.every((dt) => dt > thresholdMs / 1000); // dt está en segundos
  }
}

// ─── Degradation techniques ───────────────────────────────────────────────

function degrade(tier) {
  const current = QUALITY_TIERS[tier];
  if (!current) return null;

  return {
    ...current,
    // Reducir resolución
    Nx: Math.max(128, Math.floor(current.Nx / 2)),
    fft_size: Math.max(256, Math.floor(current.fft_size / 2)),
    trail_len: Math.max(10, Math.floor(current.trail_len / 2)),
    telemetry_hz: Math.max(5, Math.floor(current.telemetry_hz / 2)),
  };
}

// ─── GC spike detection ───────────────────────────────────────────────────

function detectGCSpike(frameTimeMs) {
  const budget = 16.67; // 60 FPS budget
  if (frameTimeMs > budget * 3) {
    console.warn(`[PERF] Possible GC spike: ${frameTimeMs.toFixed(1)}ms`);
    return true;
  }
  return false;
}

export {
  QUALITY_TIERS,
  detectQualityTier,
  FrameProfiler,
  degrade,
  detectGCSpike,
};
