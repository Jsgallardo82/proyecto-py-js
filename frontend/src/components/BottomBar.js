'use client';

/**
 * BottomBar — Barra inferior persistente con PLAY / PAUSE / RESET.
 *
 * Siempre visible. Botones con ARIA labels y tamaño mínimo 44x44px.
 * Engine Spec v6.0 §13, §19, §20 (accesibilidad).
 */

import { useSimulation } from '../hooks/useSimulation';
import { hexToRgb } from '../lib/utils';

export default function BottomBar() {
  const { state, simulate, play, pause, reset } = useSimulation();
  const { isPlaying, loading, simData, engineState, activeTab } = state;

  const handlePlayPause = () => {
    if (isPlaying) {
      pause();
    } else if (simData) {
      play();
    } else {
      simulate();
    }
  };

  const handleReset = () => reset();

  return (
    <footer style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '12px',
      padding: '10px 20px',
      background: '#141B2F',
      borderTop: '1px solid rgba(255,255,255,0.06)',
      flexShrink: 0,
    }}>
      {/* RESET */}
      <button
        onClick={handleReset}
        aria-label="Reiniciar simulación"
        disabled={loading}
        style={circleButtonStyle('#9CA3AF', loading)}
      >
        ↺
      </button>

      {/* PLAY / PAUSE */}
      <button
        onClick={handlePlayPause}
        aria-label={isPlaying ? 'Pausar simulación' : simData ? 'Reanudar simulación' : 'Ejecutar simulación'}
        disabled={loading}
        style={{
          ...circleButtonStyle('#10B981', loading),
          minWidth: '120px',
          borderRadius: '24px',
          padding: '0 24px',
          fontSize: '12px',
          fontWeight: 700,
          letterSpacing: '0.05em',
          background: loading ? 'rgba(16, 185, 129, 0.08)' : 'rgba(16, 185, 129, 0.18)',
          border: '1px solid rgba(16, 185, 129, 0.4)',
          color: loading ? '#9CA3AF' : '#10B981',
        }}
      >
        {loading ? (
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <LoadingSpinner /> COMPUTING...
          </span>
        ) : isPlaying ? (
          'PAUSE'
        ) : simData ? (
          'PLAY'
        ) : (
          'PLAY SIMULATION'
        )}
      </button>

      {/* State indicator */}
      <span style={{
        fontSize: '10px',
        color: 'var(--text-muted)',
        fontFamily: 'var(--font-geist-mono), monospace',
        marginLeft: '8px',
      }}>
        {engineState}
      </span>
    </footer>
  );
}

function circleButtonStyle(color, disabled) {
  return {
    minWidth: '44px',
    minHeight: '44px',
    borderRadius: '50%',
    background: disabled ? 'rgba(255,255,255,0.04)' : `rgba(${hexToRgb(color)}, 0.1)`,
    border: `1px solid ${disabled ? 'rgba(255,255,255,0.08)' : color + '44'}`,
    color: disabled ? '#1E2A3A' : color,
    fontSize: '18px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background 0.15s',
    outline: 'none',
  };
}

function LoadingSpinner() {
  return (
    <svg
      width="12" height="12" viewBox="0 0 12 12"
      style={{ animation: 'spin 1s linear infinite' }}
      aria-hidden="true"
    >
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <circle cx="6" cy="6" r="4" fill="none" stroke="#10B981" strokeWidth="1.5"
        strokeDasharray="16" strokeDashoffset="4" />
    </svg>
  );
}
