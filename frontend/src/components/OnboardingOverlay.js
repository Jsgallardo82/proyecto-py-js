'use client';

/**
 * OnboardingOverlay — Tutorial de primer uso (< 2 min).
 *
 * Engine Spec v6.0 §16 (Pedagogical Content).
 * Cubre las 3 vistas en secuencia con pasos navegables.
 */

import { useState } from 'react';
import { useSimulationContext } from '../context/SimulationContext';

const STEPS = [
  {
    title: 'Bienvenido al Zitterbewegung Engine',
    body: 'Este simulador te permite explorar el "movimiento tembloroso" predicho por la ecuación de Dirac para el electrón relativista libre.',
    tip: 'Usa los controles laterales para ajustar la masa y observar cómo cambia la trayectoria.',
  },
  {
    title: 'Vista 1: Data Dashboard',
    body: 'Aquí ves la gráfica ⟨S₁(t)⟩ vs tiempo. La curva roja muestra el Zitterbewegung; la línea cian es la trayectoria sin masa.',
    tip: 'Abajo encontrarás el diagrama de configuración atómica y la probabilidad vs tiempo.',
  },
  {
    title: 'Vista 2: Particle View',
    body: 'Visualiza el electrón con su rastro punteado y el brillo (glow) que representa la oscilación ZB.',
    tip: 'Aumenta la masa (Ω) para ver oscilaciones más pronunciadas.',
  },
  {
    title: 'Vista 3: Dirac Sea',
    body: 'Explora el Mar de Dirac: zona de energía positiva, banda prohibida (2mc²), y energía negativa.',
    tip: 'Ajusta la energía del fotón y pulsa SHOOT PHOTON para ver creación de pares.',
  },
  {
    title: 'Niveles pedagógicos',
    body: 'Beginner: controles mínimos. Academic: ecuaciones superpuestas. Advanced: telemetría completa, FFT y comparación de solvers.',
    tip: 'Activa el modo Advanced para acceder a validación científica y benchmark.',
  },
  {
    title: 'Listo para simular',
    body: 'Pulsa PLAY SIMULATION para ejecutar. El backend QuTiP resolverá la ecuación de Schrödinger en tiempo real.',
    tip: 'Puedes cerrar este tutorial en cualquier momento con la X.',
  },
];

export default function OnboardingOverlay() {
  const { state, dispatch } = useSimulationContext();
  const [step, setStep] = useState(0);

  // Si ya se cerró, no renderizar
  if (!state.showOnboarding) return null;

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(10, 14, 39, 0.92)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Tutorial de primer uso"
    >
      <div
        style={{
          maxWidth: 520,
          width: '100%',
          background: '#141B2F',
          border: '1px solid #1E2A3A',
          borderRadius: 12,
          padding: 32,
          color: '#E8E9F3',
          fontFamily: "'Geist Sans', sans-serif",
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 11, color: '#06B6D4', fontWeight: 700, letterSpacing: '0.1em', marginBottom: 4 }}>
              PASO {step + 1} DE {STEPS.length}
            </div>
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>{current.title}</h2>
          </div>
          <button
            onClick={() => dispatch({ type: 'TOGGLE_ONBOARDING' })}
            aria-label="Cerrar tutorial"
            style={{
              background: 'none',
              border: 'none',
              color: '#9CA3AF',
              fontSize: 20,
              cursor: 'pointer',
            }}
          >
            ×
          </button>
        </div>

        {/* Body */}
        <p style={{ fontSize: 15, lineHeight: 1.6, margin: '0 0 12px' }}>{current.body}</p>
        <div style={{
          background: 'rgba(6, 182, 212, 0.08)',
          borderLeft: '3px solid #06B6D4',
          padding: '10px 14px',
          borderRadius: '0 6px 6px 0',
          fontSize: 13,
          color: '#A5F3FC',
          marginBottom: 24,
        }}>
          {current.tip}
        </div>

        {/* Progress bar */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 24 }}>
          {STEPS.map((_, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                height: 4,
                borderRadius: 2,
                background: i <= step ? '#06B6D4' : '#1E2A3A',
                transition: 'background 0.3s',
              }}
            />
          ))}
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'space-between' }}>
          <button
            onClick={() => setStep(Math.max(0, step - 1))}
            disabled={step === 0}
            style={{
              padding: '10px 20px',
              borderRadius: 8,
              border: '1px solid #1E2A3A',
              background: '#0A0E27',
              color: step === 0 ? '#1E2A3A' : '#E8E9F3',
              fontSize: 13,
              fontWeight: 600,
              cursor: step === 0 ? 'default' : 'pointer',
            }}
          >
            ← Anterior
          </button>

          {isLast ? (
            <button
              onClick={() => dispatch({ type: 'TOGGLE_ONBOARDING' })}
              style={{
                padding: '10px 24px',
                borderRadius: 8,
                border: 'none',
                background: '#10B981',
                color: '#fff',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              ¡Empezar!
            </button>
          ) : (
            <button
              onClick={() => setStep(step + 1)}
              style={{
                padding: '10px 24px',
                borderRadius: 8,
                border: 'none',
                background: '#06B6D4',
                color: '#0A0E27',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Siguiente →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
