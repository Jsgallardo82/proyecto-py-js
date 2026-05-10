'use client';

/**
 * SimulatorCanvas — Canvas base 60fps con error boundary.
 *
 * Wrapper que selecciona la vista activa (Dashboard / Particle / Dirac / 3D).
 * Engine Spec v6.0 §3 (Lightweight Renderer).
 */

import { Component } from 'react';
import DataDashboard from './DataDashboard';
import ParticleView from './ParticleView';
import DiracSeaView from './DiracSeaView';
import ThreeDView from './ThreeDView';
import { useSimulationContext } from '../context/SimulationContext';

class CanvasErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    console.error('[CanvasErrorBoundary]', error, info?.componentStack);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          height: '100%', background: '#0F1419', borderRadius: '8px',
          color: '#EF4444',
          fontFamily: "'Geist Mono', monospace", fontSize: '13px', padding: '24px',
          flexDirection: 'column', gap: '8px',
        }}>
          <span>Canvas Error</span>
          <span style={{ color: '#9CA3AF', fontSize: '11px' }}>
            {this.state.error?.message ?? 'Unknown renderer error'}
          </span>
        </div>
      );
    }
    return this.props.children;
  }
}

function ActiveView() {
  const { state } = useSimulationContext();

  switch (state.activeTab) {
    case 'particle': return <ParticleView />;
    case 'dirac': return <DiracSeaView />;
    case '3d': return <ThreeDView />;
    default: return <DataDashboard />;
  }
}

export default function SimulatorCanvas() {
  return (
    <CanvasErrorBoundary>
      <div style={{ width: '100%', height: '100%', background: '#0F1419', borderRadius: '8px', overflow: 'hidden' }}>
        <ActiveView />
      </div>
    </CanvasErrorBoundary>
  );
}