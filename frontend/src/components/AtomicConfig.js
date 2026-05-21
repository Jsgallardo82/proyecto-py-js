'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useSimulationContext } from '../context/SimulationContext';
import { useAppContext } from '../context/AppContext';

function getThemeColors(isDark) {
  return isDark
    ? { bg: '#0F1419', level: '#E8E9F3', label: '#E8E9F3', caption: '#9CA3AF' }
    : { bg: '#FFFFFF',  level: '#1A202C', label: '#1A202C', caption: '#718096' };
}

export default function AtomicConfig() {
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

    const cx = W / 2;
    const levelW = Math.min(W * 0.4, 100);
    const levelH = 2;

    const { omega, simData } = state;
    const freq = (omega || 5e4) / 5e3;

    const levels = [
      { y: H * 0.18, label: '|1⟩', x: cx },
      { y: H * 0.50, label: '|e⟩', x: cx },
      { y: H * 0.82, label: '|g⟩', x: cx },
    ];

    // Draw level lines with subtle shimmer
    for (const lv of levels) {
      const shimmer = 0.7 + 0.3 * Math.sin(frame * 0.02 + lv.y);
      ctx.strokeStyle = C.level;
      ctx.globalAlpha = shimmer;
      ctx.lineWidth = levelH;
      ctx.beginPath();
      ctx.moveTo(lv.x - levelW / 2, lv.y);
      ctx.lineTo(lv.x + levelW / 2, lv.y);
      ctx.stroke();
      ctx.globalAlpha = 1;

      ctx.fillStyle = C.label;
      ctx.font = "bold 12px 'Geist Mono', monospace";
      ctx.textAlign = 'right';
      ctx.fillText(lv.label, lv.x - levelW / 2 - 6, lv.y + 4);
    }

    const arrowX = cx + levelW * 0.15;

    // Arrow Ω: |g⟩ → |e⟩ (roja pulsante)
    const omegaPulse = 0.6 + 0.4 * Math.sin(frame * 0.03 * freq);
    const omegaColor = `rgba(239, 68, 68, ${omegaPulse})`;
    drawArrow(ctx, arrowX, levels[2].y, arrowX, levels[1].y + 6, omegaColor);

    // Traveling dot on Ω arrow
    const dotProgress = 0.5 + 0.5 * Math.sin(frame * 0.02 * freq);
    const dotY = levels[2].y + (levels[1].y + 6 - levels[2].y) * dotProgress;
    ctx.fillStyle = '#FCA5A5';
    ctx.beginPath();
    ctx.arc(arrowX, dotY, 3, 0, Math.PI * 2);
    ctx.fill();

    // Omega label with live value
    ctx.fillStyle = '#EF4444';
    ctx.font = 'bold 10px Geist, system-ui';
    ctx.textAlign = 'left';
    ctx.fillText(`Ω = ${(omega || 5e4).toExponential(2)} Hz`, arrowX + 6, (levels[2].y + levels[1].y) / 2 + 4);

    // Arrow λ: |e⟩ → |g⟩ (cyan)
    const arrowX2 = cx + levelW * 0.35;
    drawArrow(ctx, arrowX2, levels[1].y, arrowX2, levels[2].y - 6, '#06B6D4');
    ctx.fillStyle = '#06B6D4';
    ctx.font = 'bold 10px Geist, system-ui';
    ctx.fillText('λ', arrowX2 + 6, (levels[1].y + levels[2].y) / 2 + 4);

    // ZB frequency readout
    if (simData?.frecuencia_zb) {
      ctx.fillStyle = C.caption;
      ctx.font = "9px 'Geist Mono', monospace";
      ctx.textAlign = 'center';
      ctx.fillText(`ν_ZB = ${simData.frecuencia_zb.toExponential(3)} Hz`, cx, H - 18);
    }

    // Hamiltonian caption
    ctx.fillStyle = C.caption;
    ctx.font = "10px 'Geist Mono', monospace";
    ctx.textAlign = 'center';
    ctx.fillText('H = Δₐ·z + Ω·x', cx, H - 6);
  }, []);

  // Animation loop
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
      if (!canvas) return;
      const rect = canvas.parentElement.getBoundingClientRect();
      canvas.width  = rect.width  || 200;
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
      aria-label="Diagrama de configuración atómica: niveles |1⟩, |e⟩ y |g⟩ con transiciones Ω y λ"
      className="canvas-container"
      style={{ width: '100%', height: '100%', minHeight: '120px' }}
    >
      <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />
    </div>
  );
}

function drawArrow(ctx, x1, y1, x2, y2, color) {
  const headLen = 8;
  const angle   = Math.atan2(y2 - y1, x2 - x1);

  ctx.strokeStyle = color;
  ctx.lineWidth   = 2;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - headLen * Math.cos(angle - Math.PI / 6), y2 - headLen * Math.sin(angle - Math.PI / 6));
  ctx.lineTo(x2 - headLen * Math.cos(angle + Math.PI / 6), y2 - headLen * Math.sin(angle + Math.PI / 6));
  ctx.closePath();
  ctx.fill();
}
