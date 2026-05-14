'use client';

/**
 * BottomBar — Barra inferior persistente con PLAY / PAUSE / RESET + botón CUADERNO.
 *
 * El botón CUADERNO abre/cierra un modal flotante con NotebookView.
 * Engine Spec v6.0 §13, §19, §20 (accesibilidad).
 */

import { useState } from 'react';
import { useSimulation } from '../hooks/useSimulation';
import { useAppContext } from '../context/AppContext';
import { t } from '../lib/translations';
import { hexToRgb } from '../lib/utils';
import NotebookView from './NotebookView';

export default function BottomBar() {
  const { state, simulate, play, pause, reset } = useSimulation();
  const { state: appState } = useAppContext();
  const { isPlaying, loading, simData, engineState } = state;
  const tr = t[appState.lang];
  const isDark = appState.theme === 'dark';

  const [notebookOpen, setNotebookOpen] = useState(false);

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

  // ── Colors ──────────────────────────────────────────────────────────
  const modalBg     = isDark ? '#111827' : '#FFFFFF';
  const modalBorder = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.12)';
  const headerBg    = isDark ? '#1F2937' : '#F1F5F9';
  const titleColor  = isDark ? '#E5E7EB' : '#1A202C';
  const mutedColor  = isDark ? '#9CA3AF' : '#718096';
  const accentColor = '#06B6D4';

  return (
    <>
      <footer style={{
        display: 'flex',
        alignItems: 'center',
        padding: '10px 20px',
        background: 'var(--bg-secondary)',
        borderTop: '1px solid var(--border-subtle)',
        flexShrink: 0,
        gap: '12px',
      }}>
        {/* ── Grupo centrado: RESET + PLAY + estado ────────────────── */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
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

          {/* Estado del engine */}
          <span style={{
            fontSize: '10px',
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-geist-mono), monospace',
          }}>
            {engineState}
          </span>
        </div>

        {/* ── Botón CUADERNO — extremo derecho ─────────────────────── */}
        <button
          onClick={() => setNotebookOpen((v) => !v)}
          aria-label={notebookOpen ? tr.notebook.close : tr.bottomBar.notebook}
          aria-expanded={notebookOpen}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 14px',
            height: '34px',
            background: notebookOpen
              ? `rgba(${hexToRgb(accentColor)}, 0.18)`
              : 'rgba(255,255,255,0.05)',
            border: `1px solid ${notebookOpen ? accentColor : 'rgba(255,255,255,0.12)'}`,
            borderRadius: '6px',
            color: notebookOpen ? accentColor : 'var(--text-secondary)',
            fontFamily: 'var(--font-geist-mono), monospace',
            fontSize: '10px',
            fontWeight: 700,
            letterSpacing: '0.08em',
            cursor: 'pointer',
            flexShrink: 0,
            transition: 'background 0.15s, color 0.15s, border-color 0.15s',
          }}
        >
          ✎ {tr.bottomBar.notebook}
        </button>
      </footer>

      {/* ── Modal backdrop ───────────────────────────────────────────── */}
      {/* Se usa visibility/display en lugar de montado condicional para que
          NotebookView conserve su estado (respuestas escritas) entre aperturas */}
      <div
        onClick={() => setNotebookOpen(false)}
        style={{
          display: notebookOpen ? 'block' : 'none',
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.45)',
          zIndex: 100,
        }}
        aria-hidden="true"
      />

      {/* ── Modal del cuaderno ───────────────────────────────────────── */}
      <div
        role="dialog"
        aria-label={tr.notebook.title}
        aria-modal="true"
        aria-hidden={!notebookOpen}
        style={{
          display: notebookOpen ? 'flex' : 'none',
          position: 'fixed',
          bottom: '58px',
          right: '16px',
          width: 'min(720px, calc(100vw - 32px))',
          height: '80vh',
          background: modalBg,
          border: `1px solid ${modalBorder}`,
          borderRadius: '10px',
          boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
          zIndex: 101,
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header del modal */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 16px',
          background: headerBg,
          borderBottom: `1px solid ${modalBorder}`,
          flexShrink: 0,
        }}>
          <span style={{
            fontSize: '11px',
            fontWeight: 700,
            fontFamily: 'var(--font-geist-mono), monospace',
            letterSpacing: '0.1em',
            color: titleColor,
          }}>
            ✎ {tr.notebook.title}
          </span>
          <button
            onClick={() => setNotebookOpen(false)}
            aria-label={tr.notebook.close}
            style={{
              background: 'none',
              border: 'none',
              color: mutedColor,
              fontSize: '18px',
              cursor: 'pointer',
              lineHeight: 1,
              padding: '2px 6px',
              borderRadius: '4px',
              transition: 'color 0.15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = titleColor)}
            onMouseLeave={(e) => (e.currentTarget.style.color = mutedColor)}
          >
            ×
          </button>
        </div>

        {/* Contenido scrollable */}
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <NotebookView />
        </div>
      </div>
    </>
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
