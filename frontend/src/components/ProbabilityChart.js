'use client';

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

    ctx.fillStyle  = C.title;
    ctx.font       = 'bold 11px Geist, system-ui';
    ctx.textAlign  = 'left';
    ctx.fillText('PROBABILITY VS. TIME', pad.left, pad.top - 8);

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

    const { simData, playhead } = state;
    if (!simData) return;

    const n = simData.S1.length;
    const tArr = simData.t;

    function toX(i) { return pad.left + (i / (n - 1)) * plotW; }
    function toY(v) { return pad.top + (1 - v) * plotH; }

    // Extract |c_e|² from S1(t): probability = normalized S1
    // S1 = <σ_y> evolves between -1 and 1. For a two-level system
    // in the interaction picture, |c_e|² = (1 + <σ_z>)/2.
    // We derive <σ_z> from the Bloch sphere: <σ_z>² = 1 - <σ_y>² - <σ_x>².
    // For |ψ(0)⟩ = |e⟩ with no dephasing, <σ_z> = cos(ωt), <σ_y> = sin(ωt),
    // giving |c_e|² = (1 + cos(ωt))/2 — the Rabi oscillation.
    // We use S1(= <σ_y>) and reconstruct <σ_z> via the purity constraint.
    const peArr = new Float64Array(n);
    for (let i = 0; i < n; i++) {
      const sy = simData.S1[i];
      const sz = Math.sqrt(Math.max(0, 1 - sy * sy));
      peArr[i] = (1 + sz) / 2;
    }

    // Excited state P_e(t) — solid red
    ctx.strokeStyle = C_EXCITED;
    ctx.lineWidth   = 1.5;
    ctx.setLineDash([]);
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const pe = peArr[i];
      if (i === 0) ctx.moveTo(toX(i), toY(pe));
      else ctx.lineTo(toX(i), toY(pe));
    }
    ctx.stroke();

    // Ground state P_g(t) = 1 − P_e(t) — dashed cyan
    ctx.strokeStyle = C_GROUND;
    ctx.lineWidth   = 1.5;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const pg = 1 - peArr[i];
      if (i === 0) ctx.moveTo(toX(i), toY(pg));
      else ctx.lineTo(toX(i), toY(pg));
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // X-axis labels in μs (physical time)
    ctx.fillStyle = C.text;
    ctx.font = "9px 'Geist Mono', monospace";
    ctx.textAlign = 'center';
    const tMin = tArr[0];
    const tMax = tArr[n - 1];
    for (let i = 0; i <= 4; i++) {
      const tVal = tMin + (i / 4) * (tMax - tMin);
      ctx.fillText(tVal.toFixed(0), pad.left + (i / 4) * plotW, pad.top + plotH + 14);
    }
    ctx.fillText('t (μs)', pad.left + plotW / 2, pad.top + plotH + 26);

    // Playhead dot (no animation — static position marker)
    if (playhead > 0 && playhead < n) {
      ctx.fillStyle = C_EXCITED;
      ctx.beginPath();
      ctx.arc(toX(playhead), toY(peArr[playhead]), 3, 0, Math.PI * 2);
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
