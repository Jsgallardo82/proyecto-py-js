'use client';

/**
 * VerticalFader — fader vertical mezclador (arriba = max, abajo = min).
 */

import { useRef, useCallback } from 'react';

const THUMB_H = 22;
const TICK_WIDTH = 5;
const TICK_LONG = 8;
const GROOVE_W = 12;

function TickColumn({ height, isDark, side }) {
  const color = isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.4)';
  const positions = [0, 0.25, 0.5, 0.75, 1];
  return (
    <div
      style={{
        position: 'relative',
        width: `${TICK_LONG}px`,
        height: `${height}px`,
        flexShrink: 0,
      }}
      aria-hidden="true"
    >
      {positions.map((p, i) => {
        const len = i === 2 ? TICK_LONG : TICK_WIDTH;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              top: `${p * 100}%`,
              transform: 'translateY(-50%)',
              ...(side === 'left' ? { right: 0 } : { left: 0 }),
              width: `${len}px`,
              height: '2px',
              background: color,
              borderRadius: '1px',
            }}
          />
        );
      })}
    </div>
  );
}

export default function VerticalFader({
  value,
  min,
  max,
  onChange,
  isDark,
  height = 160,
  ariaLabel = 'Vertical frequency fader',
}) {
  const trackRef = useRef(null);
  const activeRef  = useRef(false);

  const range = max - min || 1;
  const ratio = Math.max(0, Math.min(1, (value - min) / range));
  const thumbTop = (1 - ratio) * (height - THUMB_H);

  const applyPointer = useCallback((e) => {
    const el = trackRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const usable = height - THUMB_H;
    const centerY = Math.min(height - THUMB_H / 2, Math.max(THUMB_H / 2, y));
    let r = 1 - (centerY - THUMB_H / 2) / usable;
    r = Math.max(0, Math.min(1, r));
    const span = max - min || 1;
    onChange(min + r * span);
  }, [height, min, max, onChange]);

  const onPointerDown = useCallback((e) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    activeRef.current = true;
    applyPointer(e);
  }, [applyPointer]);

  const onPointerMove = useCallback((e) => {
    if (!activeRef.current) return;
    applyPointer(e);
  }, [applyPointer]);

  const onPointerUp = useCallback((e) => {
    if (activeRef.current) {
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
    }
    activeRef.current = false;
  }, []);

  const grooveBg = isDark
    ? 'linear-gradient(90deg, #1a1f2e 0%, #0d1118 45%, #1a1f2e 100%)'
    : 'linear-gradient(90deg, #cbd5e0 0%, #e2e8f0 50%, #cbd5e0 100%)';
  const grooveBorder = isDark ? '1px solid rgba(0,0,0,0.45)' : '1px solid rgba(0,0,0,0.12)';
  const grooveShadow = isDark
    ? 'inset 1px 2px 4px rgba(0,0,0,0.6), inset -1px -2px 3px rgba(255,255,255,0.06)'
    : 'inset 1px 2px 3px rgba(0,0,0,0.12), inset -1px -1px 2px rgba(255,255,255,0.9)';

  const thumbBg = isDark
    ? 'linear-gradient(180deg, #6b7280 0%, #4b5563 40%, #374151 100%)'
    : 'linear-gradient(180deg, #f3f4f6 0%, #d1d5db 45%, #9ca3af 100%)';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'stretch',
        gap: '2px',
        userSelect: 'none',
        touchAction: 'none',
      }}
    >
      <TickColumn height={height} isDark={isDark} side="left" />

      <div
        ref={trackRef}
        role="slider"
        aria-label={ariaLabel}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        style={{
          position: 'relative',
          width: `${GROOVE_W + 8}px`,
          height: `${height}px`,
          flexShrink: 0,
          cursor: 'ns-resize',
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: '4px',
            top: 0,
            width: `${GROOVE_W}px`,
            height: '100%',
            borderRadius: '4px',
            background: grooveBg,
            border: grooveBorder,
            boxShadow: grooveShadow,
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: '1px',
            top: `${thumbTop}px`,
            width: `${GROOVE_W + 6}px`,
            height: `${THUMB_H}px`,
            borderRadius: '3px',
            background: thumbBg,
            border: isDark ? '1px solid rgba(0,0,0,0.5)' : '1px solid rgba(0,0,0,0.18)',
            boxShadow: isDark
              ? '0 2px 4px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.12)'
              : '0 2px 4px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.85)',
          }}
        />
      </div>

      <TickColumn height={height} isDark={isDark} side="right" />
    </div>
  );
}
