'use client';

/**
 * TelemetryPanel — Readout en tiempo real de métricas de simulación.
 *
 * Muestra: FREQUENCY (ν_ZB), AMPLITUDE, PARTICLE MASS, NORMALIZATION ERROR.
 * Fuente: Geist Mono, valores numéricos actualizados a 20 Hz.
 * Engine Spec v6.0 §3 (Telemetry & Observability), §13 (Vista 1).
 */

import { useSimulationContext } from '../context/SimulationContext';

export default function TelemetryPanel() {
  const { state } = useSimulationContext();
  const { telemetry, simData } = state;

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
      color: '#E8E9F3',
    },
    {
      label: 'NORM. ERROR',
      value: telemetry.normalization_error > 0
        ? telemetry.normalization_error.toExponential(2)
        : '0.00e+00',
      color: telemetry.normalization_error > 1e-9 ? '#EF4444' : '#10B981',
    },
    {
      label: 'SOLVER',
      value: simData?.solver_used ?? '—',
      color: '#9CA3AF',
    },
    {
      label: 'ELAPSED',
      value: telemetry.elapsed_ms > 0
        ? `${telemetry.elapsed_ms.toFixed(1)} ms`
        : '—',
      color: '#9CA3AF',
    },
  ];

  return (
    <div
      role="region"
      aria-label="Telemetría de simulación en tiempo real"
      style={{
        background: '#141B2F',
        borderRadius: '8px',
        padding: '12px 14px',
        border: '1px solid rgba(255,255,255,0.07)',
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
        }} />
        <span style={{
          fontSize: '10px',
          fontWeight: 700,
          letterSpacing: '0.1em',
          color: '#9CA3AF',
          fontFamily: "'Geist Mono', monospace",
        }}>
          TELEMETRY READOUT
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {rows.map((row) => (
          <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span style={{
              fontSize: '10px',
              color: '#9CA3AF',
              fontFamily: "'Geist Mono', monospace",
              letterSpacing: '0.05em',
            }}>
              {row.label}
            </span>
            <span style={{
              fontSize: '12px',
              fontWeight: 600,
              color: row.color,
              fontFamily: "'Geist Mono', monospace",
            }}>
              {row.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
