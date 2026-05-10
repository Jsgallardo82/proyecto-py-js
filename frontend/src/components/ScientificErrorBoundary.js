'use client';

/**
 * ScientificErrorBoundary — Error boundary para componentes científicos.
 *
 * Engine Spec v6.0 §17 (Error boundaries en todos los componentes Canvas).
 */

import { Component } from 'react';

export default class ScientificErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ScientificErrorBoundary]', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            minHeight: 200,
            background: '#0A0E27',
            color: '#EF4444',
            fontFamily: "'Geist Mono', monospace",
            fontSize: 13,
            padding: 24,
            border: '1px solid #EF4444',
            borderRadius: 8,
          }}
          role="alert"
          aria-live="assertive"
        >
          <div style={{ fontWeight: 700, marginBottom: 8 }}>Error en componente científico</div>
          <div style={{ color: '#9CA3AF', marginBottom: 16 }}>
            {this.props.label || 'Componente'}
          </div>
          <pre style={{ fontSize: 11, color: '#F97316', maxWidth: '100%', overflow: 'auto' }}>
            {this.state.error?.message}
          </pre>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{
              marginTop: 16,
              padding: '8px 16px',
              background: '#10B981',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            Reintentar
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
