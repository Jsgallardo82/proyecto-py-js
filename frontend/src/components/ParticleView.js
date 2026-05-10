'use client';

/**
 * ParticleView — Vista 2: Electrón con glow + trail punteado.
 *
 * Engine Spec v6.0 §13 (Vista 2) + mockups img-002, img-003.
 * Canvas2D a 60 FPS. Grid sobre fondo azul marino oscuro.
 * Electrón: círculo cian con glow. Trayectoria: línea punteada persistente.
 */

import { useEffect, useRef, useCallback } from 'react';
import { useSimulationContext } from '../context/SimulationContext';

const TRAIL_FRAMES = 100;   // últimos N frames de estela
const C_ELECTRON = '#06B6D4';
const C_TRAIL = 'rgba(6, 182, 212, 0.4)';
const C_BG = '#0F1419';
const C_GRID = 'rgba(255,255,255,0.04)';
const C_MASSLESS_PATH = 'rgba(6, 182, 212, 0.25)';
const C_TEXT = '#9CA3AF';

export default function ParticleView() {
  const { state } = useSimulationContext();
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const stateRef = useRef(state);
  useEffect(() => { stateRef.current = state; });
  const trailRef = useRef([]);  // circular buffer of {x,y} canvas coords

  const draw = useCallback(() => {
    const state = stateRef.current;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const W = canvas.width;
    const H = canvas.height;

    // Clear
    ctx.fillStyle = C_BG;
    ctx.fillRect(0, 0, W, H);

    // ── Grid ────────────────────────────────────────────────────────
    ctx.strokeStyle = C_GRID;
    ctx.lineWidth = 1;
    const gridStep = 40;
    for (let x = 0; x < W; x += gridStep) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (let y = 0; y < H; y += gridStep) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }

    // ── Label ────────────────────────────────────────────────────────
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.font = "11px 'Geist Mono', monospace";
    ctx.textAlign = 'center';
    ctx.fillText('VACUUM STATE: DIRAC SEA', W / 2, 24);

    const { simData, playhead, isPlaying } = state;

    if (!simData || simData.S1.length < 2) {
      // Placeholder electron in center
      drawElectron(ctx, W / 2, H / 2, 16);
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.font = '13px Geist, system-ui';
      ctx.textAlign = 'center';
      ctx.fillText('Ejecuta una simulación para animar la partícula', W / 2, H / 2 + 40);
      return;
    }

    const n = simData.S1.length;
    const S1 = simData.S1;
    const tArr = simData.t;

    // Map S1 → canvas coords
    const S1min = Math.min(...S1);
    const S1max = Math.max(...S1);
    const S1range = S1max - S1min || 1;

    // Electron moves left→right along X (time axis), Y oscillates with S1
    const margin = 40;
    function tToX(i) {
      return margin + (i / (n - 1)) * (W - 2 * margin);
    }
    function s1ToY(v) {
      return H / 2 + ((v - (S1min + S1max) / 2) / S1range) * (H * 0.35);
    }

    // ── Massless baseline (straight horizontal) ──────────────────────
    ctx.strokeStyle = C_MASSLESS_PATH;
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 6]);
    ctx.beginPath();
    ctx.moveTo(margin, H / 2);
    ctx.lineTo(W - margin, H / 2);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = 'rgba(6,182,212,0.3)';
    ctx.font = "9px 'Geist Mono', monospace";
    ctx.textAlign = 'left';
    ctx.fillText('MASSLESS PATH (C)', margin + 4, H / 2 - 6);

    // ── Build/update trail ───────────────────────────────────────────
    const currX = tToX(playhead);
    const currY = s1ToY(S1[playhead]);

    const trail = trailRef.current;
    trail.push({ x: currX, y: currY });
    if (trail.length > TRAIL_FRAMES) trail.shift();

    // ── Draw trail (punteada, fading) ────────────────────────────────
    if (trail.length > 1) {
      ctx.setLineDash([3, 5]);
      ctx.lineWidth = 1.5;
      for (let i = 1; i < trail.length; i++) {
        const alpha = i / trail.length;
        ctx.strokeStyle = `rgba(6, 182, 212, ${alpha * 0.6})`;
        ctx.beginPath();
        ctx.moveTo(trail[i - 1].x, trail[i - 1].y);
        ctx.lineTo(trail[i].x, trail[i].y);
        ctx.stroke();
      }
      ctx.setLineDash([]);
    }

    // ── ZB full path (faint) ─────────────────────────────────────────
    ctx.strokeStyle = 'rgba(239,68,68,0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i <= playhead; i++) {
      const x = tToX(i);
      const y = s1ToY(S1[i]);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // ── Electron ─────────────────────────────────────────────────────
    drawElectron(ctx, currX, currY, 14);

    // ── Progress text ─────────────────────────────────────────────────
    ctx.fillStyle = C_TEXT;
    ctx.font = "10px 'Geist Mono', monospace";
    ctx.textAlign = 'right';
    const tNow = tArr[playhead]?.toFixed(1) ?? '0.0';
    ctx.fillText(`t = ${tNow} μs`, W - margin, H - 12);
  }, []);

  // Reset trail when sim data changes
  useEffect(() => {
    trailRef.current = [];
  }, [state.simData]);

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
      const rect = canvas.parentElement.getBoundingClientRect();
      canvas.width = rect.width || 600;
      canvas.height = rect.height || 400;
    }
    resize();
    const ro = new ResizeObserver(resize);
    if (canvasRef.current?.parentElement) ro.observe(canvasRef.current.parentElement);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      role="img"
      aria-label="Vista de partícula: electrón con glow moviéndose según la simulación del Zitterbewegung"
      className="canvas-container"
      style={{ width: '100%', height: '100%' }}
    >
      <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />
    </div>
  );
}

// ── Electron with glow ────────────────────────────────────────────────────

function drawElectron(ctx, x, y, r) {
  // Outer glow
  const glow = ctx.createRadialGradient(x, y, 0, x, y, r * 3);
  glow.addColorStop(0, 'rgba(6, 182, 212, 0.4)');
  glow.addColorStop(0.5, 'rgba(6, 182, 212, 0.1)');
  glow.addColorStop(1, 'rgba(6, 182, 212, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(x, y, r * 3, 0, Math.PI * 2);
  ctx.fill();

  // Core circle
  const grad = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r);
  grad.addColorStop(0, '#A5F3FC');
  grad.addColorStop(0.6, '#06B6D4');
  grad.addColorStop(1, '#0E7490');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();

  // Label
  ctx.fillStyle = '#0A0E27';
  ctx.font = `bold ${Math.max(8, r * 0.7)}px Geist, system-ui`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('e⁻', x, y);
  ctx.textBaseline = 'alphabetic';
}
