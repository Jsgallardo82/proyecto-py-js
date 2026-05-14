'use client';

/**
 * NotebookView — Cuaderno de laboratorio pedagógico.
 *
 * El alumno escribe su nombre, responde las preguntas de cada misión
 * y descarga un PDF abriendo una ventana nueva con HTML estático generado
 * desde el estado de React (garantiza que el texto escrito aparezca en el PDF).
 */

import { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { t } from '../lib/translations';

const LEVEL_COLORS = {
  Principiante: '#10B981',
  Académico:    '#06B6D4',
  Avanzado:     '#8B5CF6',
  Beginner:     '#10B981',
  Academic:     '#06B6D4',
  Advanced:     '#8B5CF6',
};

function formatDate(lang) {
  return new Date().toLocaleDateString(lang === 'es' ? 'es-CO' : 'en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
}

// Escapa caracteres HTML para evitar inyección en el documento generado
function esc(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/\n/g, '<br>');
}

function buildPrintHtml(studentName, answers, nb, lang) {
  const date = formatDate(lang);
  const nameDisplay = studentName.trim() || '______________________________';

  const missionsHtml = nb.missions.map((mission, i) => {
    const levelColor = LEVEL_COLORS[mission.level] ?? '#9CA3AF';
    const answerText = answers[i]?.trim()
      ? esc(answers[i])
      : '<span style="color:#aaa;font-style:italic">—</span>';

    return `
      <div class="card">
        <div class="mission-header">
          <span class="mission-title">${esc(mission.title)}</span>
          <span class="level-badge" style="border-color:${levelColor};color:${levelColor}">
            ${esc(nb.levelLabel.toUpperCase())}: ${esc(mission.level.toUpperCase())}
          </span>
        </div>

        <div class="section-label context-label">${esc(nb.context)}</div>
        <p class="context-text">${esc(mission.context)}</p>

        <div class="section-label question-label">${esc(nb.question)}</div>
        <p class="question-text">${esc(mission.question)}</p>

        <div class="section-label answer-label">${lang === 'es' ? 'RESPUESTA' : 'ANSWER'}</div>
        <div class="answer-box">${answerText}</div>
      </div>
    `;
  }).join('');

  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8" />
  <title>${esc(nb.title)}</title>
  <style>
    @page { margin: 20mm 18mm; }

    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: Georgia, 'Times New Roman', serif;
      font-size: 11pt;
      color: #000;
      background: #fff;
      line-height: 1.5;
    }

    .header {
      border-bottom: 2pt solid #000;
      padding-bottom: 10pt;
      margin-bottom: 18pt;
    }

    .doc-title {
      font-size: 18pt;
      font-weight: 700;
      letter-spacing: 0.06em;
      font-family: 'Courier New', monospace;
      margin-bottom: 3pt;
    }

    .doc-subtitle {
      font-size: 9pt;
      color: #555;
      font-family: 'Courier New', monospace;
      letter-spacing: 0.04em;
      margin-bottom: 12pt;
    }

    .meta-row {
      display: flex;
      gap: 40pt;
      font-size: 10pt;
      flex-wrap: wrap;
    }

    .meta-label {
      font-weight: 700;
      font-family: 'Courier New', monospace;
      font-size: 9pt;
      letter-spacing: 0.06em;
      color: #333;
    }

    .meta-value {
      border-bottom: 1pt solid #000;
      min-width: 160pt;
      display: inline-block;
      padding-bottom: 1pt;
    }

    .card {
      border: 1pt solid #bbb;
      border-left: 3pt solid #555;
      border-radius: 4pt;
      padding: 10pt 12pt;
      margin-bottom: 14pt;
      page-break-inside: avoid;
    }

    .mission-header {
      display: flex;
      align-items: baseline;
      gap: 8pt;
      margin-bottom: 8pt;
      flex-wrap: wrap;
    }

    .mission-title {
      font-size: 12pt;
      font-weight: 700;
      font-family: 'Courier New', monospace;
      letter-spacing: 0.04em;
    }

    .level-badge {
      font-size: 7pt;
      font-family: 'Courier New', monospace;
      font-weight: 700;
      letter-spacing: 0.06em;
      border: 1pt solid #999;
      border-radius: 3pt;
      padding: 1pt 5pt;
    }

    .section-label {
      font-size: 8pt;
      font-weight: 700;
      font-family: 'Courier New', monospace;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      margin-top: 7pt;
      margin-bottom: 3pt;
    }

    .context-label { color: #666; }
    .question-label { color: #1a6e8e; }
    .answer-label { color: #333; }

    .context-text {
      font-size: 10pt;
      color: #555;
      font-style: italic;
      line-height: 1.5;
    }

    .question-text {
      font-size: 11pt;
      font-weight: 600;
      color: #000;
      line-height: 1.5;
    }

    .answer-box {
      font-size: 11pt;
      color: #000;
      line-height: 1.6;
      min-height: 48pt;
      border: 1pt solid #ccc;
      border-radius: 3pt;
      padding: 6pt 8pt;
      background: #fafafa;
    }

    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="doc-title">${esc(nb.title)}</div>
    <div class="doc-subtitle">${esc(nb.subtitle)}</div>
    <div class="meta-row">
      <div>
        <span class="meta-label">${esc(nb.studentName)}: </span>
        <span class="meta-value">${esc(nameDisplay)}</span>
      </div>
      <div>
        <span class="meta-label">${esc(nb.date)}: </span>
        <span>${date}</span>
      </div>
    </div>
  </div>

  ${missionsHtml}
</body>
</html>`;
}

export default function NotebookView() {
  const { state: appState } = useAppContext();
  const isDark = appState.theme === 'dark';
  const lang   = appState.lang;
  const nb     = t[lang].notebook;

  const [studentName, setStudentName] = useState('');
  const [answers, setAnswers]         = useState(() => nb.missions.map(() => ''));

  const handleAnswer = (i, val) => {
    setAnswers((prev) => {
      const next = [...prev];
      next[i] = val;
      return next;
    });
  };

  const handlePrint = () => {
    const html = buildPrintHtml(studentName, answers, nb, lang);

    const iframe = document.createElement('iframe');
    // El iframe necesita dimensiones reales para que Chrome renderice el contenido.
    // Se posiciona fuera de pantalla pero con tamaño de página A4.
    Object.assign(iframe.style, {
      position: 'fixed',
      top: '-9999px',
      left: '-9999px',
      width: '794px',   // ancho A4 a 96 dpi
      height: '1123px', // alto A4 a 96 dpi
      border: 'none',
      visibility: 'hidden',
    });

    document.body.appendChild(iframe);

    const doc = iframe.contentDocument || iframe.contentWindow.document;
    doc.open();
    doc.write(html);
    doc.close();

    iframe.contentWindow.onafterprint = () => {
      document.body.removeChild(iframe);
    };

    // Dar tiempo al navegador para renderizar el HTML antes de abrir el diálogo.
    let triggered = false;
    const doPrint = () => {
      if (triggered) return;
      triggered = true;
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    };

    iframe.onload = doPrint;
    setTimeout(doPrint, 600); // fallback por si onload ya se disparó
  };

  // ── Colors ────────────────────────────────────────────────────────────
  const bg          = isDark ? 'var(--bg-primary)'    : '#FFFFFF';
  const bgCard      = isDark ? 'var(--bg-secondary)'  : '#F8FAFC';
  const border      = isDark ? 'var(--border-subtle)' : '#E2E8F0';
  const textMain    = isDark ? 'var(--text-primary)'  : '#1A202C';
  const textMuted   = isDark ? 'var(--text-secondary)': '#718096';
  const textAccent  = '#06B6D4';
  const inputBg     = isDark ? 'rgba(255,255,255,0.04)' : '#FFFFFF';
  const inputBorder = isDark ? 'rgba(255,255,255,0.12)' : '#CBD5E0';

  const mono = "'Geist Mono', monospace";
  const sans = "'Geist Sans', system-ui, sans-serif";

  return (
    <div style={{
      width: '100%',
      height: '100%',
      overflowY: 'auto',
      background: bg,
      padding: '24px',
      boxSizing: 'border-box',
    }}>
      <div style={{
        maxWidth: '860px',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
      }}>
        {/* ── Header ───────────────────────────────────────────────── */}
        <div style={{ borderBottom: `2px solid ${border}`, paddingBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <div style={{
                fontSize: '18px', fontWeight: 900, letterSpacing: '0.1em',
                color: textMain, fontFamily: mono, marginBottom: '4px',
              }}>
                {nb.title}
              </div>
              <div style={{ fontSize: '11px', color: textMuted, fontFamily: mono, letterSpacing: '0.05em' }}>
                {nb.subtitle}
              </div>
            </div>

            <button
              onClick={handlePrint}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '8px 16px', background: textAccent, color: '#fff',
                border: 'none', borderRadius: '6px', fontFamily: mono,
                fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em',
                cursor: 'pointer', flexShrink: 0,
              }}
            >
              ↓ {nb.downloadPdf}
            </button>
          </div>

          {/* Nombre + fecha */}
          <div style={{ display: 'flex', gap: '32px', marginTop: '14px', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '11px', fontFamily: mono, color: textMuted, whiteSpace: 'nowrap' }}>
                {nb.studentName}:
              </span>
              <input
                type="text"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder={nb.studentNamePlaceholder}
                style={{
                  background: 'transparent', border: 'none',
                  borderBottom: `1px solid ${inputBorder}`, color: textMain,
                  fontFamily: sans, fontSize: '13px', padding: '2px 4px',
                  outline: 'none', width: '220px',
                }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '11px', fontFamily: mono, color: textMuted }}>{nb.date}:</span>
              <span style={{ fontSize: '12px', fontFamily: sans, color: textMain }}>{formatDate(lang)}</span>
            </div>
          </div>
        </div>

        {/* ── Misiones ─────────────────────────────────────────────── */}
        {nb.missions.map((mission, i) => {
          const levelColor = LEVEL_COLORS[mission.level] ?? '#9CA3AF';
          return (
            <div
              key={i}
              style={{
                background: bgCard,
                border: `1px solid ${border}`,
                borderLeft: `3px solid ${levelColor}`,
                borderRadius: '8px',
                padding: '16px 20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              {/* Título + badge nivel */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{
                  fontSize: '13px', fontWeight: 700, fontFamily: mono,
                  letterSpacing: '0.06em', color: textMain,
                }}>
                  {mission.title}
                </span>
                <span style={{
                  fontSize: '9px', fontFamily: mono, fontWeight: 700,
                  letterSpacing: '0.08em', color: levelColor,
                  border: `1px solid ${levelColor}`, borderRadius: '3px', padding: '1px 6px',
                }}>
                  {nb.levelLabel.toUpperCase()}: {mission.level.toUpperCase()}
                </span>
              </div>

              {/* Contexto */}
              <div>
                <div style={{
                  fontSize: '9px', fontFamily: mono, fontWeight: 700,
                  letterSpacing: '0.1em', color: textMuted, marginBottom: '4px', textTransform: 'uppercase',
                }}>
                  {nb.context}
                </div>
                <p style={{ fontSize: '12px', fontFamily: sans, color: textMuted, fontStyle: 'italic', lineHeight: 1.5, margin: 0 }}>
                  {mission.context}
                </p>
              </div>

              {/* Pregunta */}
              <div>
                <div style={{
                  fontSize: '9px', fontFamily: mono, fontWeight: 700,
                  letterSpacing: '0.1em', color: textAccent, marginBottom: '6px', textTransform: 'uppercase',
                }}>
                  {nb.question}
                </div>
                <p style={{ fontSize: '13px', fontFamily: sans, color: textMain, fontWeight: 600, lineHeight: 1.55, margin: 0 }}>
                  {mission.question}
                </p>
              </div>

              {/* Textarea */}
              <textarea
                key={`${lang}-${i}`}
                value={answers[i]}
                onChange={(e) => handleAnswer(i, e.target.value)}
                placeholder={nb.answerPlaceholder}
                rows={4}
                style={{
                  width: '100%', background: inputBg,
                  border: `1px solid ${inputBorder}`, borderRadius: '5px',
                  color: textMain, fontFamily: sans, fontSize: '13px',
                  lineHeight: 1.6, padding: '10px 12px', resize: 'vertical',
                  outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.15s',
                }}
                onFocus={(e) => (e.target.style.borderColor = textAccent)}
                onBlur={(e) => (e.target.style.borderColor = inputBorder)}
              />
            </div>
          );
        })}

        {/* ── Botón inferior ────────────────────────────────────────── */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', paddingBottom: '8px' }}>
          <button
            onClick={handlePrint}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '8px 20px', background: 'transparent', color: textAccent,
              border: `1px solid ${textAccent}`, borderRadius: '6px', fontFamily: mono,
              fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', cursor: 'pointer',
            }}
          >
            ↓ {nb.downloadPdf}
          </button>
        </div>
      </div>
    </div>
  );
}
