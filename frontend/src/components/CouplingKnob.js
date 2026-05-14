'use client';

/**
 * CouplingKnob — Perilla interactiva + escena láser.
 *
 * Modos de interacción:
 *   1. Arrastre circular  — arrastra en sentido horario/antihorario
 *   2. Rueda del mouse    — scroll arriba/abajo
 *   3. Click en el arco   — salta directamente al ángulo clickeado
 *   4. Input numérico     — frecuencia en Hz
 */

import { useRef, useCallback, useState } from 'react';
import VerticalFader from './VerticalFader';

// ─── Constantes de rotación ───────────────────────────────────────────────
const START_ANGLE    = -135;   // ángulo mínimo del arco (grados, reloj)
const TOTAL_ARC      = 270;    // barrido total del arco (grados)
const PERILLA_OFFSET = -75;    // corrección de posición inicial de perilla.png


// ─── Helpers SVG arc ──────────────────────────────────────────────────────
function polarToXY(cx, cy, r, angleDeg) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function arcPath(cx, cy, r, startDeg, endDeg) {
  const s     = polarToXY(cx, cy, r, startDeg);
  const e     = polarToXY(cx, cy, r, endDeg);
  const large = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y}`;
}

// ─── Componente principal ─────────────────────────────────────────────────

export default function CouplingKnob({ value, min, max, onChange, label, isDark, faderAriaLabel }) {
  const intensity = (value - min) / (max - min);   // [0, 1]
  const isOff     = intensity < 0.01;

  // ── Estado del input numérico ─────────────────────────────────────────
  const [inputVal,     setInputVal]     = useState('');
  const [inputFocused, setInputFocused] = useState(false);

  // ── Refs ──────────────────────────────────────────────────────────────
  const knobRef = useRef(null);   // referencia al contenedor del knob
  const dragRef = useRef(null);   // estado del arrastre circular

  // ── Ángulo del puntero respecto al centro del knob ────────────────────
  const getPointerAngle = useCallback((e) => {
    const el = knobRef.current;
    if (!el) return 0;
    const rect = el.getBoundingClientRect();
    const dx   = e.clientX - (rect.left + rect.width  / 2);
    const dy   = e.clientY - (rect.top  + rect.height / 2);
    let angle  = Math.atan2(dy, dx) * (180 / Math.PI) + 90; // 0° = arriba
    if (angle > 180)  angle -= 360;
    if (angle < -180) angle += 360;
    return angle;
  }, []);

  // ── Arrastre circular ─────────────────────────────────────────────────
  const onPointerDown = useCallback((e) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = {
      startAngle: getPointerAngle(e),
      startValue: value,
      hasDragged: false,
    };
  }, [value, getPointerAngle]);

  const onPointerMove = useCallback((e) => {
    if (!dragRef.current) return;
    let delta = getPointerAngle(e) - dragRef.current.startAngle;
    if (delta >  180) delta -= 360;
    if (delta < -180) delta += 360;
    if (Math.abs(delta) > 2) dragRef.current.hasDragged = true;
    const newVal = dragRef.current.startValue + (delta / TOTAL_ARC) * (max - min);
    onChange(Math.min(max, Math.max(min, newVal)));
  }, [max, min, onChange, getPointerAngle]);

  const onPointerUp = useCallback(() => { dragRef.current = null; }, []);

  // ── Rueda del mouse ───────────────────────────────────────────────────
  const onWheel = useCallback((e) => {
    e.preventDefault();
    const step = (max - min) / 100;
    onChange(Math.min(max, Math.max(min, value - e.deltaY * step * 0.08)));
  }, [value, min, max, onChange]);

  // ── Click en el arco ──────────────────────────────────────────────────
  const onArcClick = useCallback((e) => {
    if (dragRef.current?.hasDragged) return;
    const svg  = e.currentTarget.closest('svg');
    const rect = svg.getBoundingClientRect();
    const dx   = e.clientX - (rect.left + rect.width  / 2);
    const dy   = e.clientY - (rect.top  + rect.height / 2);
    let clickAngle = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
    if (clickAngle >  180) clickAngle -= 360;
    if (clickAngle < -180) clickAngle += 360;
    // Ignorar clicks fuera del arco (zona muerta inferior)
    if (clickAngle < START_ANGLE || clickAngle > START_ANGLE + TOTAL_ARC) return;
    const newIntensity = (clickAngle - START_ANGLE) / TOTAL_ARC;
    onChange(min + newIntensity * (max - min));
  }, [min, max, onChange]);

  // ── Rotación de la perilla ────────────────────────────────────────────
  const knobRotation = START_ANGLE + intensity * TOTAL_ARC;

  // ── Dimensiones del knob ─────────────────────────────────────────────
  const KNOB_SIZE  = 140;
  const FADER_COL_W = 46; // ancho aprox. ticks + carril (VerticalFader)
  const CONTROL_STRIP_W = KNOB_SIZE + 14 + FADER_COL_W;
  const IMG_SIZE   = 110;
  const IMG_OFF    = (KNOB_SIZE - IMG_SIZE) / 2;
  const cx         = KNOB_SIZE / 2;
  const cy         = KNOB_SIZE / 2;
  const arcR       = 62;
  const trackColor = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.15)';
  const endAngle   = START_ANGLE + intensity * TOTAL_ARC;

  // ── Colores del láser ─────────────────────────────────────────────────
  const beamColor    = '#EF4444';
  const beamOpacity  = isOff ? 0 : 0.2 + intensity * 0.9;
  const beamH        = isOff ? 1 : 1 + intensity * 3;
  const beamBlur     = 1 + intensity * 3;
  const beamGlow     = isOff ? 'none' : `0 0 ${intensity * 14}px ${beamColor}, 0 0 ${intensity * 6}px ${beamColor}`;
  const laserFilter  = isOff
    ? 'brightness(0.5) saturate(0)'
    : `brightness(${0.8 + intensity * 0.6}) drop-shadow(0 0 ${intensity * 8}px ${beamColor})`;
  const particleGlow = isOff
    ? 'none'
    : `drop-shadow(0 0 ${intensity * 8}px #06B6D4) drop-shadow(0 0 ${intensity * 4}px #06B6D4)`;

  const textColor  = isDark ? '#9CA3AF' : '#4A5568';
  const valueColor = '#06B6D4';

  // ── Handlers del input ────────────────────────────────────────────────
  const handleInputFocus = () => {
    setInputFocused(true);
    setInputVal(Math.round(value).toString());
  };

  const commitInput = () => {
    setInputFocused(false);
    const n = parseFloat(inputVal);
    if (!isNaN(n)) {
      onChange(Math.min(max, Math.max(min, n)));
    }
  };

  const handleInputKeyDown = (e) => {
    if (e.key === 'Enter')  e.target.blur();
    if (e.key === 'Escape') { setInputFocused(false); }
  };

  const inputDisplay = inputFocused ? inputVal : Math.round(value).toLocaleString('en-US');

  const inputBorder = isDark
    ? `1px solid ${inputFocused ? '#06B6D4' : 'rgba(255,255,255,0.15)'}`
    : `1px solid ${inputFocused ? '#06B6D4' : 'rgba(0,0,0,0.2)'}`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', userSelect: 'none' }}>

      {/* ── Escena láser ──────────────────────────────────────────────── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        height: '56px',
        borderRadius: '8px',
        overflow: 'hidden',
        background: isDark ? '#0A0E1A' : '#CBD5E0',
        border: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.1)'}`,
        padding: '0 8px',
        gap: '0',
      }}>

        {/* Emisor láser */}
        <img
          src="/laser.png"
          alt="laser emitter"
          width={60}
          height={60}
          style={{ flexShrink: 0, objectFit: 'contain', filter: laserFilter, transition: 'filter 0.1s' }}
        />

        {/* Haz de luz */}
        <div style={{ flex: 1, position: 'relative', height: '100%', display: 'flex', alignItems: 'center' }}>
          <div style={{
            position: 'absolute', left: 0, right: 0,
            height: `${beamH}px`,
            background: isOff ? (isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.08)') : beamColor,
            opacity: beamOpacity,
            filter: isOff ? 'none' : `blur(${beamBlur}px)`,
            boxShadow: beamGlow,
            transition: 'height 0.1s, opacity 0.1s, box-shadow 0.1s',
            borderRadius: '2px',
          }} />
          {isOff && (
            <span style={{
              position: 'absolute', left: '50%', transform: 'translateX(-50%)',
              fontSize: '9px', fontWeight: 700, letterSpacing: '0.12em',
              color: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.25)',
              fontFamily: "'Geist Mono', monospace", pointerEvents: 'none',
            }}>
              OFF
            </span>
          )}
        </div>

        {/* Átomo SVG */}
        <AtomSVG intensity={intensity} particleGlow={particleGlow} isDark={isDark} />
      </div>

      {/* ── Perilla + fader + controles ───────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>

        <div style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          gap: '14px',
          justifyContent: 'center',
        }}>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
            {/* Valor numérico en Hz */}
            <span style={{
              fontSize: '11px', fontWeight: 700, color: valueColor,
              fontFamily: "'Geist Mono', monospace", letterSpacing: '0.04em',
            }}>
              {value.toExponential(2)} Hz
            </span>

            {/* Contenedor del knob */}
            <div
              ref={knobRef}
              style={{
                position: 'relative',
                width: `${KNOB_SIZE}px`,
                height: `${KNOB_SIZE}px`,
                cursor: 'grab',
                touchAction: 'none',
                overflow: 'visible',
              }}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerLeave={onPointerUp}
              onWheel={onWheel}
              role="slider"
              aria-label={`${label}: ${value.toExponential(2)} Hz`}
              aria-valuemin={min}
              aria-valuemax={max}
              aria-valuenow={value}
            >
              {/* Capa 1 — arcos SVG (con click interactivo en la pista) */}
              <svg
                width={KNOB_SIZE}
                height={KNOB_SIZE}
                viewBox={`0 0 ${KNOB_SIZE} ${KNOB_SIZE}`}
                style={{ position: 'absolute', top: 0, left: 0 }}
                aria-hidden="true"
              >
                {/* Pista completa — clickeable */}
                <path
                  d={arcPath(cx, cy, arcR, START_ANGLE, START_ANGLE + TOTAL_ARC)}
                  fill="none"
                  stroke={trackColor}
                  strokeWidth="10"
                  strokeLinecap="round"
                  style={{ cursor: 'pointer' }}
                  onClick={onArcClick}
                />
                {/* Arco de valor */}
                {intensity > 0.005 && (
                  <path
                    d={arcPath(cx, cy, arcR, START_ANGLE, endAngle)}
                    fill="none"
                    stroke="#06B6D4"
                    strokeWidth="5"
                    strokeLinecap="round"
                    style={{ cursor: 'pointer', pointerEvents: 'none' }}
                  />
                )}
              </svg>

              {/* Capa 2 — perilla rotante */}
              <img
                src="/perilla.png"
                alt="coupling knob"
                style={{
                  position: 'absolute',
                  top: `${IMG_OFF}px`,
                  left: `${IMG_OFF}px`,
                  width: `${IMG_SIZE}px`,
                  height: `${IMG_SIZE}px`,
                  objectFit: 'contain',
                  transform: `rotate(${knobRotation + PERILLA_OFFSET}deg)`,
                  transition: 'transform 0.05s linear',
                  pointerEvents: 'none',
                  filter: isDark ? 'none' : 'brightness(0.85)',
                }}
                draggable={false}
              />
            </div>
          </div>

          <VerticalFader
            value={value}
            min={min}
            max={max}
            onChange={onChange}
            isDark={isDark}
            height={168}
            ariaLabel={faderAriaLabel ?? `${label} — fader`}
          />
        </div>

        {/* Label */}
        <span style={{
          fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em',
          color: textColor, fontFamily: "'Geist Mono', monospace", textAlign: 'center',
        }}>
          {label}
        </span>

        {/* Input numérico directo en Hz */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
          <input
            type="number"
            min={min}
            max={max}
            step="100"
            value={inputDisplay}
            onFocus={handleInputFocus}
            onChange={(e) => setInputVal(e.target.value)}
            onBlur={commitInput}
            onKeyDown={handleInputKeyDown}
            style={{
              width: '80px',
              background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)',
              border: inputBorder,
              borderRadius: '4px',
              color: inputFocused ? valueColor : textColor,
              fontFamily: "'Geist Mono', monospace",
              fontSize: '11px',
              fontWeight: 700,
              textAlign: 'center',
              padding: '3px 4px',
              outline: 'none',
              transition: 'border-color 0.15s, color 0.15s',
            }}
          />
          <span style={{ fontSize: '9px', color: textColor, fontFamily: "'Geist Mono', monospace" }}>Hz</span>
        </div>

        {/* Min / Max */}
        <div style={{ display: 'flex', justifyContent: 'space-between', width: `${CONTROL_STRIP_W}px`, marginTop: '2px' }}>
          <span style={{ fontSize: '9px', color: textColor, fontFamily: "'Geist Mono', monospace" }}>10⁴ Hz</span>
          <span style={{ fontSize: '9px', color: textColor, fontFamily: "'Geist Mono', monospace" }}>10⁵ Hz</span>
        </div>
      </div>
    </div>
  );
}

// ─── Átomo SVG ────────────────────────────────────────────────────────────

function AtomSVG({ intensity, particleGlow, isDark }) {
  const isOff = intensity < 0.01;
  const orbitColor  = isOff
    ? (isDark ? 'rgba(6,182,212,0.15)' : 'rgba(6,182,212,0.3)')
    : `rgba(6,182,212,${0.3 + intensity * 0.7})`;
  const nucleusColor = isOff
    ? (isDark ? '#1B2238' : '#94A3B8')
    : `rgba(6,182,212,${0.5 + intensity * 0.5})`;

  return (
    <div style={{ flexShrink: 0, filter: particleGlow, transition: 'filter 0.1s' }}>
      <svg width="36" height="36" viewBox="0 0 36 36" aria-hidden="true">
        <ellipse cx="18" cy="18" rx="14" ry="6"
          fill="none" stroke={orbitColor} strokeWidth="1.2"
          transform="rotate(30 18 18)"
        />
        <ellipse cx="18" cy="18" rx="14" ry="6"
          fill="none" stroke={orbitColor} strokeWidth="1.2"
          transform="rotate(-30 18 18)"
        />
        <circle cx="18" cy="18" r="4" fill={nucleusColor} />
        <circle cx="18" cy="18" r="2"
          fill={isOff ? (isDark ? '#4B5563' : '#94A3B8') : '#06B6D4'}
        />
      </svg>
    </div>
  );
}
