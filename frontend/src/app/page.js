'use client';

/**
 * Main Page — Simulador del Efecto Zitterbewegung.
 *
 * Layout ISOTOPE: header con branding + tabs centradas + toggles a la derecha.
 * Panel de controles a la IZQUIERDA del canvas.
 * Engine Spec v6.0 §13, §17, §21 (responsive layout).
 */

import { SimulationProvider } from '../context/SimulationContext';
import { useAppContext } from '../context/AppContext';
import { t } from '../lib/translations';
import SimulatorCanvas from '../components/SimulatorCanvas';
import ControlsPanel from '../components/ControlsPanel';
import AtomicConfig from '../components/AtomicConfig';
import ProbabilityChart from '../components/ProbabilityChart';
import BottomBar from '../components/BottomBar';
import TabBar from '../components/TabBar';
import MissionsPanel from '../components/MissionsPanel';
import OnboardingOverlay from '../components/OnboardingOverlay';
import { useSimulationContext } from '../context/SimulationContext';

function MainLayout() {
  const { state: simState } = useSimulationContext();
  const { state: appState, dispatch: appDispatch } = useAppContext();
  const isDashboard = simState.activeTab === 'dashboard';
  const tr = t[appState.lang];
  const isDark = appState.theme === 'dark';

  const toggleBtnStyle = {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: '6px',
    color: 'var(--text-secondary)',
    fontSize: '10px',
    fontWeight: 700,
    fontFamily: 'var(--font-geist-mono), monospace',
    letterSpacing: '0.07em',
    padding: '5px 10px',
    cursor: 'pointer',
    transition: 'background 0.15s, color 0.15s',
    whiteSpace: 'nowrap',
  };

  return (
    <div
      id="main-content"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100dvh',
        background: 'var(--bg-primary)',
        color: 'var(--text-primary)',
        overflow: 'hidden',
      }}
    >
      {/* ── Header ISOTOPE ─────────────────────────────────────────── */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '0 16px',
          height: '44px',
          background: 'var(--bg-secondary)',
          borderBottom: '1px solid var(--border-subtle)',
          flexShrink: 0,
          gap: '12px',
        }}
      >
        {/* Branding */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', flexShrink: 0 }}>
          <span
            style={{
              fontSize: '12px',
              fontWeight: 900,
              letterSpacing: '0.12em',
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-geist-mono), monospace',
            }}
          >
            {tr.title}
          </span>
          <span
            style={{
              fontSize: '10px',
              fontWeight: 600,
              letterSpacing: '0.08em',
              color: '#4F46E5',
              fontFamily: 'var(--font-geist-mono), monospace',
            }}
          >
            {tr.version}
          </span>
        </div>

        {/* Tabs centradas */}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
          <TabBar inline />
        </div>

        {/* Toggles: tema + idioma */}
        <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
          <button
            onClick={() => appDispatch({ type: 'TOGGLE_THEME' })}
            aria-label={isDark ? 'Cambiar a modo día' : 'Cambiar a modo noche'}
            style={toggleBtnStyle}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
          >
            {isDark ? tr.theme.toggleLight : tr.theme.toggleDark}
          </button>
          <button
            onClick={() => appDispatch({ type: 'TOGGLE_LANG' })}
            aria-label="Cambiar idioma"
            style={toggleBtnStyle}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
          >
            {tr.lang.switch}
          </button>
        </div>
      </header>

      {/* ── Main content ───────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          flex: 1,
          overflow: 'hidden',
        }}
      >
        {/* ── Controls panel — izquierda ─────────────────────────── */}
        <aside
          aria-label="Panel de controles de simulación"
          style={{
            width: '280px',
            flexShrink: 0,
            borderRight: '1px solid var(--border-subtle)',
            overflowY: 'auto',
          }}
        >
          <ControlsPanel />
        </aside>

        {/* ── Canvas area ────────────────────────────────────────── */}
        <main
          style={{
            flex: '1 1 0',
            display: 'flex',
            flexDirection: 'column',
            overflowY: 'auto',
            overflowX: 'hidden',
            padding: '12px',
            gap: '10px',
          }}
        >
          {/* Main canvas */}
          <div style={{ flex: isDashboard ? '1 1 55%' : '1 1 100%', minHeight: '300px' }}>
            <SimulatorCanvas />
          </div>

          {/* Bottom panels — solo en Dashboard */}
          {isDashboard && (
            <div
              style={{
                flex: '0 0 auto',
                minHeight: '220px',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '10px',
              }}
            >
              <div
                style={{
                  background: 'var(--bg-secondary)',
                  borderRadius: '8px',
                  padding: '8px',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    color: 'var(--text-secondary)',
                    letterSpacing: '0.08em',
                    marginBottom: '4px',
                    fontFamily: 'var(--font-geist-mono), monospace',
                  }}
                >
                  {appState.lang === 'es' ? 'CONFIGURACIÓN ATÓMICA' : 'ATOMIC CONFIGURATION'}
                </div>
                <div style={{ height: 'calc(100% - 20px)' }}>
                  <AtomicConfig />
                </div>
              </div>
              <div
                style={{
                  background: 'var(--bg-secondary)',
                  borderRadius: '8px',
                  padding: '8px',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div style={{ height: '100%' }}>
                  <ProbabilityChart />
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ── Bottom control bar ─────────────────────────────────────── */}
      <BottomBar />

      {/* ── Missions overlay ─────────────────────────────────────────── */}
      <MissionsPanel />

      {/* ── Onboarding tutorial ──────────────────────────────────────── */}
      <OnboardingOverlay />
    </div>
  );
}

export default function Page() {
  return (
    <SimulationProvider>
      <MainLayout />
    </SimulationProvider>
  );
}
