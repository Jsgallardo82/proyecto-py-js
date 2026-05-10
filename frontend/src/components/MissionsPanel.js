'use client';

/**
 * MissionsPanel — Sistema de 5 misiones educativas guiadas.
 *
 * Engine Spec v6.0 §16 (Pedagogical Content).
 */

import { useSimulationContext } from '../context/SimulationContext';

const MISSIONS = [
  {
    id: 0,
    title: 'Misión 1: Partícula sin masa',
    level: 'Beginner',
    instruction: 'Mueve el slider de masa al mínimo (Ω → 10⁴ Hz).',
    expected: 'Línea recta perfecta en la gráfica.',
    explanation: 'Sin masa, la partícula viaja en línea recta a la velocidad c simulada. No hay Zitterbewegung.',
  },
  {
    id: 1,
    title: 'Misión 2: Añadiendo masa',
    level: 'Beginner',
    instruction: 'Aumenta gradualmente el slider de masa.',
    expected: 'Oscilaciones crecientes en la trayectoria.',
    explanation: 'Al añadir masa, aparece el Zitterbewegung. Cuanto mayor la masa, más rápidas y visibles las oscilaciones.',
  },
  {
    id: 2,
    title: 'Misión 3: El Mar de Dirac',
    level: 'Academic',
    instruction: 'Ve a Dirac Sea View, aumenta energía del fotón a ≥ 2mc² y pulsa SHOOT PHOTON.',
    expected: 'Creación de par electrón-positrón.',
    explanation: 'Bajo 2mc² el fotón rebota. Sobre 2mc² arranca un electrón del mar.',
  },
  {
    id: 3,
    title: 'Misión 4: Análisis FFT',
    level: 'Academic',
    instruction: 'Activa modo FFT y busca el pico de frecuencia.',
    expected: 'Pico en ν = 2mc²/h.',
    explanation: 'El pico espectral es la huella digital del Zitterbewegung. Su posición te da la masa de la partícula.',
  },
  {
    id: 4,
    title: 'Misión 5: Comparación de solvers',
    level: 'Advanced',
    instruction: 'Ejecuta RK45 y Crank-Nicolson con los mismos parámetros.',
    expected: 'Dos curvas casi idénticas con diferencia < 1e-6.',
    explanation: 'Diferentes métodos numéricos convergen al mismo resultado físico. La diferencia mide el error numérico.',
  },
];

export default function MissionsPanel() {
  const { state, dispatch } = useSimulationContext();
  const { missions, pedagogyLevel } = state;

  if (!missions.visible) return null;

  const currentMission = MISSIONS[missions.current] ?? MISSIONS[0];
  const isCompleted = missions.completed.includes(currentMission.id);

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 80,
        right: 16,
        width: 320,
        background: '#141B2F',
        border: '1px solid #1E2A3A',
        borderRadius: 8,
        padding: 16,
        zIndex: 50,
        fontFamily: "'Geist Sans', sans-serif",
        color: '#E8E9F3',
      }}
      role="region"
      aria-label="Panel de misiones educativas"
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#10B981' }}>
          {currentMission.title}
        </h3>
        <button
          onClick={() => dispatch({ type: 'TOGGLE_MISSIONS' })}
          aria-label="Cerrar panel de misiones"
          style={{
            background: 'none',
            border: 'none',
            color: '#9CA3AF',
            cursor: 'pointer',
            fontSize: 16,
          }}
        >
          ×
        </button>
      </div>

      <div style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 8 }}>
        Nivel: {currentMission.level} | Misión {currentMission.id + 1} de {MISSIONS.length}
      </div>

      <div style={{ fontSize: 13, lineHeight: 1.5, marginBottom: 12 }}>
        <strong style={{ color: '#06B6D4' }}>Instrucción:</strong> {currentMission.instruction}
      </div>

      <div style={{ fontSize: 12, lineHeight: 1.4, color: '#A5B4FC', marginBottom: 12 }}>
        {currentMission.explanation}
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={() => dispatch({ type: 'COMPLETE_MISSION', payload: currentMission.id })}
          disabled={isCompleted}
          style={{
            flex: 1,
            padding: '8px 12px',
            borderRadius: 6,
            border: 'none',
            background: isCompleted ? '#1E2A3A' : '#10B981',
            color: isCompleted ? '#9CA3AF' : '#fff',
            fontSize: 12,
            fontWeight: 600,
            cursor: isCompleted ? 'default' : 'pointer',
          }}
        >
          {isCompleted ? 'Completada' : 'Marcar completada'}
        </button>
        <button
          onClick={() => {
            const next = (missions.current + 1) % MISSIONS.length;
            dispatch({ type: 'SET_MISSION', payload: next });
          }}
          style={{
            padding: '8px 12px',
            borderRadius: 6,
            border: '1px solid #1E2A3A',
            background: '#0A0E27',
            color: '#E8E9F3',
            fontSize: 12,
            cursor: 'pointer',
          }}
        >
          Siguiente →
        </button>
      </div>
    </div>
  );
}
