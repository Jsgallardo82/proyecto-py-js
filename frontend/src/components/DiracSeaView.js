'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useSimulationContext } from '../context/SimulationContext';
import { useAppContext } from '../context/AppContext';

const C_POS_ZONE         = 'rgba(79, 70, 229, 0.12)';
const C_POS_BORDER       = '#4F46E5';
const C_NEG_ZONE         = 'rgba(236, 72, 153, 0.12)';
const C_NEG_BORDER       = '#EC4899';
const C_FORBIDDEN        = 'rgba(249, 115, 22, 0.20)';
const C_FORBIDDEN_BORDER = '#F97316';
const C_PHOTON           = '#FBBF24';
const C_ELECTRON         = '#4F46E5';
const C_POSITRON         = '#FB923C';
const C_CURVE_POS        = '#4F46E5';
const C_CURVE_NEG        = '#EC4899';
const C_GAP_LABEL        = '#F97316';

function getThemeColors(isDark) {
  return isDark
    ? { bg: '#0A0E27', text: '#E8E9F3', muted: '#9CA3AF', grid: 'rgba(255,255,255,0.06)' }
    : { bg: '#F0F4F8', text: '#1A202C', muted: '#4A5568', grid: 'rgba(0,0,0,0.06)' };
}

const PI = Math.PI;
const TWO_PI = 2 * PI;

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
    const { diracData, photonFired, pairCreated, showInterference, photonEnergyFactor, omega } = state;

    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, W, H);

    if (!diracData) {
      ctx.fillStyle = C.muted;
      ctx.font = "13px 'Geist Mono', monospace";
      ctx.textAlign = 'center';
      ctx.fillText('SIMULATE DIRAC SEA TO VIEW SPECTRUM', W / 2, H / 2);
      return;
    }

    drawDiracSeaSpectrum(ctx, W, H, diracData, omega, photonEnergyFactor, photonFired, pairCreated, showInterference, frame, C);
  }, []);

  useEffect(() => {
    function loop() {
      try { draw(); } catch (e) { console.error('[DiracSeaView] draw error:', e); }
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
      canvas.width = Math.round(rect.width) || 600;
      canvas.height = Math.round(rect.height) || 400;
    }
    resize();
    const ro = new ResizeObserver(resize);
    if (canvasRef.current?.parentElement) ro.observe(canvasRef.current.parentElement);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      role="img"
      aria-label="Espectro del Mar de Dirac: E(k) vs k, gap 2mc², densidad de estados"
      className="canvas-container"
      style={{ width: '100%', height: '100%' }}
    >
      <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />
    </div>
  );
}

// ─── Physics-based Dirac sea spectrum renderer ────────────────────────

const PAD = { top: 50, bottom: 45, left: 75, right: 35 };
const SEA_INTERP = 120;       // k-points for smooth sea rendering
const DOT_SAMPLES = 8;        // energy samples per k-column
const ELECTRON_R = 3.5;

function linInterp(xs, ys, n) {
  const out = [];
  const last = xs.length - 1;
  for (let i = 0; i < n; i++) {
    const t = (i / (n - 1)) * last;
    const idx = Math.floor(t);
    const f = t - idx;
    const j = Math.min(idx + 1, last);
    out.push(ys[idx] + (ys[j] - ys[idx]) * f);
  }
  return out;
}

function drawDiracSeaSpectrum(ctx, W, H, d, omega, photonEnergyFactor, photonFired, pairCreated, showInterference, frame, C) {
  const { mc2, zeta_prime, k_values, positive_branch, negative_branch, dos } = d;
  if (!k_values || k_values.length < 2) return;

  const k_max = k_values[k_values.length - 1];
  const e_max = positive_branch[positive_branch.length - 1] * 1.12;
  const e_min = -e_max;

  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;

  const kToX = (k) => PAD.left + (k / k_max) * plotW;
  const eToY = (e) => PAD.top + (1 - (e - e_min) / (e_max - e_min)) * plotH;

  // ── 1. Coordinate grid ───────────────────────────────────────────
  ctx.strokeStyle = C.grid;
  ctx.lineWidth = 0.5;
  for (let i = 0; i <= 6; i++) {
    const x = PAD.left + (i / 6) * plotW;
    ctx.beginPath(); ctx.moveTo(x, PAD.top); ctx.lineTo(x, PAD.top + plotH); ctx.stroke();
  }
  for (let i = 0; i <= 8; i++) {
    const y = PAD.top + (i / 8) * plotH;
    ctx.beginPath(); ctx.moveTo(PAD.left, y); ctx.lineTo(PAD.left + plotW, y); ctx.stroke();
  }

  // ── 2. Forbidden zone shading (gap = 2·mc²) ─────────────────────
  const y_mc2_pos = eToY(mc2);
  const y_mc2_neg = eToY(-mc2);
  ctx.fillStyle = C_FORBIDDEN;
  ctx.fillRect(PAD.left, y_mc2_pos, plotW, y_mc2_neg - y_mc2_pos);

  // Gap border lines (E = ±mc²)
  ctx.setLineDash([6, 4]);
  ctx.lineWidth = 1;
  ctx.strokeStyle = C_POS_BORDER;
  ctx.beginPath(); ctx.moveTo(PAD.left, y_mc2_pos); ctx.lineTo(PAD.left + plotW, y_mc2_pos); ctx.stroke();
  ctx.strokeStyle = C_NEG_BORDER;
  ctx.beginPath(); ctx.moveTo(PAD.left, y_mc2_neg); ctx.lineTo(PAD.left + plotW, y_mc2_neg); ctx.stroke();
  ctx.setLineDash([]);

  // Gap label
  ctx.fillStyle = C_GAP_LABEL;
  ctx.font = "bold 11px 'Geist Mono', monospace";
  ctx.textAlign = 'center';
  const gapLabel = `FORBIDDEN GAP = 2·mc² = ${(2 * mc2).toExponential(3)} Hz`;
  ctx.fillText(gapLabel, PAD.left + plotW / 2, (y_mc2_pos + y_mc2_neg) / 2 + 4);

  // ── 5. Dirac sea filled states ─────────────────────────────────────
  // The Dirac sea is the continuum E < E_band(k) along the negative branch
  // Interpolate to smooth grid for rendering
  const k_interp = linInterp(k_values, k_values, SEA_INTERP);
  const neg_interp = linInterp(k_values, negative_branch, SEA_INTERP);
  const pos_interp = linInterp(k_values, positive_branch, SEA_INTERP);

  // Inverse of eToY: energy from pixel y
  const yToE = (y) => e_max - (e_max - e_min) * (y - PAD.top) / plotH;

  // 5a. DoS-weighted continuum density (∀ E < E_band(k))
  //   Physical DoS in 1D: g(E) = |E| / √(E² − mc²²)
  //   Each pixel represents a cell in (k, E) phase space;
  //   opacity reflects the number of states = g(E) dE dk
  const dosNorm = 14;
  const colW = plotW / SEA_INTERP;
  const pxStride = 3;
  for (let i = 0; i < SEA_INTERP; i++) {
    const E_band_k = neg_interp[i];
    const x0 = kToX(k_interp[i]) - colW / 2;
    const y_start = eToY(E_band_k);
    const y_end = PAD.top + plotH;
    for (let y = y_start + pxStride / 2; y < y_end; y += pxStride) {
      const E_at_y = yToE(y);
      if (E_at_y >= E_band_k) continue;
      const absE = Math.abs(E_at_y);
      const dosVal = absE / Math.sqrt(Math.max(absE * absE - mc2 * mc2, 0.5));
      const alpha = Math.min(dosVal / dosNorm, 0.45);
      ctx.fillStyle = `rgba(236, 72, 153, ${alpha})`;
      ctx.fillRect(x0, y, colW, pxStride);
    }
  }

  // 5b. Electron dots — animated ZB contribution per k-state
  //   ω_ZB(k)  = 2·E(k)/ℏ           (correct)
  //   A_ZB(k)  = mc² / E(k)²         (∝ |⟨ψ₋|x|ψ₊⟩|, amplitude of ZB for
  //                                    an equal superposition at momentum k)
  //   Deep-sea states (E » mc²) oscillate rapidly with tiny amplitude;
  //   near-gap states (E ≈ mc²) oscillate slowly with largest amplitude.
  for (let i = 0; i < SEA_INTERP; i++) {
    const k = k_interp[i];
    const E_band = neg_interp[i];
    const x = kToX(k);
    const ek = pos_interp[i];

    const omega_k = 2 * ek;                    // ω_ZB(k) [Hz in code units]
    const zbAmplitude = mc2 / (ek * ek);       // A_ZB(k) — physical scaling

    for (let j = 0; j < DOT_SAMPLES; j++) {
      const frac = (j + 0.5) / DOT_SAMPLES;
      const E = E_band + (e_min - E_band) * frac;
      const y = eToY(E);

      const absE = Math.abs(E);
      const dos_e = Math.min(absE / Math.sqrt(Math.max(absE * absE - mc2 * mc2, 1)), 10);
      const densityWeight = dos_e / 10;

      // Physical ZB oscillation
      const phase = (i / SEA_INTERP) * PI + (j / DOT_SAMPLES) * 1.1;
      const pulse = 1 + zbAmplitude * 2.5 * Math.sin(frame * 0.05 * omega_k + phase);

      const alpha = densityWeight * 0.65 * pulse;
      if (alpha < 0.03) continue;

      const radius = ELECTRON_R * (0.6 + 0.4 * densityWeight);

      ctx.fillStyle = `rgba(236, 72, 153, ${Math.min(alpha, 0.85)})`;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, TWO_PI);
      ctx.fill();
    }
  }

  // ── 4. Dispersion curves E(k) = ±√((ζ′·k)² + mc²²) ────────────────
  function drawBranch(branch, color) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    branch.forEach((e, i) => {
      const x = kToX(k_values[i]);
      const y = eToY(e);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.stroke();
  }
  drawBranch(positive_branch, C_CURVE_POS);
  drawBranch(negative_branch, C_CURVE_NEG);

  // ── 6. Pair creation overlay ─────────────────────────────────────
  if (pairCreated) {
    // Find the k-index closest to the gap for the transition
    const pair_k_idx = 0; // electron at k≈0 (near gap edge)
    const x_pair = kToX(k_values[pair_k_idx]);
    const y_neg = eToY(negative_branch[pair_k_idx]);
    const y_pos = eToY(positive_branch[pair_k_idx]);

    // Dashed arrow: negative → positive (electron excitation)
    ctx.strokeStyle = C_PHOTON;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(x_pair, y_neg);
    ctx.lineTo(x_pair, y_pos);
    ctx.stroke();
    ctx.setLineDash([]);

    // Arrowhead at positive end
    ctx.fillStyle = C_PHOTON;
    ctx.beginPath();
    ctx.moveTo(x_pair, y_pos - 6);
    ctx.lineTo(x_pair - 5, y_pos - 14);
    ctx.lineTo(x_pair + 5, y_pos - 14);
    ctx.closePath();
    ctx.fill();

    // Electron circle at positive state
    ctx.fillStyle = C_ELECTRON;
    ctx.beginPath();
    ctx.arc(x_pair, y_pos, 7, 0, TWO_PI);
    ctx.fill();
    ctx.fillStyle = '#FFF';
    ctx.font = 'bold 8px Geist, system-ui';
    ctx.textAlign = 'center';
    ctx.fillText('e⁻', x_pair, y_pos + 3);

    // Positron hole at negative state (dashed ring)
    const holePulse = 0.7 + 0.3 * Math.sin(frame * 0.1);
    ctx.strokeStyle = `rgba(251, 146, 60, ${holePulse})`;
    ctx.lineWidth = 2;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.arc(x_pair, y_neg, 7, 0, TWO_PI);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = C_POSITRON;
    ctx.font = 'bold 8px Geist, system-ui';
    ctx.textAlign = 'center';
    ctx.fillText('e⁺', x_pair, y_neg + 3);

    // Energy conservation label
    ctx.fillStyle = C_PHOTON;
    ctx.font = "9px 'Geist Mono', monospace";
    ctx.textAlign = 'left';
    const eNeg = negative_branch[pair_k_idx];
    const ePos = positive_branch[pair_k_idx];
    ctx.fillText(`E_γ = ${(ePos - eNeg).toFixed(0)} Hz = ${photonEnergyFactor.toFixed(2)}·mc²`, x_pair + 10, (y_neg + y_pos) / 2 + 3);
  }

  // ── 7. Interference overlay ──────────────────────────────────────
  if (showInterference) {
    const gapY = y_mc2_pos;
    const gapH_local = y_mc2_neg - y_mc2_pos;
    ctx.globalAlpha = 0.4;
    for (let px = PAD.left; px < PAD.left + plotW; px += 2) {
      const k_ratio = (px - PAD.left) / plotW;
      const y1 = gapY + Math.sin(k_ratio * 6 * PI + frame * 0.04) * gapH_local * 0.4 + gapH_local / 2;
      const y2 = gapY + Math.cos(k_ratio * 6 * PI + frame * 0.04) * gapH_local * 0.4 + gapH_local / 2;
      ctx.fillStyle = C_POS_BORDER;
      ctx.fillRect(px, y1, 2, 2);
      ctx.fillStyle = C_NEG_BORDER;
      ctx.fillRect(px, y2, 2, 2);
    }
    ctx.globalAlpha = 1;
  }

  // ── 8. Axis labels ───────────────────────────────────────────────
  ctx.fillStyle = C.text;
  ctx.font = "bold 10px 'Geist Mono', monospace";
  ctx.textAlign = 'center';

  // X-axis: momentum k
  for (let i = 0; i <= 6; i++) {
    const k_val = (i / 6) * k_max;
    const x = kToX(k_val);
    ctx.fillText(k_val.toFixed(1), x, PAD.top + plotH + 16);
  }
  ctx.fillStyle = C.muted;
  ctx.font = "9px 'Geist Mono', monospace";
  ctx.fillText('k (effective momentum) →', PAD.left + plotW / 2, H - 6);

  // Y-axis: energy E(k)
  ctx.textAlign = 'right';
  ctx.fillStyle = C.text;
  ctx.font = "10px 'Geist Mono', monospace";
  const yLabels = [-1, -0.5, 0, 0.5, 1];
  for (const frac of yLabels) {
    const e_val = frac * e_max;
    const y = eToY(e_val);
    ctx.fillText(e_val.toExponential(3), PAD.left - 8, y + 4);
  }
  ctx.fillStyle = C.muted;
  ctx.font = "9px 'Geist Mono', monospace";
  ctx.textAlign = 'center';
  ctx.save();
  ctx.translate(14, PAD.top + plotH / 2);
  ctx.rotate(-PI / 2);
  ctx.fillText('E(k) [Hz]', 0, 0);
  ctx.restore();

  // ── 9. Physics parameters legend ─────────────────────────────────
  const zbFreq = 2 * mc2;
  const fontSz = 10;
  ctx.fillStyle = C.muted;
  ctx.font = `${fontSz}px 'Geist Mono', monospace`;
  ctx.textAlign = 'left';

  const lines = [
    [`mc²/ℏ = ${mc2.toExponential(3)} Hz`, C_NEG_BORDER],
    [`ζ′ = ${zeta_prime.toExponential(3)} Hz`, C_CURVE_POS],
    [`ω_ZB = 2·mc² = ${zbFreq.toExponential(3)} Hz`, C_GAP_LABEL],
    [`Ω = ${omega.toExponential(3)} Hz`, C.text],
  ];
  lines.forEach(([txt, color], i) => {
    ctx.fillStyle = color;
    ctx.fillText(txt, PAD.left + 8, PAD.top + 16 + i * 14);
  });

  // ── 10. Bottom status line ───────────────────────────────────────
  ctx.fillStyle = C.muted;
  ctx.font = "10px 'Geist Mono', monospace";
  ctx.textAlign = 'right';
  const gapVal = 2 * mc2;
  ctx.fillText(
    `hν = ${photonEnergyFactor.toFixed(2)}·mc²  |  threshold = ${gapVal.toExponential(3)} Hz  |  pair creation: ${photonEnergyFactor >= 2.0 ? 'ENABLED' : 'DISABLED'}`,
    W - PAD.right, H - 10
  );

  // ── 11. Curve formula ────────────────────────────────────────────
  ctx.fillStyle = C.muted;
  ctx.font = "9px 'Geist Mono', monospace";
  ctx.textAlign = 'left';
  ctx.fillText('E(k) = ±√[(ζ′·k)² + (mc²)²]', PAD.left + 8, PAD.top + plotH - 10);
}
