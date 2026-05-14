/**
 * translations.js — Strings ES/EN para toda la UI.
 * Uso: import { t } from '../lib/translations'; luego t[lang].key
 */

export const t = {
  es: {
    title: 'ZITTERBEWEGUNG_ENGINE',
    version: 'v6.0',
    author: 'Juan Gallardo · IUB 2026',
    skipNav: 'Saltar al contenido principal',

    theme: {
      toggleLight: '☀ DÍA',
      toggleDark: '☾ NOCHE',
    },

    lang: {
      switch: 'EN',
    },

    tabs: {
      dashboard: 'DASHBOARD',
      particle: 'PARTÍCULA',
      dirac: 'MAR DE DIRAC',
      '3d': 'VISTA 3D',
    },

    controls: {
      connected: 'BACKEND CONECTADO',
      disconnected: 'BACKEND DESCONECTADO',
      simControls: 'CONTROLES DE SIMULACIÓN',
      scienceLevel: 'NIVEL CIENTÍFICO',
      coupling: 'FUERZA DE ACOPLAMIENTO (Ω)',
      solver: 'SOLVER',
      tMax: 'T_MAX (μs)',
      nSteps: 'N_PASOS',
      photonEnergy: 'ENERGÍA FOTÓN (hν)',
      shootPhoton: '[FOTÓN] DISPARAR FOTÓN',
      showInterference: 'MOSTRAR INTERFERENCIA',
      fftMode: 'MODO FFT (análisis ν_ZB)',
      presets: 'PRESETS EDUCATIVOS',
      compareSolvers: '[=] COMPARAR SOLVERS (RK45 vs CN)',
      validate: 'VALIDAR',
      benchmark: 'BENCHMARK',
      csv: 'CSV',
      json: 'JSON',
      photonReadout: 'LECTURA DE FOTÓN',
      faderOmega: 'Fader vertical — fuerza de acoplamiento Ω (frecuencia)',
    },

    levels: {
      Beginner: 'Principiante',
      Academic: 'Académico',
      Advanced: 'Avanzado',
    },

    solvers: {
      RK45: 'RK45 (adaptativo)',
      'Crank-Nicolson': 'Crank-Nicolson (unitario)',
      'Split-Step': 'Split-Step Fourier',
    },

    dirac: {
      theoryTitle: 'Teoría de Huecos',
      theoryBody:
        'Imagina que el vacío no está vacío, sino que es un denso mar de electrones que ocupan todos los estados de energía negativa.',
      theoryQuote:
        '"Un hueco en este mar se comporta exactamente como una partícula con carga positiva y energía positiva." — P.A.M. Dirac',
      steps: [
        'Un fotón golpea un electrón de energía negativa.',
        'El electrón salta a un estado positivo.',
        'La vacante dejada se comporta como un positrón.',
      ],
      disclaimer:
        'Nota: El Mar de Dirac es una interpretación histórica, no la descripción del vacío en la QFT moderna.',
    },

    bottomBar: {
      simulate: 'SIMULAR',
      play: 'REPRODUCIR',
      pause: 'PAUSAR',
      reset: 'REINICIAR',
      notebook: 'CUADERNO',
    },

    notebook: {
      close: 'Cerrar',
      title: 'CUADERNO DE LABORATORIO',
      subtitle: 'Zitterbewegung Engine v6.0 — Registro de observaciones',
      studentName: 'Nombre del alumno',
      studentNamePlaceholder: 'Escribe tu nombre aquí…',
      date: 'Fecha',
      downloadPdf: 'Descargar PDF',
      missionLabel: 'Misión',
      context: 'Contexto',
      question: 'Pregunta',
      answerPlaceholder: 'Escribe tu respuesta aquí…',
      levelLabel: 'Nivel',
      missions: [
        {
          title: 'Misión 1 — Partícula sin masa',
          level: 'Principiante',
          context: 'Sin masa, la partícula viaja en línea recta a la velocidad c simulada. No hay Zitterbewegung.',
          question: '¿Qué observas en la gráfica ⟨S₁(t)⟩ cuando Ω está al mínimo (10⁴ Hz)? ¿La curva es plana o tiene oscilaciones? ¿Por qué?',
        },
        {
          title: 'Misión 2 — Añadiendo masa',
          level: 'Principiante',
          context: 'Al añadir masa (subir Ω), aparece el Zitterbewegung. Cuanto mayor la masa, más rápidas y visibles las oscilaciones.',
          question: '¿Cómo cambia la amplitud y la frecuencia de las oscilaciones al aumentar Ω gradualmente? ¿Qué representa físicamente esa oscilación?',
        },
        {
          title: 'Misión 3 — El Mar de Dirac',
          level: 'Académico',
          context: 'Bajo 2mc² el fotón no puede crear pares; su energía es insuficiente para sacar un electrón del mar de Dirac.',
          question: '¿Qué sucede en la visualización cuando hν ≥ 2mc²? Describe el par electrón-positrón creado y explica qué es el "hueco" en el Mar de Dirac.',
        },
        {
          title: 'Misión 4 — Análisis FFT',
          level: 'Académico',
          context: 'El pico espectral en el análisis FFT de ⟨S₁(t)⟩ corresponde a la frecuencia de Zitterbewegung ν_ZB = 2mc²/h.',
          question: '¿En qué valor de frecuencia aparece el pico dominante? ¿Qué relación tiene con el parámetro Ω configurado? ¿Cómo usarías esto para "medir" la masa de una partícula?',
        },
        {
          title: 'Misión 5 — Comparación de solvers',
          level: 'Avanzado',
          context: 'RK45 es un método de Runge-Kutta adaptativo; Crank-Nicolson es un método implícito unitario. Ambos deben converger al mismo resultado físico.',
          question: '¿Coinciden las curvas de RK45 y Crank-Nicolson? ¿Cuál es la diferencia máxima observada? ¿Qué implica esa diferencia sobre la precisión numérica de cada método?',
        },
      ],
    },
  },

  en: {
    title: 'ZITTERBEWEGUNG_ENGINE',
    version: 'v6.0',
    author: 'Juan Gallardo · IUB 2026',
    skipNav: 'Skip to main content',

    theme: {
      toggleLight: '☀ DAY',
      toggleDark: '☾ NIGHT',
    },

    lang: {
      switch: 'ES',
    },

    tabs: {
      dashboard: 'DASHBOARD',
      particle: 'PARTICLE VIEW',
      dirac: 'DIRAC SEA',
      '3d': '3D VIEW',
    },

    controls: {
      connected: 'BACKEND CONNECTED',
      disconnected: 'BACKEND OFFLINE',
      simControls: 'SIMULATION CONTROLS',
      scienceLevel: 'SCIENCE LEVEL',
      coupling: 'COUPLING FORCES (Ω)',
      solver: 'SOLVER',
      tMax: 'T_MAX (μs)',
      nSteps: 'N_STEPS',
      photonEnergy: 'PHOTON ENERGY (hν)',
      shootPhoton: '[PHOTON] SHOOT PHOTON',
      showInterference: 'SHOW INTERFERENCE',
      fftMode: 'FFT MODE (ν_ZB analysis)',
      presets: 'EDUCATIONAL PRESETS',
      compareSolvers: '[=] COMPARE SOLVERS (RK45 vs CN)',
      validate: 'VALIDATE',
      benchmark: 'BENCHMARK',
      csv: 'CSV',
      json: 'JSON',
      photonReadout: 'PHOTON READOUT',
      faderOmega: 'Vertical fader — coupling Ω (frequency)',
    },

    levels: {
      Beginner: 'Beginner',
      Academic: 'Academic',
      Advanced: 'Advanced',
    },

    solvers: {
      RK45: 'RK45 (adaptive)',
      'Crank-Nicolson': 'Crank-Nicolson (unitary)',
      'Split-Step': 'Split-Step Fourier',
    },

    dirac: {
      theoryTitle: 'Hole Theory',
      theoryBody:
        'Imagine the vacuum is not empty, but a dense sea of electrons occupying all possible negative energy states.',
      theoryQuote:
        '"A hole in this sea behaves exactly like a particle with positive charge and positive energy." — P.A.M. Dirac',
      steps: [
        'A photon strikes a negative-energy electron.',
        'The electron jumps to a positive state.',
        'The vacancy left behind behaves as a positron.',
      ],
      disclaimer:
        'Note: The Dirac Sea is a historical interpretation, not the modern QFT description of the vacuum.',
    },

    bottomBar: {
      simulate: 'SIMULATE',
      play: 'PLAY',
      pause: 'PAUSE',
      reset: 'RESET',
      notebook: 'NOTEBOOK',
    },

    notebook: {
      close: 'Close',
      title: 'LAB NOTEBOOK',
      subtitle: 'Zitterbewegung Engine v6.0 — Observation Log',
      studentName: 'Student name',
      studentNamePlaceholder: 'Type your name here…',
      date: 'Date',
      downloadPdf: 'Download PDF',
      missionLabel: 'Mission',
      context: 'Context',
      question: 'Question',
      answerPlaceholder: 'Write your answer here…',
      levelLabel: 'Level',
      missions: [
        {
          title: 'Mission 1 — Massless Particle',
          level: 'Beginner',
          context: 'Without mass, the particle travels in a straight line at the simulated speed c. No Zitterbewegung occurs.',
          question: 'What do you observe in the ⟨S₁(t)⟩ graph when Ω is at its minimum (10⁴ Hz)? Is the curve flat or oscillating? Why?',
        },
        {
          title: 'Mission 2 — Adding Mass',
          level: 'Beginner',
          context: 'Adding mass (increasing Ω) causes Zitterbewegung to appear. The higher the mass, the faster and more visible the oscillations.',
          question: 'How do the amplitude and frequency of oscillations change as you gradually increase Ω? What does this oscillation represent physically?',
        },
        {
          title: 'Mission 3 — The Dirac Sea',
          level: 'Academic',
          context: 'Below 2mc² the photon cannot create pairs; its energy is insufficient to pull an electron out of the Dirac sea.',
          question: 'What happens in the visualization when hν ≥ 2mc²? Describe the electron-positron pair created and explain what the "hole" in the Dirac Sea is.',
        },
        {
          title: 'Mission 4 — FFT Analysis',
          level: 'Academic',
          context: 'The spectral peak in the FFT analysis of ⟨S₁(t)⟩ corresponds to the Zitterbewegung frequency ν_ZB = 2mc²/h.',
          question: 'At what frequency does the dominant peak appear? How does it relate to the configured Ω parameter? How could you use this to "measure" a particle\'s mass?',
        },
        {
          title: 'Mission 5 — Solver Comparison',
          level: 'Advanced',
          context: 'RK45 is an adaptive Runge-Kutta method; Crank-Nicolson is a unitary implicit method. Both should converge to the same physical result.',
          question: 'Do the RK45 and Crank-Nicolson curves match? What is the maximum observed difference? What does that difference imply about each method\'s numerical precision?',
        },
      ],
    },
  },
};
