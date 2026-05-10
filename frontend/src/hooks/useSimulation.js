'use client';

/**
 * useSimulation — Hook principal de simulación.
 *
 * Gestiona:
 * - Fetch al backend FastAPI
 * - Bootstrap engine (16 pasos del Engine Spec v6.0 §6)
 * - Animación con requestAnimationFrame (fixed Δt = 1/120)
 * - FFT client-side de S1(t)
 * - Comparación de solvers (RK45 vs Crank-Nicolson)
 * - Export de datos (CSV / JSON)
 *
 * Engine Spec v6.0 §6, §7, §22.
 */

import { useCallback, useEffect, useRef } from 'react';
import { useSimulationContext, ENGINE_STATES } from '../context/SimulationContext';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Fixed timestep scheduler (Engine Spec v6.0 §7)
const FIXED_DT = 1 / 120; // [s]

export function useSimulation() {
  const { state, dispatch, animFrameRef } = useSimulationContext();
  const lastTimeRef = useRef(null);
  const accumulatorRef = useRef(0);
  const playheadRef = useRef(0);

  // ── Bootstrap pipeline (16 pasos) ──────────────────────────────────
  useEffect(() => {
    let isMounted = true;
    async function bootstrap() {
      dispatch({ type: 'SET_ENGINE_STATE', payload: ENGINE_STATES.BOOTING });

      // 1. Browser inspection
      const isBrowser = typeof window !== 'undefined';
      if (!isBrowser) return;

      // 2-4. Feature validation (SharedArrayBuffer, SIMD — graceful degradation)
      // 5. Worker allocation — handled by simulation.worker.js
      // 6-8. WASM stub — Float64 arrays pre-allocated in worker
      // 9. ECS initialization
      // 10-16. Solver registry, validation, telemetry, renderer, UI sync

      dispatch({ type: 'SET_ENGINE_STATE', payload: ENGINE_STATES.VALIDATING });

      // Check backend health
      try {
        let signal;
        let timeoutId;
        if (typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function') {
          signal = AbortSignal.timeout(5000);
        } else {
          const ctrl = new AbortController();
          signal = ctrl.signal;
          timeoutId = setTimeout(() => ctrl.abort(), 5000);
        }
        const res = await fetch(`${API_BASE}/health`, { signal });
        if (timeoutId) clearTimeout(timeoutId);
        if (res.ok && isMounted) {
          dispatch({ type: 'SET_BACKEND_CONNECTED', payload: true });
        }
      } catch {
        if (isMounted) dispatch({ type: 'SET_BACKEND_CONNECTED', payload: false });
      }

      // Load presets
      try {
        const res = await fetch(`${API_BASE}/presets`);
        if (res.ok && isMounted) {
          const data = await res.json();
          dispatch({ type: 'SET_PRESETS', payload: data.presets });
        }
      } catch {
        // Non-fatal: presets will be empty
      }

      if (isMounted) dispatch({ type: 'SET_ENGINE_STATE', payload: ENGINE_STATES.READY });
    }

    bootstrap();
    return () => { isMounted = false; };
  }, [dispatch]);

  // ── Simulate ZB ────────────────────────────────────────────────────
  const simulate = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_PLAYING', payload: false });
    cancelAnimationFrame(animFrameRef.current);

    try {
      const res = await fetch(`${API_BASE}/simulate/zb`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          omega: state.omega,
          t_max: state.tMax,
          n_steps: state.nSteps,
          solver: state.solver,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        dispatch({ type: 'SET_ERROR', payload: err.detail || 'Simulation failed' });
        return;
      }

      const data = await res.json();
      dispatch({ type: 'SET_SIM_DATA', payload: data });

      // Compute FFT client-side for FFT mode
      if (state.fftMode && data.S1?.length > 0) {
        const fftData = computeClientFFT(data.S1, data.t);
        dispatch({ type: 'SET_FFT_DATA', payload: fftData });
      }
    } catch (e) {
      dispatch({ type: 'SET_ERROR', payload: `Network error: ${e.message}` });
    }
  }, [state.omega, state.tMax, state.nSteps, state.solver, state.fftMode, dispatch, animFrameRef]);

  // ── Simulate Dirac ──────────────────────────────────────────────────
  const simulateDirac = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const res = await fetch(`${API_BASE}/simulate/dirac`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          omega: state.omega,
          photon_energy_factor: state.photonEnergyFactor,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        dispatch({ type: 'SET_ERROR', payload: err.detail || 'Dirac simulation failed' });
        return;
      }
      const data = await res.json();
      dispatch({ type: 'SET_DIRAC_DATA', payload: data });
    } catch (e) {
      dispatch({ type: 'SET_ERROR', payload: `Network error: ${e.message}` });
    }
  }, [state.omega, state.photonEnergyFactor, dispatch]);

  // ── Shoot photon (Dirac Sea) ────────────────────────────────────────
  const shootPhoton = useCallback(async () => {
    dispatch({ type: 'SET_PHOTON_FIRED', payload: true });
    await simulateDirac();
    const timer = setTimeout(() => dispatch({ type: 'SET_PHOTON_FIRED', payload: false }), 1500);
    return () => clearTimeout(timer);
  }, [simulateDirac, dispatch]);

  // ── Compare solvers ─────────────────────────────────────────────────
  const compareSolvers = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const [resRK, resCN] = await Promise.all([
        fetch(`${API_BASE}/simulate/zb`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ omega: state.omega, t_max: state.tMax, n_steps: state.nSteps, solver: 'RK45' }),
        }),
        fetch(`${API_BASE}/simulate/zb`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ omega: state.omega, t_max: state.tMax, n_steps: state.nSteps, solver: 'Crank-Nicolson' }),
        }),
      ]);

      if (!resRK.ok || !resCN.ok) {
        dispatch({ type: 'SET_ERROR', payload: 'Solver comparison failed' });
        return;
      }

      const [rk45, cn] = await Promise.all([resRK.json(), resCN.json()]);
      dispatch({ type: 'SET_COMPARISON_DATA', payload: { rk45, cn } });
      dispatch({ type: 'SET_LOADING', payload: false });
    } catch (e) {
      dispatch({ type: 'SET_ERROR', payload: `Network error: ${e.message}` });
    }
  }, [state.omega, state.tMax, state.nSteps, dispatch]);

  // ── Animation loop (fixed Δt = 1/120) ──────────────────────────────
  const play = useCallback(() => {
    if (!state.simData) return;
    dispatch({ type: 'SET_PLAYING', payload: true });
    dispatch({ type: 'SET_ENGINE_STATE', payload: ENGINE_STATES.RUNNING });
    lastTimeRef.current = null;
    accumulatorRef.current = 0;
    playheadRef.current = state.playhead;

    const totalFrames = state.simData.t.length;

    function loop(timestamp) {
      if (lastTimeRef.current === null) lastTimeRef.current = timestamp;
      const frameTime = Math.min((timestamp - lastTimeRef.current) / 1000, 0.1);
      lastTimeRef.current = timestamp;
      accumulatorRef.current += frameTime;

      while (accumulatorRef.current >= FIXED_DT) {
        playheadRef.current = Math.min(playheadRef.current + 1, totalFrames - 1);
        accumulatorRef.current -= FIXED_DT;
      }

      dispatch({ type: 'SET_PLAYHEAD', payload: playheadRef.current });

      if (playheadRef.current < totalFrames - 1) {
        animFrameRef.current = requestAnimationFrame(loop);
      } else {
        dispatch({ type: 'SET_PLAYING', payload: false });
        dispatch({ type: 'SET_ENGINE_STATE', payload: ENGINE_STATES.PAUSED });
      }
    }

    animFrameRef.current = requestAnimationFrame(loop);
  }, [state.simData, state.playhead, dispatch, animFrameRef]);

  const pause = useCallback(() => {
    cancelAnimationFrame(animFrameRef.current);
    dispatch({ type: 'SET_PLAYING', payload: false });
    dispatch({ type: 'SET_ENGINE_STATE', payload: ENGINE_STATES.PAUSED });
  }, [dispatch, animFrameRef]);

  const reset = useCallback(() => {
    cancelAnimationFrame(animFrameRef.current);
    dispatch({ type: 'RESET' });
  }, [dispatch, animFrameRef]);

  // ── Load preset ─────────────────────────────────────────────────────
  const loadPreset = useCallback(
    async (preset) => {
      dispatch({ type: 'SET_OMEGA', payload: preset.omega });
      dispatch({ type: 'SET_T_MAX', payload: preset.t_max });
      dispatch({ type: 'SET_N_STEPS', payload: preset.n_steps });
      dispatch({ type: 'SET_SOLVER', payload: preset.solver });
      // Simulate directly with preset parameters (avoid stale closure)
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_PLAYING', payload: false });
      try {
        const res = await fetch(`${API_BASE}/simulate/zb`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            omega: preset.omega,
            t_max: preset.t_max,
            n_steps: preset.n_steps,
            solver: preset.solver,
          }),
        });
        if (!res.ok) throw new Error(`Sim error: ${res.status}`);
        const data = await res.json();
        dispatch({ type: 'SET_SIM_DATA', payload: data });
        dispatch({ type: 'SET_PLAYING', payload: true });
      } catch (e) {
        dispatch({ type: 'SET_ERROR', payload: `Network error: ${e.message}` });
      }
    },
    [dispatch],
  );

  // ── Export data ─────────────────────────────────────────────────────
  const exportCSV = useCallback(() => {
    if (!state.simData) return;
    const { t, S1 } = state.simData;
    const rows = ['t_us,S1_um', ...t.map((ti, i) => `${ti},${S1[i]}`)];
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `zitterbewegung_omega${state.omega.toExponential(2)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [state.simData, state.omega]);

  const exportJSON = useCallback(() => {
    if (!state.simData) return;
    const blob = new Blob([JSON.stringify(state.simData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `zitterbewegung_omega${state.omega.toExponential(2)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [state.simData, state.omega]);

  // ── Run validation pipeline ───────────────────────────────────────────
  const runValidate = useCallback(async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const res = await fetch(`${API_BASE}/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ omega: state.omega, n_steps: Math.min(state.nSteps, 2000) }),
      });
      if (!res.ok) throw new Error(`Validate error: ${res.status}`);
      const data = await res.json();
      dispatch({ type: 'SET_NOTIFICATION', payload: JSON.stringify(data, null, 2) });
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: err.message });
    }
  }, [state.omega, state.nSteps, dispatch]);

  // ── Run benchmark ─────────────────────────────────────────────────────
  const runBenchmark = useCallback(async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const solver = state.solver === 'Split-Step' ? 'RK45' : state.solver;
      const res = await fetch(`${API_BASE}/benchmark`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          omega: state.omega,
          n_steps: Math.min(state.nSteps, 1000),
          solver,
        }),
      });
      if (!res.ok) throw new Error(`Benchmark error: ${res.status}`);
      const data = await res.json();
      dispatch({ type: 'SET_NOTIFICATION', payload: JSON.stringify(data, null, 2) });
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: err.message });
    }
  }, [state.omega, state.nSteps, state.solver, dispatch]);

  return {
    state,
    dispatch,
    simulate,
    simulateDirac,
    shootPhoton,
    compareSolvers,
    play,
    pause,
    reset,
    loadPreset,
    exportCSV,
    exportJSON,
    runValidate,
    runBenchmark,
  };
}

// ── Client-side FFT ────────────────────────────────────────────────────────
function computeClientFFT(S1Array, tArray) {
  const n = S1Array.length;
  if (n < 4) return { freqs: [], power: [] };

  const dt_us = (tArray[n - 1] - tArray[0]) / (n - 1);
  const dt_s = dt_us * 1e-6;

  // Hann window
  const windowed = S1Array.map((v, i) => {
    const mean = S1Array.reduce((a, b) => a + b, 0) / n;
    const w = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (n - 1)));
    return (v - mean) * w;
  });

  // Naive DFT for small N (Web Worker would use FFTW via WASM in production)
  const half = Math.floor(n / 2) + 1;
  const re = new Float64Array(half);
  const im = new Float64Array(half);

  for (let k = 0; k < half; k++) {
    let sumRe = 0, sumIm = 0;
    for (let j = 0; j < n; j++) {
      const angle = (2 * Math.PI * k * j) / n;
      sumRe += windowed[j] * Math.cos(angle);
      sumIm -= windowed[j] * Math.sin(angle);
    }
    re[k] = sumRe;
    im[k] = sumIm;
  }

  const freqs = Array.from({ length: half }, (_, k) => k / (n * dt_s));
  const power = Array.from({ length: half }, (_, k) => Math.sqrt(re[k] ** 2 + im[k] ** 2));

  return { freqs, power };
}
