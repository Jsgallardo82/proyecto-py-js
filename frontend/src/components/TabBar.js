'use client';

/**
 * TabBar — Barra de navegación por las 3 vistas.
 *
 * Tabs: DATA DASHBOARD | PARTICLE VIEW | DIRAC SEA VIEW
 * Engine Spec v6.0 §13, mockups img-001.
 */

import { useSimulationContext } from '../context/SimulationContext';

const TABS = [
  { id: 'dashboard', label: 'DATA DASHBOARD' },
  { id: 'particle', label: 'PARTICLE VIEW' },
  { id: 'dirac', label: 'DIRAC SEA VIEW' },
  { id: '3d', label: '3D VIEW' },
];

export default function TabBar() {
  const { state, dispatch } = useSimulationContext();

  return (
    <nav
      role="tablist"
      aria-label="Vistas del simulador"
      style={{
        display: 'flex',
        gap: '0',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        background: '#141B2F',
        flexShrink: 0,
        paddingLeft: '8px',
      }}
    >
      {TABS.map((tab) => {
        const active = state.activeTab === tab.id;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={active}
            aria-controls={`panel-${tab.id}`}
            onClick={() => dispatch({ type: 'SET_ACTIVE_TAB', payload: tab.id })}
            style={{
              padding: '10px 20px',
              background: 'none',
              border: 'none',
              borderBottom: active ? '2px solid #06B6D4' : '2px solid transparent',
              color: active ? '#06B6D4' : '#9CA3AF',
              fontSize: '11px',
              fontWeight: active ? 700 : 500,
              letterSpacing: '0.08em',
              fontFamily: "'Geist Mono', monospace",
              cursor: 'pointer',
              transition: 'color 0.15s, border-color 0.15s',
              outline: 'none',
            }}
            onFocus={(e) => (e.currentTarget.style.outline = '2px solid #4F46E5')}
            onBlur={(e) => (e.currentTarget.style.outline = 'none')}
          >
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
}
