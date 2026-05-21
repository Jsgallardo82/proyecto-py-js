'use client';

/**
 * SimulationContext — Estado global del simulador (React Context + useReducer).
 *
 * Engine Spec v6.0 §6 (Threading Model), §7 (Scheduler), §3 (Architecture).
 * Sin Redux. Estado predecible y determinístico.
 */

import { createContext, useContext, useReducer, useRef } from 'react';

// ─── Constantes de parámetros físicos ────────────────────────────────────
export const OMEGA_MIN = 1e4;
export const OMEGA_MAX = 1e5;
export const OMEGA_DEFAULT = 5e4;
export const T_MAX_DEFAULT = 5000.0;
export const N_STEPS_DEFAULT = 2000;

// ─── Engine States (Engine Spec v6.0 §6) ────────────────────────────────
export const ENGINE_STATES = {
  UNINITIALIZED: 'UNINITIALIZED',
  BOOTING: 'BOOTING',
  VALIDATING: 'VALIDATING',
  READY: 'READY',
  RUNNING: 'RUNNING',
  PAUSED: 'PAUSED',
  REPLAYING: 'REPLAYING',
  EXPORTING: 'EXPORTING',
  SHUTDOWN: 'SHUTDOWN',
};

// ─── Estado inicial ────────────────────────────────────────────────────
const initialState = {
  // Engine lifecycle
  engineState: ENGINE_STATES.UNINITIALIZED,

  // Active tab
  activeTab: 'dashboard', // 'dashboard' | 'particle' | 'dirac'

  // Pedagogy level
  pedagogyLevel: 'Beginner', // 'Beginner' | 'Academic' | 'Advanced'

  // Simulation parameters
  omega: OMEGA_DEFAULT,         // Fuerza de acoplamiento Ω [Hz]
  tMax: T_MAX_DEFAULT,          // Tiempo máximo [μs]
  nSteps: N_STEPS_DEFAULT,      // Pasos temporales
  solver: 'RK45',               // Solver activo

  // Dirac Sea parameters
  photonEnergyFactor: 1.5,      // Energía fotón en unidades de mc² [0, 4]
  showInterference: false,      // Toggle interferencia
  photonFired: false,           // Animación fotón activa
  pairCreated: false,           // Resultado creación de par

  // Simulation results
  simData: null,                // { t[], S1[], frecuencia_zb, amplitud, masa_simulada, ... }
  diracData: null,              // { mc2, positive_levels, pair_created, ... }
  comparisonData: null,         // { rk45: {...}, cn: {...} } para comparación

  // Animation state
  playhead: 0,                  // Frame actual de animación [0, nSteps)
  isPlaying: false,

  // Telemetry (RingBuffer conceptual — últimos valores)
  telemetry: {
    frecuencia_zb: 0.0,
    amplitud: 0.0,
    masa_simulada: 0.0,
    normalization_error: 0.0,
    elapsed_ms: 0.0,
    dt: 1 / 120,
  },

  // UI state
  loading: false,
  error: null,
  notification: null,
  backendConnected: false,

  // Presets
  presets: [],

  // FFT mode
  fftMode: false,
  fftData: null,                // { freqs[], power[] }

  // Missions system (Engine Spec v6.0 §16)
  missions: {
    current: 0,                 // índice de misión activa (0-4)
    completed: [],              // IDs de misiones completadas
    visible: true,              // toggle visibilidad
  },

  // Onboarding tutorial
  showOnboarding: true,
};

// ─── Reducer ───────────────────────────────────────────────────────────
function simulationReducer(state, action) {
  switch (action.type) {
    case 'SET_ENGINE_STATE':
      return { ...state, engineState: action.payload };

    case 'SET_ACTIVE_TAB':
      return { ...state, activeTab: action.payload };

    case 'SET_PEDAGOGY_LEVEL':
      return { ...state, pedagogyLevel: action.payload };

    case 'SET_OMEGA':
      return { ...state, omega: action.payload };

    case 'SET_T_MAX':
      return { ...state, tMax: action.payload };

    case 'SET_N_STEPS':
      return { ...state, nSteps: action.payload };

    case 'SET_SOLVER':
      return { ...state, solver: action.payload };

    case 'SET_PHOTON_ENERGY_FACTOR':
      return { ...state, photonEnergyFactor: action.payload };

    case 'SET_SHOW_INTERFERENCE':
      return { ...state, showInterference: action.payload };

    case 'SET_PHOTON_FIRED':
      return { ...state, photonFired: action.payload };

    case 'SET_SIM_DATA':
      return {
        ...state,
        simData: action.payload,
        loading: false,
        error: null,
        playhead: 0,
        telemetry: {
          frecuencia_zb: action.payload?.frecuencia_zb ?? 0,
          amplitud: action.payload?.amplitud ?? 0,
          masa_simulada: action.payload?.masa_simulada ?? 0,
          normalization_error: action.payload?.normalization_error ?? 0,
          elapsed_ms: action.payload?.elapsed_ms ?? 0,
          dt: 1 / 120,
        },
      };

    case 'SET_SIM_DATA_LIVE': {
      const oldPlayhead = state.playhead;
      const oldData = state.simData;
      let newPlayhead = 0;
      if (oldData?.t?.length && action.payload?.t?.length) {
        const idx = Math.min(oldPlayhead, oldData.t.length - 1);
        const currentT = oldData.t[idx] ?? 0;
        const newT = action.payload.t;
        let nearest = 0;
        let minDiff = Infinity;
        for (let i = 0; i < newT.length; i++) {
          const diff = Math.abs(newT[i] - currentT);
          if (diff < minDiff) { minDiff = diff; nearest = i; }
        }
        newPlayhead = nearest;
      }
      return {
        ...state,
        simData: action.payload,
        loading: false,
        error: null,
        playhead: newPlayhead,
        telemetry: {
          frecuencia_zb: action.payload?.frecuencia_zb ?? 0,
          amplitud: action.payload?.amplitud ?? 0,
          masa_simulada: action.payload?.masa_simulada ?? 0,
          normalization_error: action.payload?.normalization_error ?? 0,
          elapsed_ms: action.payload?.elapsed_ms ?? 0,
          dt: 1 / 120,
        },
      };
    }

    case 'SET_DIRAC_DATA':
      return {
        ...state,
        diracData: action.payload,
        pairCreated: action.payload?.pair_created ?? false,
        loading: false,
        error: null,
      };

    case 'SET_COMPARISON_DATA':
      return { ...state, comparisonData: action.payload };

    case 'SET_PLAYHEAD':
      return { ...state, playhead: action.payload };

    case 'SET_PLAYING':
      return { ...state, isPlaying: action.payload };

    case 'SET_LOADING':
      return { ...state, loading: action.payload, error: null };

    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };

    case 'SET_NOTIFICATION':
      return { ...state, notification: action.payload, loading: false };

    case 'CLEAR_NOTIFICATION':
      return { ...state, notification: null };

    case 'SET_BACKEND_CONNECTED':
      return { ...state, backendConnected: action.payload };

    case 'SET_PRESETS':
      return { ...state, presets: action.payload };

    case 'SET_FFT_MODE':
      return { ...state, fftMode: action.payload };

    case 'SET_FFT_DATA':
      return { ...state, fftData: action.payload };

    case 'SET_MISSION':
      return {
        ...state,
        missions: { ...state.missions, current: action.payload },
      };

    case 'COMPLETE_MISSION':
      if (state.missions.completed.includes(action.payload)) {
        return state;
      }
      return {
        ...state,
        missions: {
          ...state.missions,
          completed: [...state.missions.completed, action.payload],
        },
      };

    case 'TOGGLE_MISSIONS':
      return {
        ...state,
        missions: { ...state.missions, visible: !state.missions.visible },
      };

    case 'TOGGLE_ONBOARDING':
      return { ...state, showOnboarding: !state.showOnboarding };

    case 'RESET':
      return {
        ...initialState,
        backendConnected: state.backendConnected,
        presets: state.presets,
        engineState: ENGINE_STATES.READY,
        showOnboarding: false,
      };

    default:
      return state;
  }
}

// ─── Context ───────────────────────────────────────────────────────────
const SimulationContext = createContext(null);

export function SimulationProvider({ children }) {
  const [state, dispatch] = useReducer(simulationReducer, initialState);
  const animFrameRef = useRef(null);

  return (
    <SimulationContext.Provider value={{ state, dispatch, animFrameRef }}>
      {children}
    </SimulationContext.Provider>
  );
}

export function useSimulationContext() {
  const ctx = useContext(SimulationContext);
  if (!ctx) throw new Error('useSimulationContext must be used inside SimulationProvider');
  return ctx;
}
