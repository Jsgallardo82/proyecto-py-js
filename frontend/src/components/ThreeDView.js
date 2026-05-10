'use client';

/**
 * ThreeDView — Escena 3D de la simulacion Zitterbewegung.
 *
 * Usa React Three Fiber (@react-three/fiber) y Drei (@react-three/drei)
 * para renderizar el electron, su trayectoria ZB y el Mar de Dirac en 3D.
 *
 * Engine Spec v6.0 §3 (Renderer), §7 (ECS Runtime).
 *
 * Nota: Canvas se importa dinamicamente para evitar SSR issues con WebGL.
 */

import { Suspense, useEffect, useState, useCallback, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars, Grid } from '@react-three/drei';
import { useSimulationContext } from '../context/SimulationContext';
import Electron3D from './three/Electron3D';
import Trajectory3D from './three/Trajectory3D';
import DiracSea3D from './three/DiracSea3D';
import SceneLights from './three/SceneLights';

function Scene() {
  const { state } = useSimulationContext();
  const { simData, diracData } = state;

  return (
    <>
      <SceneLights />
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
      <Grid
        position={[0, -2, 0]}
        args={[20, 20]}
        cellSize={0.5}
        cellThickness={0.5}
        cellColor="#1E2A3A"
        sectionSize={2}
        sectionThickness={1}
        sectionColor="#06B6D4"
        fadeDistance={15}
        fadeStrength={1}
        infiniteGrid
      />

      {simData && (
        <>
          <Electron3D simData={simData} playhead={state.playhead} />
          <Trajectory3D simData={simData} />
        </>
      )}

      <DiracSea3D diracData={diracData} />

      <OrbitControls
        enablePan
        enableZoom
        enableRotate
        minDistance={2}
        maxDistance={20}
        target={[0, 0, 0]}
      />
    </>
  );
}

function Loader() {
  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#0F1419',
      color: '#9CA3AF',
      fontFamily: 'var(--font-geist-mono), monospace',
      fontSize: '12px',
      zIndex: 10,
    }}>
      <div className="skeleton" style={{ width: 120, height: 12 }} />
    </div>
  );
}

function ErrorFallback({ error, onRetry }) {
  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#0F1419',
      borderRadius: 'var(--radius-md, 8px)',
      padding: '24px',
      gap: '12px',
    }}>
      <div style={{
        fontSize: '13px',
        fontWeight: 700,
        color: '#EF4444',
        fontFamily: 'var(--font-geist-mono), monospace',
        letterSpacing: '0.08em',
      }}>
        3D RENDERER ERROR
      </div>
      <div style={{
        fontSize: '11px',
        color: '#9CA3AF',
        fontFamily: 'var(--font-geist-mono), monospace',
        textAlign: 'center',
        maxWidth: '400px',
      }}>
        {error?.message ?? 'WebGL context unavailable. Check your browser settings.'}
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            marginTop: '8px',
            padding: '8px 16px',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '6px',
            background: 'rgba(79, 70, 229, 0.15)',
            color: '#4F46E5',
            fontSize: '11px',
            fontWeight: 700,
            cursor: 'pointer',
            fontFamily: 'var(--font-geist-mono), monospace',
            letterSpacing: '0.05em',
          }}
        >
          RETRY
        </button>
      )}
    </div>
  );
}

export default function ThreeDView() {
  const [webglError, setWebglError] = useState(null);
  const [retryKey, setRetryKey] = useState(0);
  const containerRef = useRef(null);

  const handleRetry = useCallback(() => {
    setWebglError(null);
    setRetryKey(k => k + 1);
  }, []);

  useEffect(() => {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!gl) {
      setWebglError(new Error('WebGL is not supported in this browser'));
    }
  }, [retryKey]);

  if (webglError) {
    return (
      <div style={{ width: '100%', height: '100%', position: 'relative' }}>
        <ErrorFallback error={webglError} onRetry={handleRetry} />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        background: '#0F1419',
        borderRadius: '8px',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <Suspense fallback={<Loader />}>
        <Canvas
          key={retryKey}
          camera={{ position: [5, 3, 5], fov: 60 }}
          gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
          dpr={[1, 2]}
          onCreated={(state) => {
            const gl = state.gl;
            gl.setClearColor('#0F1419');
          }}
          onError={(err) => {
            setWebglError(err);
          }}
        >
          <Scene />
        </Canvas>
      </Suspense>
    </div>
  );
}