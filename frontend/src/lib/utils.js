/**
 * Utilidades compartidas para el frontend.
 */

/**
 * Convierte un color hex (#RRGGBB) a string rgb(r, g, b).
 */
export function hexToRgb(hex) {
  if (!hex || typeof hex !== 'string' || !hex.startsWith('#')) {
    return '0, 0, 0';
  }
  const normalized = hex.length === 4 ? `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}` : hex;
  if (normalized.length !== 7) return '0, 0, 0';
  const r = parseInt(normalized.slice(1, 3), 16);
  const g = parseInt(normalized.slice(3, 5), 16);
  const b = parseInt(normalized.slice(5, 7), 16);
  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) return '0, 0, 0';
  return `${r}, ${g}, ${b}`;
}

/**
 * Formatea un número en notación científica con precisión dada.
 */
export function fmtSci(value, precision = 2) {
  if (value === 0) return '0';
  if (Math.abs(value) < 1e-3 || Math.abs(value) > 1e6) {
    return value.toExponential(precision);
  }
  return value.toFixed(precision);
}

/**
 * Formatea un valor con su unidad.
 */
export function fmtValue(value, unit = '', precision = 2) {
  return `${fmtSci(value, precision)} ${unit}`;
}

/**
 * Clamps a value between min and max.
 */
export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/**
 * Debounce helper.
 */
export function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}
