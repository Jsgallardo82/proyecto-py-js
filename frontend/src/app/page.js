'use client';

/**
 * Main Page — Simulador del Efecto Zitterbewegung.
 *
 * Layout completo con 3 tabs, canvas, panel de controles y barra inferior.
 * Engine Spec v6.0 §13, §17, §21 (responsive layout).
 */

import { SimulationProvider } from '../context/SimulationContext';
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
  const { state } = useSimulationContext();
  const isDashboard = state.activeTab === 'dashboard';

  return (
    <div id="main-content" style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100dvh',
      background: '#0A0E27',
      color: '#E8E9F3',
      overflow: 'hidden',
    }}>
      {/* ── Header ─────────────────────────────────────────────────── */}
      <header style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 20px',
        background: '#141B2F',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        flexShrink: 0,
      }}>
        <div>
          <span style={{
            fontSize: '13px',
            fontWeight: 900,
            letterSpacing: '0.15em',
            color: '#E8E9F3',
          }}>
            ZITTERBEWEGUNG ENGINE LITE
          </span>
          <span style={{
            marginLeft: '8px',
            fontSize: '10px',
            fontWeight: 600,
            letterSpacing: '0.08em',
            color: '#4F46E5',
            fontFamily: 'var(--font-geist-mono), monospace',
          }}>
            v6.0
          </span>
        </div>
        <div style={{ fontSize: '11px', color: '#9CA3AF', fontFamily: 'var(--font-geist-mono), monospace' }}>
          Juan Gallardo · IUB 2026
        </div>
      </header>

      {/* ── Tab bar ────────────────────────────────────────────────── */}
      <TabBar />

      {/* ── Main content ───────────────────────────────────────────── */}
      <div style={{
        display: 'flex',
        flex: 1,
        overflow: 'hidden',
        gap: '0',
      }}>
        {/* Canvas area — 70% width on lg */}
        <main style={{
          flex: '1 1 0',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          padding: '12px',
          gap: '10px',
        }}>
          {/* Main canvas */}
          <div style={{ flex: isDashboard ? '1 1 55%' : '1 1 100%', minHeight: 0 }}>
            <SimulatorCanvas />
          </div>

          {/* Bottom panels only in Dashboard */}
          {isDashboard && (
            <div style={{
              flex: '0 0 auto',
              height: '160px',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '10px',
            }}>
              <div style={{
                background: '#141B2F',
                borderRadius: '8px',
                padding: '8px',
                border: '1px solid rgba(255,255,255,0.06)',
              }}>
                <div style={{ fontSize: '10px', fontWeight: 700, color: '#9CA3AF', letterSpacing: '0.08em', marginBottom: '4px', fontFamily: 'var(--font-geist-mono), monospace' }}>
                  ATOMIC CONFIGURATION
                </div>
                <div style={{ height: 'calc(100% - 20px)' }}>
                  <AtomicConfig />
                </div>
              </div>
              <div style={{
                background: '#141B2F',
                borderRadius: '8px',
                padding: '8px',
                border: '1px solid rgba(255,255,255,0.06)',
              }}>
                <div style={{ height: '100%' }}>
                  <ProbabilityChart />
                </div>
              </div>
            </div>
          )}
        </main>

        {/* Controls panel — 30% width */}
        <aside
          aria-label="Panel de controles de simulación"
          style={{
            width: '300px',
            flexShrink: 0,
            borderLeft: '1px solid rgba(255,255,255,0.06)',
            overflowY: 'auto',
          }}
        >
          <ControlsPanel />
        </aside>
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
