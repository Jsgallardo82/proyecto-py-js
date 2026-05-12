'use client';

/**
 * AtomicConfig — Diagrama de niveles atómicos del sistema EQC.
 *
 * Muestra los 3 niveles |1⟩, |e⟩, |g⟩ con flechas Ω (roja) y λ (azul).
 * Engine Spec v6.0 §13 (Vista 1 — panel inferior izquierdo).
 */

import { useEffect, useRef } from 'react';
import { useAppContext } from '../context/AppContext';

function getThemeColors(isDark) {
  return isDark
    ? { bg: '#0F1419', level: '#E8E9F3', label: '#E8E9F3', caption: '#9CA3AF' }
    : { bg: '#FFFFFF',  level: '#1A202C', label: '#1A202C', caption: '#718096' };
}

export default function AtomicConfig() {
  const canvasRef           = useRef(null);
  const { state: appState } = useAppContext();

  function redraw() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const C = getThemeColors(appState.theme === 'dark');
    drawAtomicDiagram(ctx, canvas.width, canvas.height, C);
  }

  // Redibujar cuando cambia el tema
  useEffect(() => { redraw(); }, [appState.theme]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    function resize() {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.parentElement.getBoundingClientRect();
      canvas.width  = rect.width  || 200;
      canvas.height = rect.height || 160;
      redraw();
    }
    resize();
    const ro = new ResizeObserver(resize);
    if (canvasRef.current?.parentElement) ro.observe(canvasRef.current.parentElement);
    return () => ro.disconnect();
  }, [appState.theme]); // eslint-disable-line react-hooks/exhaustive-deps

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

function drawAtomicDiagram(ctx, W, H, C) {
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, W, H);

  const cx = W / 2;
  const levelW = Math.min(W * 0.4, 100);
  const levelH = 2;

  const levels = [
    { y: H * 0.18, label: '|1⟩', x: cx },
    { y: H * 0.50, label: '|e⟩', x: cx },
    { y: H * 0.82, label: '|g⟩', x: cx },
  ];

  ctx.strokeStyle = C.level;
  ctx.lineWidth   = levelH;

  for (const lv of levels) {
    ctx.beginPath();
    ctx.moveTo(lv.x - levelW / 2, lv.y);
    ctx.lineTo(lv.x + levelW / 2, lv.y);
    ctx.stroke();

    ctx.fillStyle  = C.label;
    ctx.font       = "bold 12px 'Geist Mono', monospace";
    ctx.textAlign  = 'right';
    ctx.fillText(lv.label, lv.x - levelW / 2 - 6, lv.y + 4);
  }

  const arrowX = cx + levelW * 0.15;

  // Arrow Ω: |g⟩ → |e⟩ (roja)
  drawArrow(ctx, arrowX, levels[2].y, arrowX, levels[1].y + 6, '#EF4444');
  ctx.fillStyle  = '#EF4444';
  ctx.font       = 'bold 11px Geist, system-ui';
  ctx.textAlign  = 'left';
  ctx.fillText('Ω', arrowX + 6, (levels[2].y + levels[1].y) / 2 + 4);

  // Arrow λ: |e⟩ → |g⟩ (cyan)
  const arrowX2 = cx + levelW * 0.35;
  drawArrow(ctx, arrowX2, levels[1].y, arrowX2, levels[2].y - 6, '#06B6D4');
  ctx.fillStyle = '#06B6D4';
  ctx.fillText('λ', arrowX2 + 6, (levels[1].y + levels[2].y) / 2 + 4);

  // Hamiltonian caption
  ctx.fillStyle  = C.caption;
  ctx.font       = "10px 'Geist Mono', monospace";
  ctx.textAlign  = 'center';
  ctx.fillText('H = Δₐ·z + Ω·x', cx, H - 6);
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
