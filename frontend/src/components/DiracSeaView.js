'use client';

/**
 * DiracSeaView — Vista 3: Mar de Dirac con 3 zonas, fotón, creación de pares.
 *
 * Engine Spec v6.0 §13 (Vista 3) + mockups img-004, img-005.
 * Colores canónicos: zona positiva #4F46E5, prohibida #F97316, negativa #EC4899.
 *
 * Nota pedagógica: El Mar de Dirac es una interpretación histórica, no la
 * descripción del vacío en la QFT moderna completa.
 */

import { useEffect, useRef, useCallback } from 'react';
import { useSimulationContext } from '../context/SimulationContext';
import { useAppContext } from '../context/AppContext';

// Colores canónicos científicos — fijos en ambos temas (Engine Spec v6.0 §17)
const C_POS_ZONE         = 'rgba(79, 70, 229, 0.15)';
const C_POS_BORDER       = '#4F46E5';
const C_NEG_ZONE         = 'rgba(236, 72, 153, 0.15)';
const C_NEG_BORDER       = '#EC4899';
const C_FORBIDDEN        = 'rgba(249, 115, 22, 0.25)';
const C_FORBIDDEN_BORDER = '#F97316';
const C_PHOTON           = '#FBBF24';
const C_ELECTRON         = '#4F46E5';
const C_POSITRON         = '#FB923C';

function getThemeColors(isDark) {
  return isDark
    ? { bg: '#0A0E27', text: '#E8E9F3', muted: '#9CA3AF' }
    : { bg: '#F0F4F8', text: '#1A202C', muted: '#4A5568' };
}

// Grid electrons spacing
const GRID_SPACING = 24;
const ELECTRON_R = 5;

export default function DiracSeaView() {
  const { state }           = useSimulationContext();
  const { state: appState } = useAppContext();
  const canvasRef           = useRef(null);
  const animRef             = useRef(null);
  const stateRef            = useRef(state);
  const appStateRef         = useRef(appState);
  const frameRef            = useRef(0);

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
    frameRef.current++;
    const frame = frameRef.current;

    const C = getThemeColors(appState.theme === 'dark');

    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, W, H);

    const { diracData, photonFired, pairCreated, showInterference, photonEnergyFactor } = state;

    // ── Zone layout ──────────────────────────────────────────────────
    const zoneForbiddenH = Math.max(30, H * 0.12);
    const zoneForbiddenY = H / 2 - zoneForbiddenH / 2;
    const zonePosH = zoneForbiddenY;
    const zoneNegH = H - zoneForbiddenY - zoneForbiddenH;

    // Positive energy zone (top)
    ctx.fillStyle = C_POS_ZONE;
    ctx.fillRect(0, 0, W, zonePosH);
    ctx.strokeStyle = C_POS_BORDER;
    ctx.lineWidth = 1;
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(0, zonePosH);
    ctx.lineTo(W, zonePosH);
    ctx.stroke();

    // Zone labels
    ctx.fillStyle = C_POS_BORDER;
    ctx.font = "bold 11px 'Geist Mono', monospace";
    ctx.textAlign = 'left';
    ctx.fillText('POSITIVE ENERGY STATE (ELECTRONS)', 12, 18);
    ctx.fillStyle = C.muted;
    ctx.font = "10px 'Geist Mono', monospace";
    ctx.fillText('E ≥ mc²', 12, 32);

    // Forbidden zone (middle)
    ctx.fillStyle = C_FORBIDDEN;
    ctx.fillRect(0, zoneForbiddenY, W, zoneForbiddenH);
    ctx.strokeStyle = C_FORBIDDEN_BORDER;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, zoneForbiddenY + zoneForbiddenH);
    ctx.lineTo(W, zoneForbiddenY + zoneForbiddenH);
    ctx.stroke();

    ctx.fillStyle = C_FORBIDDEN_BORDER;
    ctx.font = "bold 10px 'Geist Mono', monospace";
    ctx.textAlign = 'center';
    ctx.fillText('FORBIDDEN | ZITTERBEWEGUNG INTERFERENCE (2MC²)', W / 2, zoneForbiddenY + zoneForbiddenH / 2 + 4);

    // Negative energy zone (bottom)
    ctx.fillStyle = C_NEG_ZONE;
    ctx.fillRect(0, zoneForbiddenY + zoneForbiddenH, W, zoneNegH);

    ctx.fillStyle = C_NEG_BORDER;
    ctx.font = "bold 11px 'Geist Mono', monospace";
    ctx.textAlign = 'left';
    ctx.fillText('DIRAC SEA (NEGATIVE ENERGY)', 12, zoneForbiddenY + zoneForbiddenH + 18);
    ctx.fillStyle = C.muted;
    ctx.font = "10px 'Geist Mono', monospace";
    ctx.fillText('E ≤ −mc²', 12, zoneForbiddenY + zoneForbiddenH + 32);

    // ── Grid of electrons in negative zone ───────────────────────────
    const seaTop = zoneForbiddenY + zoneForbiddenH + 40;
    drawElectronGrid(ctx, W, seaTop, H, frame, pairCreated);

    // ── Photon animation ─────────────────────────────────────────────
    if (photonFired) {
      const progress = ((frame % 60) / 60);
      const photonX = progress * W;
      const photonY = zoneForbiddenY + zoneForbiddenH / 2;
      drawPhoton(ctx, photonX, photonY, frame);
    }

    // ── Pair creation event ──────────────────────────────────────────
    if (pairCreated) {
      // Excited electron in positive zone
      const elecX = W * 0.55;
      const elecY = zonePosH * 0.5;
      drawSolidElectron(ctx, elecX, elecY, 10, C_ELECTRON);
      ctx.fillStyle = C.text;
      ctx.font = "bold 10px 'Geist Mono', monospace";
      ctx.textAlign = 'left';
      ctx.fillText('NEW ELECTRON (e⁻)', elecX + 14, elecY + 4);

      // Dashed arrow (jump from sea to positive zone)
      ctx.strokeStyle = '#FBBF24';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(elecX, seaTop + 10);
      ctx.lineTo(elecX, elecY + 14);
      ctx.stroke();
      ctx.setLineDash([]);
      // Arrowhead
      ctx.fillStyle = '#FBBF24';
      ctx.beginPath();
      ctx.moveTo(elecX, elecY + 12);
      ctx.lineTo(elecX - 5, elecY + 22);
      ctx.lineTo(elecX + 5, elecY + 22);
      ctx.closePath();
      ctx.fill();

      // Positron (hole) — dashed circle in sea
      const holeX = elecX;
      const holeY = seaTop + 20;
      drawPositron(ctx, holeX, holeY, 8, frame);
      ctx.fillStyle = C_POSITRON;
      ctx.font = "bold 10px 'Geist Mono', monospace";
      ctx.textAlign = 'left';
      ctx.fillText('HOLE (POSITRON e⁺)', holeX + 14, holeY + 4);
    }

    // ── Interference overlay (showInterference) ──────────────────────
    if (showInterference) {
      drawInterferenceOverlay(ctx, W, zoneForbiddenY, zoneForbiddenH, frame);
    }

    // ── Photon energy indicator ──────────────────────────────────────
    ctx.fillStyle = C.muted;
    ctx.font = "10px 'Geist Mono', monospace";
    ctx.textAlign = 'right';
    ctx.fillText(
      `hν = ${photonEnergyFactor.toFixed(2)} mc²  |  threshold = 2mc²`,
      W - 12,
      H - 8,
    );

    // ── Legend ───────────────────────────────────────────────────────
    drawLegend(ctx, W, H);
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
      aria-label="Vista del Mar de Dirac: zonas de energía positiva, prohibida y negativa con animación de fotón y creación de pares"
      className="canvas-container"
      style={{ width: '100%', height: '100%' }}
    >
      <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────

function drawElectronGrid(ctx, W, top, H, frame, pairCreated) {
  const cols = Math.floor(W / GRID_SPACING);
  const rows = Math.floor((H - top) / GRID_SPACING);

  // Hole position
  const holeCol = Math.floor(cols * 0.55);
  const holeRow = 0;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = (c + 0.5) * GRID_SPACING;
      const y = top + (r + 0.5) * GRID_SPACING;

      // Skip hole position when pair created
      if (pairCreated && r === holeRow && c === holeCol) continue;

      ctx.fillStyle = 'rgba(236, 72, 153, 0.5)';
      ctx.beginPath();
      ctx.arc(x, y, ELECTRON_R * 0.6, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawSolidElectron(ctx, x, y, r, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#FFF';
  ctx.font = `bold ${Math.max(7, r * 0.7)}px Geist, system-ui`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('e⁻', x, y);
  ctx.textBaseline = 'alphabetic';
}

function drawPositron(ctx, x, y, r, frame) {
  // Dashed circle (pulsing)
  const pulse = 0.7 + 0.3 * Math.sin(frame * 0.15);
  ctx.strokeStyle = `rgba(251, 146, 60, ${pulse})`;
  ctx.lineWidth = 2;
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = `rgba(251, 146, 60, ${0.3 * pulse})`;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  // Label
  ctx.fillStyle = C_POSITRON;
  ctx.font = `bold ${Math.max(7, r * 0.7)}px Geist, system-ui`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('e⁺', x, y);
  ctx.textBaseline = 'alphabetic';
}

function drawPhoton(ctx, x, y, frame) {
  // Sinusoidal wave for photon
  const waveLen = 30;
  const amp = 12;
  ctx.strokeStyle = C_PHOTON;
  ctx.lineWidth = 2;
  ctx.setLineDash([]);
  ctx.beginPath();
  for (let dx = -60; dx <= 60; dx += 2) {
    const wx = x + dx;
    const wy = y + amp * Math.sin((dx / waveLen) * 2 * Math.PI);
    if (dx === -60) ctx.moveTo(wx, wy);
    else ctx.lineTo(wx, wy);
  }
  ctx.stroke();

  // Photon label
  ctx.fillStyle = C_PHOTON;
  ctx.font = 'bold 13px Geist, system-ui';
  ctx.textAlign = 'center';
  ctx.fillText('γ', x, y - 18);
}

function drawInterferenceOverlay(ctx, W, zoneY, zoneH, frame) {
  // Show interference between positive and negative energy components
  ctx.globalAlpha = 0.5;
  for (let x = 0; x < W; x += 3) {
    const y1 = zoneY + Math.sin((x / W) * 6 * Math.PI + frame * 0.05) * zoneH * 0.4 + zoneH / 2;
    const y2 = zoneY + Math.cos((x / W) * 6 * Math.PI + frame * 0.05) * zoneH * 0.4 + zoneH / 2;
    ctx.fillStyle = '#4F46E5';
    ctx.fillRect(x, y1, 2, 2);
    ctx.fillStyle = '#EC4899';
    ctx.fillRect(x, y2, 2, 2);
  }
  ctx.globalAlpha = 1.0;
}

function drawLegend(ctx, W, H) {
  const items = [
    { color: '#4F46E5', label: '● ELECTRON', solid: true },
    { color: '#FB923C', label: '○ POSITRON (HOLE)', solid: false },
    { color: '#FBBF24', label: 'PHOTON' },
  ];

  ctx.font = "10px 'Geist Mono', monospace";
  let x = 12;
  const y = H - 8;

  for (const item of items) {
    ctx.fillStyle = item.color;
    ctx.textAlign = 'left';
    ctx.fillText(item.label, x, y);
    x += ctx.measureText(item.label).width + 20;
  }
}
