'use client';

/**
 * ControlsPanel — Panel de controles de simulación.
 *
 * Incluye:
 * - Sliders: Ω (masa), t_max, selector solver
 * - Telemetry readout
 * - Botones PLAY / PAUSE / RESET
 * - Opciones avanzadas: FFT mode, comparación de solvers
 * - Controles de Dirac Sea View (en tab 'dirac')
 *
 * Engine Spec v6.0 §13, §19, §22.
 */

import { useSimulation } from '../hooks/useSimulation';
import { OMEGA_MIN, OMEGA_MAX } from '../context/SimulationContext';
import { hexToRgb } from '../lib/utils';
import TelemetryPanel from './TelemetryPanel';

const OMEGA_LABELS = {
  min: '10⁴ Hz',
  max: '10⁵ Hz',
};

export default function ControlsPanel() {
  const {
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
  } = useSimulation();

  const { activeTab, omega, tMax, nSteps, solver, isPlaying, loading,
    photonEnergyFactor, showInterference, fftMode, pedagogyLevel,
    presets, backendConnected } = state;

  // ── Slider helpers ───────────────────────────────────────────────────
  const omegaPercent = ((omega - OMEGA_MIN) / (OMEGA_MAX - OMEGA_MIN)) * 100;

  function handleOmega(e) {
    const val = parseFloat(e.target.value);
    dispatch({ type: 'SET_OMEGA', payload: val });
  }

  function handlePhotonEnergy(e) {
    dispatch({ type: 'SET_PHOTON_ENERGY_FACTOR', payload: parseFloat(e.target.value) });
  }

  const isDirac = activeTab === 'dirac';

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '14px',
      padding: '16px',
      background: '#141B2F',
      height: '100%',
      overflowY: 'auto',
    }}>
      {/* ── Connection indicator ──────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '-4px' }}>
        <span style={{
          width: '7px', height: '7px', borderRadius: '50%',
          background: backendConnected ? '#10B981' : '#EF4444',
          display: 'inline-block',
        }} />
        <span style={{ fontSize: '10px', color: '#9CA3AF', fontFamily: "'Geist Mono', monospace" }}>
          {backendConnected ? 'BACKEND CONNECTED' : 'BACKEND OFFLINE'}
        </span>
      </div>

      {/* ── Section title ─────────────────────────────────────────────── */}
      <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', color: '#EF4444', fontFamily: "'Geist Mono', monospace" }}>
        SIMULATION CONTROLS
      </div>

      {/* ── Pedagogy level ───────────────────────────────────────────── */}
      <div>
        <label style={labelStyle}>SCIENCE LEVEL</label>
        <select
          aria-label="Nivel científico"
          value={pedagogyLevel}
          onChange={(e) => dispatch({ type: 'SET_PEDAGOGY_LEVEL', payload: e.target.value })}
          style={selectStyle}
        >
          <option value="Beginner">Beginner</option>
          <option value="Academic">Academic</option>
          <option value="Advanced">Advanced</option>
        </select>
      </div>

      {/* ── Omega slider ─────────────────────────────────────────────── */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '4px' }}>
          <label htmlFor="slider-omega" style={labelStyle}>
            COUPLING FORCES (Ω)
          </label>
          <span style={valueStyle}>{omega.toExponential(2)} Hz</span>
        </div>
        <input
          id="slider-omega"
          type="range"
          min={OMEGA_MIN}
          max={OMEGA_MAX}
          step={(OMEGA_MAX - OMEGA_MIN) / 1000}
          value={omega}
          onChange={handleOmega}
          aria-label="Fuerza de acoplamiento Omega en Hz"
          aria-valuemin={OMEGA_MIN}
          aria-valuemax={OMEGA_MAX}
          aria-valuenow={omega}
          style={sliderStyle('#EF4444', omegaPercent)}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2px' }}>
          <span style={rangeLabel}>10⁴ Hz</span>
          <span style={rangeLabel}>10⁵ Hz</span>
        </div>
      </div>

      {/* ── Solver selector ──────────────────────────────────────────── */}
      {pedagogyLevel !== 'Beginner' && !isDirac && (
        <div>
          <label style={labelStyle}>SOLVER</label>
          <select
            aria-label="Método numérico"
            value={solver}
            onChange={(e) => dispatch({ type: 'SET_SOLVER', payload: e.target.value })}
            style={selectStyle}
          >
            <option value="RK45">RK45 (adaptive)</option>
            <option value="Crank-Nicolson">Crank-Nicolson (unitary)</option>
            <option value="Split-Step">Split-Step Fourier</option>
          </select>
        </div>
      )}

      {/* ── t_max and n_steps (Academic / Advanced) ───────────────────── */}
      {pedagogyLevel === 'Advanced' && !isDirac && (
        <>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <label style={labelStyle}>T_MAX (μs)</label>
              <span style={valueStyle}>{tMax.toFixed(0)} μs</span>
            </div>
            <input
              type="range" min={10} max={5000} step={10} value={tMax}
              onChange={(e) => dispatch({ type: 'SET_T_MAX', payload: parseFloat(e.target.value) })}
              aria-label="Tiempo máximo de simulación en microsegundos"
              style={sliderStyle('#06B6D4', (tMax / 5000) * 100)}
            />
          </div>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <label style={labelStyle}>N_STEPS</label>
              <span style={valueStyle}>{nSteps}</span>
            </div>
            <input
              type="range" min={100} max={5000} step={100} value={nSteps}
              onChange={(e) => dispatch({ type: 'SET_N_STEPS', payload: parseInt(e.target.value) })}
              aria-label="Número de pasos temporales"
              style={sliderStyle('#10B981', (nSteps / 5000) * 100)}
            />
          </div>
        </>
      )}

      {/* ── Dirac Sea controls ───────────────────────────────────────── */}
      {isDirac && (
        <>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <label htmlFor="slider-photon" style={labelStyle}>PHOTON ENERGY (hν)</label>
              <span style={valueStyle}>{photonEnergyFactor.toFixed(2)} mc²</span>
            </div>
            <input
              id="slider-photon"
              type="range" min={0} max={4} step={0.05} value={photonEnergyFactor}
              onChange={handlePhotonEnergy}
              aria-label="Energía del fotón en unidades de mc cuadrado"
              style={sliderStyle('#FBBF24', (photonEnergyFactor / 4) * 100)}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2px' }}>
              {['0', '1mc²', '2mc²', '3mc²', '4mc²'].map((l) => (
                <span key={l} style={rangeLabel}>{l}</span>
              ))}
            </div>
          </div>

          <button
            onClick={shootPhoton}
            disabled={loading}
            aria-label="Disparar fotón hacia el Mar de Dirac"
            style={primaryButtonStyle('#FBBF24', loading)}
          >
            [PHOTON] SHOOT PHOTON
          </button>

          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={showInterference}
              onChange={(e) => dispatch({ type: 'SET_SHOW_INTERFERENCE', payload: e.target.checked })}
              aria-label="Mostrar interferencia Zitterbewegung"
              style={{ accentColor: '#10B981', width: '16px', height: '16px' }}
            />
            <span style={{ fontSize: '11px', color: '#9CA3AF', fontFamily: "'Geist Mono', monospace" }}>
              SHOW INTERFERENCE
            </span>
          </label>

          <div style={{
            background: '#0F1419', borderRadius: '8px', padding: '12px',
            border: '1px solid rgba(251,146,60,0.2)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
              <span style={{ fontSize: '14px', color: '#FBBF24' }}>##</span>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#FBBF24' }}>Hole Theory</span>
            </div>
            <p style={{ fontSize: '11px', color: '#9CA3AF', lineHeight: 1.5, margin: '0 0 8px' }}>
              Imagine the vacuum is not empty, but a{' '}
              <strong style={{ color: '#E8E9F3' }}>dense sea</strong> of electrons occupying
              all possible negative energy states.
            </p>
            <p style={{ fontSize: '10px', color: '#9CA3AF', fontStyle: 'italic', margin: '0 0 8px' }}>
              "A 'hole' in this sea behaves exactly like a particle with positive charge
              and positive energy." — P.A.M. Dirac
            </p>
            <ol style={{ fontSize: '11px', color: '#9CA3AF', lineHeight: 1.6, margin: 0, paddingLeft: '16px' }}>
              <li>A photon strikes a negative-energy electron.</li>
              <li>The electron jumps to a positive state.</li>
              <li>The vacancy left behind behaves as a positron.</li>
            </ol>
            <p style={{
              fontSize: '10px', color: '#9CA3AF', marginTop: '8px',
              borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '6px',
            }}>
              Nota: El Mar de Dirac es una interpretación histórica, no la descripción
              del vacío en la QFT moderna.
            </p>
          </div>
        </>
      )}

      {/* ── FFT mode toggle (Academic / Advanced, non-Dirac) ─────────── */}
      {pedagogyLevel !== 'Beginner' && !isDirac && (
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={fftMode}
            onChange={(e) => dispatch({ type: 'SET_FFT_MODE', payload: e.target.checked })}
            aria-label="Activar modo FFT"
            style={{ accentColor: '#10B981', width: '16px', height: '16px' }}
          />
          <span style={{ fontSize: '11px', color: '#9CA3AF', fontFamily: "'Geist Mono', monospace" }}>
            FFT MODE (ν_ZB analysis)
          </span>
        </label>
      )}

      {/* ── Presets ──────────────────────────────────────────────────── */}
      {presets.length > 0 && (
        <div>
          <label style={labelStyle}>EDUCATIONAL PRESETS</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {presets.map((p) => (
              <button
                key={p.id}
                onClick={() => loadPreset(p)}
                aria-label={`Cargar preset: ${p.name}`}
                style={{
                  background: 'rgba(16, 185, 129, 0.08)',
                  border: '1px solid rgba(16, 185, 129, 0.2)',
                  borderRadius: '6px',
                  padding: '6px 10px',
                  color: '#10B981',
                  fontSize: '11px',
                  fontFamily: "'Geist Mono', monospace",
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(16, 185, 129, 0.15)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(16, 185, 129, 0.08)'}
              >
                {p.id}. {p.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Telemetry ─────────────────────────────────────────────────── */}
      <TelemetryPanel />

      {/* ── Compare solvers ──────────────────────────────────────────── */}
      {pedagogyLevel === 'Advanced' && !isDirac && (
        <button
          onClick={compareSolvers}
          disabled={loading}
          aria-label="Comparar solvers RK45 y Crank-Nicolson"
          style={{
            background: 'rgba(79, 70, 229, 0.1)',
            border: '1px solid rgba(79, 70, 229, 0.3)',
            borderRadius: '6px',
            padding: '8px 12px',
            color: '#4F46E5',
            fontSize: '11px',
            fontFamily: "'Geist Mono', monospace",
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.5 : 1,
          }}
        >
            [=] COMPARE SOLVERS (RK45 vs CN)
        </button>
      )}

      {/* ── Validate & Benchmark (Advanced) ──────────────────────────── */}
      {pedagogyLevel === 'Advanced' && !isDirac && (
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            onClick={runValidate}
            disabled={loading}
            aria-label="Ejecutar pipeline de validación científica"
            style={secondaryButtonStyle}
          >
            VALIDATE
          </button>
          <button
            onClick={runBenchmark}
            disabled={loading}
            aria-label="Ejecutar benchmark de performance"
            style={secondaryButtonStyle}
          >
            BENCHMARK
          </button>
        </div>
      )}

      {/* ── Export buttons ─────────────────────────────────────────────── */}
      {state.simData && (
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            onClick={exportCSV}
            aria-label="Exportar datos como CSV"
            style={secondaryButtonStyle}
          >
            CSV
          </button>
          <button
            onClick={exportJSON}
            aria-label="Exportar datos como JSON"
            style={secondaryButtonStyle}
          >
            JSON
          </button>
        </div>
      )}

      {/* ── Error display ────────────────────────────────────────────── */}
      {state.error && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '6px',
          padding: '8px',
          color: '#EF4444',
          fontSize: '11px',
          fontFamily: "'Geist Mono', monospace",
        }}>
          {state.error}
        </div>
      )}

      {/* ── Notification display ─────────────────────────────────────── */}
      {state.notification && (
        <div style={{
          background: 'rgba(16, 185, 129, 0.08)',
          border: '1px solid rgba(16, 185, 129, 0.25)',
          borderRadius: '6px',
          padding: '8px',
          color: '#10B981',
          fontSize: '11px',
          fontFamily: "'Geist Mono', monospace",
          whiteSpace: 'pre-wrap',
          maxHeight: '200px',
          overflow: 'auto',
        }}>
          {state.notification}
        </div>
      )}
    </div>
  );
}

// ── Style helpers ─────────────────────────────────────────────────────────

const labelStyle = {
  display: 'block',
  fontSize: '10px',
  fontWeight: 700,
  letterSpacing: '0.08em',
  color: '#9CA3AF',
  fontFamily: "'Geist Mono', monospace",
  marginBottom: '4px',
};

const valueStyle = {
  fontSize: '12px',
  fontWeight: 600,
  color: '#06B6D4',
  fontFamily: "'Geist Mono', monospace",
};

const rangeLabel = {
  fontSize: '9px',
  color: '#9CA3AF',
  fontFamily: "'Geist Mono', monospace",
};

const selectStyle = {
  width: '100%',
  background: '#0F1419',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '6px',
  color: '#E8E9F3',
  padding: '6px 8px',
  fontSize: '12px',
  fontFamily: "'Geist Mono', monospace",
  cursor: 'pointer',
};

function sliderStyle(color, percent) {
  return {
    width: '100%',
    appearance: 'none',
    height: '4px',
    borderRadius: '2px',
    background: `linear-gradient(to right, ${color} 0%, ${color} ${percent}%, rgba(255,255,255,0.1) ${percent}%, rgba(255,255,255,0.1) 100%)`,
    cursor: 'pointer',
    outline: 'none',
  };
}

function primaryButtonStyle(color, disabled) {
  return {
    width: '100%',
    padding: '10px',
    background: disabled ? 'rgba(255,255,255,0.04)' : `rgba(${hexToRgb(color)}, 0.15)`,
    border: `1px solid ${disabled ? 'rgba(255,255,255,0.1)' : color + '55'}`,
    borderRadius: '8px',
    color: disabled ? '#9CA3AF' : color,
    fontSize: '12px',
    fontWeight: 700,
    fontFamily: "'Geist Mono', monospace",
    cursor: disabled ? 'not-allowed' : 'pointer',
    letterSpacing: '0.05em',
  };
}

const secondaryButtonStyle = {
  flex: 1,
  padding: '6px',
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '6px',
  color: '#9CA3AF',
  fontSize: '11px',
  fontFamily: "'Geist Mono', monospace",
  cursor: 'pointer',
};


