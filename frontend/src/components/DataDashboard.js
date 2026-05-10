'use client';

import { useRef, useEffect, useCallback } from 'react';
import { useSimulationContext } from '../context/SimulationContext';
import ScientificErrorBoundary from './ScientificErrorBoundary';

// Colores canónicos (Engine Spec v6.0 §17)
const C_MASSLESS = '#06B6D4';
const C_ZITTER = '#EF4444';
const C_ACCENT = '#10B981';
const C_BG_CANVAS = '#0F1419';
const C_GRID = 'rgba(255,255,255,0.06)';
const C_AXIS = 'rgba(255,255,255,0.25)';
const C_TEXT = '#9CA3AF';

function DataDashboardInner() {
  const { state } = useSimulationContext();
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const stateRef = useRef(state);
  useEffect(() => { stateRef.current = state; });

  const draw = useCallback(() => {
    const state = stateRef.current;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const W = canvas.width;
    const H = canvas.height;

    // Clear
    ctx.fillStyle = C_BG_CANVAS;
    ctx.fillRect(0, 0, W, H);

    const pad = { top: 40, right: 20, bottom: 50, left: 60 };
    const plotW = W - pad.left - pad.right;
    const plotH = H - pad.top - pad.bottom;

    const { simData, playhead, comparisonData, fftMode, fftData } = state;

    // ── Grid ────────────────────────────────────────────────────────
    ctx.strokeStyle = C_GRID;
    ctx.lineWidth = 1;
    const gridX = 6, gridY = 5;
    for (let i = 0; i <= gridX; i++) {
      const x = pad.left + (i / gridX) * plotW;
      ctx.beginPath(); ctx.moveTo(x, pad.top); ctx.lineTo(x, pad.top + plotH); ctx.stroke();
    }
    for (let j = 0; j <= gridY; j++) {
      const y = pad.top + (j / gridY) * plotH;
      ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(pad.left + plotW, y); ctx.stroke();
    }

    // ── Axes labels ─────────────────────────────────────────────────
    ctx.fillStyle = C_TEXT;
    ctx.font = "11px 'Geist Mono', monospace";
    ctx.textAlign = 'center';

    // X axis: tiempo [μs]
    const tMaxLabel = simData?.t_max ?? 200;
    for (let i = 0; i <= gridX; i++) {
      const t = (i / gridX) * tMaxLabel;
      const x = pad.left + (i / gridX) * plotW;
      ctx.fillText(t.toFixed(0), x, pad.top + plotH + 18);
    }
    ctx.fillText('Tiempo (μs)', pad.left + plotW / 2, H - 4);

    // Y axis: ⟨S₁⟩ [μm]
    ctx.textAlign = 'right';
    const yRange = getYRange(simData, comparisonData);
    for (let j = 0; j <= gridY; j++) {
      const val = yRange.min + ((gridY - j) / gridY) * (yRange.max - yRange.min);
      const y = pad.top + (j / gridY) * plotH;
      ctx.fillText(val.toFixed(3), pad.left - 6, y + 4);
    }

    // Y-axis title (rotated)
    ctx.save();
    ctx.translate(14, pad.top + plotH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.fillText('⟨S₁⟩ (μm)', 0, 0);
    ctx.restore();

    // ── Title ────────────────────────────────────────────────────────
    ctx.fillStyle = '#E8E9F3';
    ctx.font = 'bold 13px Geist, system-ui';
    ctx.textAlign = 'left';
    ctx.fillText('Expected Position (S₁) vs. Time (μs)', pad.left, pad.top - 14);

    if (!simData) {
      // Placeholder
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.font = '14px Geist, system-ui';
      ctx.textAlign = 'center';
      ctx.fillText('Presiona PLAY SIMULATION para comenzar', pad.left + plotW / 2, pad.top + plotH / 2);
      return;
    }

    // ── FFT mode ─────────────────────────────────────────────────────
    if (fftMode && fftData) {
      drawFFT(ctx, fftData, pad, plotW, plotH);
      drawLegend(ctx, W, pad, true);
      return;
    }

    // ── Helper to map data to canvas coords ──────────────────────────
    const tArr = simData.t;
    const n = tArr.length;
    const tMin = tArr[0] ?? 0;
    const tMax = tArr[n - 1] ?? 200;

    function toX(t) {
      return pad.left + ((t - tMin) / (tMax - tMin)) * plotW;
    }
    function toY(v) {
      return pad.top + plotH - ((v - yRange.min) / (yRange.max - yRange.min)) * plotH;
    }

    // ── Massless baseline (straight line at mean + linear drift) ─────
    const S1 = simData.S1;
    const S1_mean = n > 0 ? S1.reduce((a, b) => a + b, 0) / n : 0;
    const slope = n > 1 ? (S1[n - 1] - S1[0]) / (tMax - tMin) : 0;

    ctx.strokeStyle = C_MASSLESS;
    ctx.lineWidth = 2;
    ctx.setLineDash([]);
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const x = toX(tArr[i]);
      const y_massless = toY(S1[0] + slope * (tArr[i] - tArr[0]));
      if (i === 0) ctx.moveTo(x, y_massless);
      else ctx.lineTo(x, y_massless);
    }
    ctx.stroke();

    // ── ZB curve (from backend simulation) ──────────────────────────
    ctx.strokeStyle = C_ZITTER;
    ctx.lineWidth = 2;
    ctx.setLineDash([]);
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const x = toX(tArr[i]);
      const y = toY(S1[i]);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // ── Comparison solver curves ─────────────────────────────────────
    if (comparisonData?.cn) {
      const cnS1 = comparisonData.cn.S1;
      ctx.strokeStyle = '#4F46E5';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      for (let i = 0; i < Math.min(n, cnS1.length); i++) {
        const x = toX(tArr[i]);
        const y = toY(cnS1[i]);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // ── Playhead marker ──────────────────────────────────────────────
    if (playhead > 0 && playhead < n) {
      const markerX = toX(tArr[playhead]);
      ctx.fillStyle = C_ZITTER;
      ctx.beginPath();
      ctx.moveTo(markerX, pad.top + plotH + 4);
      ctx.lineTo(markerX - 6, pad.top + plotH + 14);
      ctx.lineTo(markerX + 6, pad.top + plotH + 14);
      ctx.closePath();
      ctx.fill();

      // Vertical line
      ctx.strokeStyle = 'rgba(239,68,68,0.4)';
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 2]);
      ctx.beginPath();
      ctx.moveTo(markerX, pad.top);
      ctx.lineTo(markerX, pad.top + plotH);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // ── Legend ───────────────────────────────────────────────────────
    drawLegend(ctx, W, pad, false, !!comparisonData?.cn);
  }, []);

  useEffect(() => {
    function loop() {
      draw();
      animRef.current = requestAnimationFrame(loop);
    }
    animRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animRef.current);
  }, [draw]);

  // Resize canvas to container
  useEffect(() => {
    function resize() {
      const canvas = canvasRef.current;
      if (!canvas || !canvas.parentElement) return;
      const rect = canvas.parentElement.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
    }
    resize();
    const ro = new ResizeObserver(resize);
    if (canvasRef.current && canvasRef.current.parentElement) ro.observe(canvasRef.current.parentElement);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      role="img"
      aria-label="Gráfica de posición esperada S₁ vs tiempo"
      className="canvas-container"
      style={{ width: '100%', height: '100%' }}
    >
      <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />
    </div>
  );
}

export default function DataDashboard() {
  return (
    <ScientificErrorBoundary label="DataDashboard">
      <DataDashboardInner />
    </ScientificErrorBoundary>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────

function getYRange(simData, comparisonData) {
  let allVals = [];
  if (simData?.S1) allVals = allVals.concat(simData.S1);
  if (comparisonData?.cn?.S1) allVals = allVals.concat(comparisonData.cn.S1);
  if (allVals.length === 0) return { min: -1, max: 1 };
  const min = Math.min(...allVals);
  const max = Math.max(...allVals);
  const pad = (max - min) * 0.15 || 0.5;
  return { min: min - pad, max: max + pad };
}

function drawLegend(ctx, W, pad, isFft = false, hasCN = false) {
  const items = isFft
    ? [{ color: C_MASSLESS, label: '— FFT POWER' }]
    : [
        { color: C_MASSLESS, label: '— MASSLESS (C)' },
        { color: C_ZITTER, label: '— TREMBLING (ZITTER)' },
        ...(hasCN ? [{ color: '#4F46E5', label: '- - CN SOLVER', dash: true }] : []),
      ];

  ctx.font = "11px 'Geist Mono', monospace";
  ctx.textAlign = 'left';
  let x = W - pad.right - 10;

  for (let i = items.length - 1; i >= 0; i--) {
    const item = items[i];
    const textW = ctx.measureText(item.label).width;
    x -= textW + 24;
    ctx.strokeStyle = item.color;
    ctx.lineWidth = 2;
    if (item.dash) ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(x, pad.top - 16);
    ctx.lineTo(x + 16, pad.top - 16);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = item.color;
    ctx.fillText(item.label, x + 20, pad.top - 12);
  }
}

function drawFFT(ctx, fftData, pad, plotW, plotH) {
  const { freqs, power } = fftData;
  if (!freqs || freqs.length < 2) return;

  const maxP = Math.max(...power.slice(1));
  if (maxP === 0 || !Number.isFinite(maxP)) return;

  ctx.fillStyle = C_MASSLESS;
  const barW = Math.max(1, plotW / freqs.length);

  for (let i = 1; i < freqs.length; i++) {
    const x = pad.left + ((i - 1) / (freqs.length - 2)) * plotW;
    const h = (power[i] / maxP) * plotH;
    const y = pad.top + plotH - h;
    ctx.fillRect(x, y, Math.max(1, barW - 1), h);
  }

  // Dominant peak label
  const peakIdx = power.slice(1).indexOf(Math.max(...power.slice(1))) + 1;
  const peakFreq = freqs[peakIdx];
  ctx.fillStyle = '#FBBF24';
  ctx.font = "11px 'Geist Mono', monospace";
  ctx.textAlign = 'left';
  ctx.fillText(`ν_ZB ≈ ${peakFreq.toExponential(2)} Hz`, pad.left + 8, pad.top + 20);
}
