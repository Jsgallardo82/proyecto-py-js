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
import { useAppContext } from '../context/AppContext';
import { t } from '../lib/translations';
import { hexToRgb } from '../lib/utils';
import TelemetryPanel from './TelemetryPanel';
import CouplingKnob from './CouplingKnob';

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

  const { state: appState } = useAppContext();
  const tr = t[appState.lang];

  const { activeTab, omega, tMax, nSteps, solver, isPlaying, loading,
    photonEnergyFactor, showInterference, fftMode, pedagogyLevel,
    presets, backendConnected } = state;

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
      background: 'var(--bg-secondary)',
      height: '100%',
      overflowY: 'auto',
    }}>
      {/* ── Connection indicator ──────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '-4px' }}>
        <span style={{
          width: '7px', height: '7px', borderRadius: '50%',
          background: backendConnected ? '#10B981' : '#EF4444',
          display: 'inline-block',
          flexShrink: 0,
        }} />
        <span style={{ ...labelStyle, marginBottom: 0 }}>
          {backendConnected ? tr.controls.connected : tr.controls.disconnected}
        </span>
      </div>

      {/* ── Section title ─────────────────────────────────────────────── */}
      <div style={{
        fontSize: '11px',
        fontWeight: 700,
        letterSpacing: '0.1em',
        color: '#EF4444',
        fontFamily: 'var(--font-geist-mono), monospace',
        paddingBottom: '6px',
        borderBottom: '1px solid var(--border-subtle)',
      }}>
        {tr.controls.simControls}
      </div>

      {/* ── Pedagogy level ───────────────────────────────────────────── */}
      <div>
        <label style={labelStyle}>{tr.controls.scienceLevel}</label>
        <select
          aria-label="Nivel científico"
          value={pedagogyLevel}
          onChange={(e) => dispatch({ type: 'SET_PEDAGOGY_LEVEL', payload: e.target.value })}
          style={selectStyle}
        >
          <option value="Beginner">{tr.levels.Beginner}</option>
          <option value="Academic">{tr.levels.Academic}</option>
          <option value="Advanced">{tr.levels.Advanced}</option>
        </select>
      </div>

      {/* ── Omega knob + laser ───────────────────────────────────────── */}
      <CouplingKnob
        value={omega}
        min={OMEGA_MIN}
        max={OMEGA_MAX}
        onChange={(val) => dispatch({ type: 'SET_OMEGA', payload: val })}
        label={tr.controls.coupling}
        isDark={appState.theme === 'dark'}
      />

      {/* ── Solver selector ──────────────────────────────────────────── */}
      {pedagogyLevel !== 'Beginner' && !isDirac && (
        <div>
          <label style={labelStyle}>{tr.controls.solver}</label>
          <select
            aria-label="Método numérico"
            value={solver}
            onChange={(e) => dispatch({ type: 'SET_SOLVER', payload: e.target.value })}
            style={selectStyle}
          >
            <option value="RK45">{tr.solvers.RK45}</option>
            <option value="Crank-Nicolson">{tr.solvers['Crank-Nicolson']}</option>
            <option value="Split-Step">{tr.solvers['Split-Step']}</option>
          </select>
        </div>
      )}

      {/* ── t_max and n_steps (Academic / Advanced) ───────────────────── */}
      {pedagogyLevel === 'Advanced' && !isDirac && (
        <>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <label style={labelStyle}>{tr.controls.tMax}</label>
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
              <label style={labelStyle}>{tr.controls.nSteps}</label>
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
              <label htmlFor="slider-photon" style={labelStyle}>{tr.controls.photonEnergy}</label>
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
            {tr.controls.shootPhoton}
          </button>

          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={showInterference}
              onChange={(e) => dispatch({ type: 'SET_SHOW_INTERFERENCE', payload: e.target.checked })}
              aria-label="Mostrar interferencia Zitterbewegung"
              style={{ accentColor: '#10B981', width: '16px', height: '16px' }}
            />
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontFamily: 'var(--font-geist-mono), monospace' }}>
              {tr.controls.showInterference}
            </span>
          </label>

          <div style={{
            background: 'var(--bg-canvas, #0F1419)',
            borderRadius: '8px',
            padding: '12px',
            border: '1px solid rgba(251,146,60,0.2)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
              <span style={{ fontSize: '14px', color: '#FBBF24' }}>##</span>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#FBBF24' }}>
                {tr.dirac.theoryTitle}
              </span>
            </div>
            <p style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: '0 0 8px' }}>
              {tr.dirac.theoryBody}
            </p>
            <p style={{ fontSize: '10px', color: 'var(--text-secondary)', fontStyle: 'italic', margin: '0 0 8px' }}>
              {tr.dirac.theoryQuote}
            </p>
            <ol style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0, paddingLeft: '16px' }}>
              {tr.dirac.steps.map((s, i) => <li key={i}>{s}</li>)}
            </ol>
            <p style={{
              fontSize: '10px', color: 'var(--text-secondary)', marginTop: '8px',
              borderTop: '1px solid var(--border-subtle)', paddingTop: '6px',
            }}>
              {tr.dirac.disclaimer}
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
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontFamily: 'var(--font-geist-mono), monospace' }}>
            {tr.controls.fftMode}
          </span>
        </label>
      )}

      {/* ── Presets ──────────────────────────────────────────────────── */}
      {presets.length > 0 && (
        <div>
          <label style={labelStyle}>{tr.controls.presets}</label>
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
                  fontFamily: 'var(--font-geist-mono), monospace',
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
            fontFamily: 'var(--font-geist-mono), monospace',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.5 : 1,
          }}
        >
          {tr.controls.compareSolvers}
        </button>
      )}

      {/* ── Validate & Benchmark (Advanced) ──────────────────────────── */}
      {pedagogyLevel === 'Advanced' && !isDirac && (
        <div style={{ display: 'flex', gap: '6px' }}>
          <button onClick={runValidate} disabled={loading} aria-label="Ejecutar validación" style={secondaryButtonStyle}>
            {tr.controls.validate}
          </button>
          <button onClick={runBenchmark} disabled={loading} aria-label="Ejecutar benchmark" style={secondaryButtonStyle}>
            {tr.controls.benchmark}
          </button>
        </div>
      )}

      {/* ── Export buttons ─────────────────────────────────────────────── */}
      {state.simData && (
        <div style={{ display: 'flex', gap: '6px' }}>
          <button onClick={exportCSV} aria-label="Exportar CSV" style={secondaryButtonStyle}>
            {tr.controls.csv}
          </button>
          <button onClick={exportJSON} aria-label="Exportar JSON" style={secondaryButtonStyle}>
            {tr.controls.json}
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
          fontFamily: 'var(--font-geist-mono), monospace',
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
          fontFamily: 'var(--font-geist-mono), monospace',
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
  color: 'var(--text-secondary)',
  fontFamily: 'var(--font-geist-mono), monospace',
  marginBottom: '4px',
};

const valueStyle = {
  fontSize: '12px',
  fontWeight: 600,
  color: '#06B6D4',
  fontFamily: 'var(--font-geist-mono), monospace',
};

const rangeLabel = {
  fontSize: '9px',
  color: 'var(--text-muted)',
  fontFamily: 'var(--font-geist-mono), monospace',
};

const selectStyle = {
  width: '100%',
  background: 'var(--bg-canvas, #0F1419)',
  border: '1px solid var(--border-medium)',
  borderRadius: '6px',
  color: 'var(--text-primary)',
  padding: '6px 8px',
  fontSize: '12px',
  fontFamily: 'var(--font-geist-mono), monospace',
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
    background: disabled ? 'var(--bg-hover)' : `rgba(${hexToRgb(color)}, 0.15)`,
    border: `1px solid ${disabled ? 'var(--border-medium)' : color + '55'}`,
    borderRadius: '8px',
    color: disabled ? 'var(--text-secondary)' : color,
    fontSize: '12px',
    fontWeight: 700,
    fontFamily: 'var(--font-geist-mono), monospace',
    cursor: disabled ? 'not-allowed' : 'pointer',
    letterSpacing: '0.05em',
  };
}

const secondaryButtonStyle = {
  flex: 1,
  padding: '6px',
  background: 'var(--bg-hover)',
  border: '1px solid var(--border-medium)',
  borderRadius: '6px',
  color: 'var(--text-secondary)',
  fontSize: '11px',
  fontFamily: 'var(--font-geist-mono), monospace',
  cursor: 'pointer',
};
