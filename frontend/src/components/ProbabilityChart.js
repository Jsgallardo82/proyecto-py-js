'use client';

/**
 * ProbabilityChart — Gráfica de Probabilidad vs. Tiempo (GT).
 *
 * Muestra |⟨e|ψ(t)⟩|² y |⟨g|ψ(t)⟩|² derivadas de los datos de simulación.
 * Engine Spec v6.0 §13 (Vista 1 — panel inferior derecho).
 */

import { useEffect, useRef, useCallback } from 'react';
import { useSimulationContext } from '../context/SimulationContext';
import { useAppContext } from '../context/AppContext';

const C_EXCITED = '#EF4444';
const C_GROUND  = '#06B6D4';

function getThemeColors(isDark) {
  return isDark
    ? { bg: '#0F1419', grid: 'rgba(255,255,255,0.06)', text: '#9CA3AF', title: '#E8E9F3' }
    : { bg: '#FFFFFF',  grid: 'rgba(0,0,0,0.08)',       text: '#4A5568', title: '#1A202C' };
}

export default function ProbabilityChart() {
  const { state }           = useSimulationContext();
  const { state: appState } = useAppContext();
  const canvasRef           = useRef(null);
  const animRef             = useRef(null);
  const stateRef            = useRef(state);
  const appStateRef         = useRef(appState);

  useEffect(() => { stateRef.current = state; });
  useEffect(() => { appStateRef.current = appState; });

  const draw = useCallback(() => {
    const state    = stateRef.current;
    const appState = appStateRef.current;
    const canvas   = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const W = canvas.width;
    const H = canvas.height;

    const C = getThemeColors(appState.theme === 'dark');

    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, W, H);

    const pad = { top: 28, right: 12, bottom: 28, left: 36 };
    const plotW = W - pad.left - pad.right;
    const plotH = H - pad.top - pad.bottom;

    // Title
    ctx.fillStyle  = C.title;
    ctx.font       = 'bold 11px Geist, system-ui';
    ctx.textAlign  = 'left';
    ctx.fillText('PROBABILITY VS. TIME (GT)', pad.left, pad.top - 8);

    // Grid
    ctx.strokeStyle = C.grid;
    ctx.lineWidth   = 1;
    for (let j = 0; j <= 4; j++) {
      const y = pad.top + (j / 4) * plotH;
      ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(pad.left + plotW, y); ctx.stroke();
    }
    for (let i = 0; i <= 4; i++) {
      const x = pad.left + (i / 4) * plotW;
      ctx.beginPath(); ctx.moveTo(x, pad.top); ctx.lineTo(x, pad.top + plotH); ctx.stroke();
    }

    // Y labels
    ctx.fillStyle  = C.text;
    ctx.font       = "9px 'Geist Mono', monospace";
    ctx.textAlign  = 'right';
    for (let j = 0; j <= 4; j++) {
      const val = 1.0 - (j / 4);
      ctx.fillText(val.toFixed(1), pad.left - 4, pad.top + (j / 4) * plotH + 3);
    }

    // X labels
    ctx.textAlign = 'center';
    const xLabels = ['0', 'π/2', 'π', '3π/2', '2π'];
    for (let i = 0; i <= 4; i++) {
      ctx.fillText(xLabels[i], pad.left + (i / 4) * plotW, pad.top + plotH + 14);
    }

    const { simData, playhead } = state;
    if (!simData) return;

    const n = simData.S1.length;
    const omega_zb = simData.frecuencia_zb > 0
      ? 2 * Math.PI * simData.frecuencia_zb * 1e-6
      : Math.PI / simData.t_max;

    function toX(i) { return pad.left + (i / (n - 1)) * plotW; }
    function toY(v) { return pad.top + (1 - v) * plotH; }

    // Excited state (solid red)
    ctx.strokeStyle = C_EXCITED;
    ctx.lineWidth   = 1.5;
    ctx.setLineDash([]);
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const t  = simData.t[i];
      const pe = Math.max(0, Math.min(1, 0.5 + 0.5 * Math.cos(omega_zb * t)));
      if (i === 0) ctx.moveTo(toX(i), toY(pe));
      else ctx.lineTo(toX(i), toY(pe));
    }
    ctx.stroke();

    // Ground state (dashed cyan)
    ctx.strokeStyle = C_GROUND;
    ctx.lineWidth   = 1.5;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const t  = simData.t[i];
      const pe = Math.max(0, Math.min(1, 0.5 + 0.5 * Math.cos(omega_zb * t)));
      const pg = 1 - pe;
      if (i === 0) ctx.moveTo(toX(i), toY(pg));
      else ctx.lineTo(toX(i), toY(pg));
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // Playhead dot
    if (playhead > 0 && playhead < n) {
      const t  = simData.t[playhead];
      const pe = Math.max(0, Math.min(1, 0.5 + 0.5 * Math.cos(omega_zb * t)));
      ctx.fillStyle = C_EXCITED;
      ctx.beginPath();
      ctx.arc(toX(playhead), toY(pe), 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }, []);

  useEffect(() => {
    function loop() {
      draw();
      animRef.current = requestAnimationFrame(loop);
    }
    animRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animRef.current);
  }, [draw]);

  useEffect(() => {
    function resize() {
      const canvas = canvasRef.current;
      if (!canvas || !canvas.parentElement) return;
      const rect    = canvas.parentElement.getBoundingClientRect();
      canvas.width  = rect.width  || 280;
      canvas.height = rect.height || 160;
    }
    resize();
    const ro = new ResizeObserver(resize);
    if (canvasRef.current?.parentElement) ro.observe(canvasRef.current.parentElement);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      role="img"
      aria-label="Gráfica de probabilidad de estados excitado y fundamental vs tiempo"
      className="canvas-container"
      style={{ width: '100%', height: '100%', minHeight: '120px' }}
    >
      <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />
    </div>
  );
}
