'use client';

/**
 * TabBar — Barra de navegación por las 3 vistas.
 *
 * Prop `inline` (bool): cuando es true se renderiza sin borde ni fondo propio,
 * para embeberse dentro del header ISOTOPE.
 */

import { useSimulationContext } from '../context/SimulationContext';
import { useAppContext } from '../context/AppContext';
import { t } from '../lib/translations';

const TAB_IDS = ['dashboard', 'particle', 'dirac', '3d'];

export default function TabBar({ inline = false }) {
  const { state: simState, dispatch } = useSimulationContext();
  const { state: appState } = useAppContext();
  const tr = t[appState.lang].tabs;

  const TABS = TAB_IDS.map((id) => ({ id, label: tr[id] }));

  return (
    <nav
      role="tablist"
      aria-label="Vistas del simulador"
      style={{
        display: 'flex',
        gap: '0',
        ...(inline
          ? {}
          : {
              borderBottom: '1px solid var(--border-subtle)',
              background: 'var(--bg-secondary)',
              paddingLeft: '8px',
              flexShrink: 0,
            }),
      }}
    >
      {TABS.map((tab) => {
        const active = simState.activeTab === tab.id;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={active}
            aria-controls={`panel-${tab.id}`}
            onClick={() => dispatch({ type: 'SET_ACTIVE_TAB', payload: tab.id })}
            style={{
              padding: inline ? '0 16px' : '10px 20px',
              height: inline ? '44px' : 'auto',
              background: 'none',
              border: 'none',
              borderBottom: active ? '2px solid #06B6D4' : '2px solid transparent',
              color: active ? '#06B6D4' : 'var(--text-secondary)',
              fontSize: '11px',
              fontWeight: active ? 700 : 500,
              letterSpacing: '0.08em',
              fontFamily: 'var(--font-geist-mono), monospace',
              cursor: 'pointer',
              transition: 'color 0.15s, border-color 0.15s',
              outline: 'none',
            }}
            onMouseEnter={(e) => {
              if (!active) e.currentTarget.style.color = 'var(--text-primary)';
            }}
            onMouseLeave={(e) => {
              if (!active) e.currentTarget.style.color = 'var(--text-secondary)';
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
