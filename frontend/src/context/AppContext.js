'use client';

/**
 * AppContext — Estado global de UI: tema (dark/light) e idioma (es/en).
 * Persiste en localStorage y aplica data-theme al elemento <html>.
 */

import { createContext, useContext, useReducer, useEffect } from 'react';

const AppContext = createContext(null);

const initialState = {
  theme: 'dark',
  lang: 'es',
};

function appReducer(state, action) {
  switch (action.type) {
    case 'SET_THEME':
      return { ...state, theme: action.payload };
    case 'SET_LANG':
      return { ...state, lang: action.payload };
    case 'TOGGLE_THEME':
      return { ...state, theme: state.theme === 'dark' ? 'light' : 'dark' };
    case 'TOGGLE_LANG':
      return { ...state, lang: state.lang === 'es' ? 'en' : 'es' };
    default:
      return state;
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState, (init) => {
    if (typeof window === 'undefined') return init;
    try {
      const saved = localStorage.getItem('zb-app-prefs');
      if (saved) return { ...init, ...JSON.parse(saved) };
    } catch {
      // ignore
    }
    return init;
  });

  // Sincronizar data-theme en <html> y persistir en localStorage
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', state.theme);
    try {
      localStorage.setItem('zb-app-prefs', JSON.stringify(state));
    } catch {
      // ignore
    }
  }, [state]);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext debe usarse dentro de <AppProvider>');
  return ctx;
}
