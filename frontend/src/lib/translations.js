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
    },
  },
};
