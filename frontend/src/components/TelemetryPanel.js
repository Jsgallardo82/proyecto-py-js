'use client';

import { useSimulationContext } from '../context/SimulationContext';
import { useAppContext } from '../context/AppContext';
import { t } from '../lib/translations';



export default function TelemetryPanel() {
  const { state }           = useSimulationContext();
  const { state: appState } = useAppContext();
  const { telemetry, simData } = state;
  const tr = t[appState.lang];

  const C_VALUE_NEUTRAL = 'var(--text-primary)';
  const isError = telemetry.normalization_error > 1e-9;

  const rows = [
    {
      label: 'SIMULATED FREQUENCY',
      value: telemetry.frecuencia_zb > 0
        ? `${telemetry.frecuencia_zb.toExponential(3)} Hz`
        : '— Hz',
      color: '#06B6D4',
    },
    {
      label: 'SIMULATED AMPLITUDE',
      value: telemetry.amplitud > 0
        ? `${telemetry.amplitud.toExponential(3)} μm`
        : '— μm',
      color: '#06B6D4',
    },
    {
      label: 'PARTICLE MASS',
      value: telemetry.masa_simulada > 0
        ? `${telemetry.masa_simulada.toExponential(3)}`
        : '≈ 0',
      color: C_VALUE_NEUTRAL,
    },
    {
      label: 'NORM. ERROR',
      value: telemetry.normalization_error > 0
        ? telemetry.normalization_error.toExponential(2)
        : '0.00e+00',
      color: isError ? '#EF4444' : '#10B981',
      pulse: isError,
    },
    {
      label: 'SOLVER',
      value: simData?.solver_used ?? '—',
      color: 'var(--text-secondary)',
    },
    {
      label: 'ELAPSED',
      value: telemetry.elapsed_ms > 0
        ? `${telemetry.elapsed_ms.toFixed(1)} ms`
        : '—',
      color: 'var(--text-secondary)',
    },
  ];

  return (
    <div
      role="region"
      aria-label="Telemetría de simulación en tiempo real"
      style={{
        background: 'var(--bg-elevated)',
        borderRadius: '8px',
        padding: '12px 14px',
        border: '1px solid var(--border-subtle)',
      }}
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '10px',
      }}>
        <span style={{
          display: 'inline-block',
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          background: state.backendConnected ? '#10B981' : '#EF4444',
          flexShrink: 0,
          transition: 'background 0.3s',
        }} />
        <span style={{
          fontSize: '10px',
          fontWeight: 700,
          letterSpacing: '0.1em',
          color: 'var(--text-secondary)',
          fontFamily: "'Geist Mono', monospace",
        }}>
          {tr.controls.photonReadout}
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {rows.map((row) => (
          <div
            key={row.label}
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}
          >
            <span style={{
              fontSize: '10px',
              color: 'var(--text-secondary)',
              fontFamily: "'Geist Mono', monospace",
              letterSpacing: '0.05em',
            }}>
              {row.label}
            </span>
            <span
              style={{
                fontSize: '12px',
                fontWeight: 600,
                color: row.color,
                fontFamily: "'Geist Mono', monospace",
                transition: 'color 0.3s',

              }}
            >
              {row.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
