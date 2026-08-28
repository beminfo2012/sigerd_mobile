import React, { Component } from 'react';

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorId: null, error: null };
  }

  static getDerivedStateFromError(error) {
    // Gera um ID único para o erro (facilita suporte sem expor detalhes internos)
    const errorId = Math.random().toString(36).substring(2, 8).toUpperCase();
    return { hasError: true, errorId, error };
  }

  componentDidCatch(error, info) {
    // Log técnico interno para debug (nunca exposto na interface visual do usuário)
    console.error('[ErrorBoundary]', error, info);
  }

  handleClearCache = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (e) {
      console.error('[ErrorBoundary] Falha ao limpar cache:', e);
    }
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={styles.container}>
          <div style={styles.icon}>⚠️</div>
          <h2 style={styles.title}>Algo deu errado</h2>
          <p style={styles.text}>
            Ocorreu um erro inesperado. Tente recarregar a página.
          </p>
          <p style={styles.code}>
            Código do erro: <strong>{this.state.errorId}</strong>
          </p>
          {this.state.error && (
            <div style={styles.debugBox}>
              <p style={styles.debugTitle}>Detalhes do Erro (Dev/Debug):</p>
              <p style={styles.debugMsg}>{this.state.error.toString()}</p>
              {this.state.error.stack && (
                <pre style={styles.debugStack}>{this.state.error.stack}</pre>
              )}
            </div>
          )}
          <p style={styles.hint}>
            Se o problema persistir, informe esse código ao suporte técnico.
          </p>
          
          <div style={styles.buttonGroup}>
            <button
              style={styles.primaryButton}
              onClick={() => window.location.reload()}
            >
              🔄 Recarregar o sistema
            </button>
            <button
              style={styles.secondaryButton}
              onClick={this.handleClearCache}
            >
              🧹 Limpar Cache e Recarregar
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    padding: '2rem',
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    textAlign: 'center',
    background: '#f8fafc',
    boxSizing: 'border-box'
  },
  icon: { fontSize: '4rem', marginBottom: '1rem' },
  title: { fontSize: '1.5rem', color: '#1e293b', marginBottom: '0.5rem', fontWeight: '700' },
  text: { color: '#64748b', marginBottom: '0.5rem', fontSize: '1rem' },
  code: {
    fontFamily: 'monospace',
    background: '#e2e8f0',
    padding: '0.35rem 0.85rem',
    borderRadius: '6px',
    color: '#334155',
    marginBottom: '0.5rem',
    fontSize: '0.95rem',
    letterSpacing: '0.05em'
  },
  hint: { color: '#94a3b8', fontSize: '0.875rem', marginBottom: '1.75rem' },
  buttonGroup: {
    display: 'flex',
    gap: '0.75rem',
    flexWrap: 'wrap',
    justifyContent: 'center'
  },
  primaryButton: {
    background: '#2a5299',
    color: 'white',
    border: 'none',
    padding: '0.75rem 1.75rem',
    borderRadius: '8px',
    fontSize: '0.95rem',
    fontWeight: '600',
    cursor: 'pointer',
    boxShadow: '0 2px 4px rgba(42, 82, 153, 0.2)'
  },
  secondaryButton: {
    background: '#ffffff',
    color: '#dc2626',
    border: '1px solid #fca5a5',
    padding: '0.75rem 1.5rem',
    borderRadius: '8px',
    fontSize: '0.95rem',
    fontWeight: '600',
    cursor: 'pointer'
  },
  debugBox: {
    margin: '1rem 0',
    padding: '1rem',
    background: '#f1f5f9',
    border: '1px solid #cbd5e1',
    borderRadius: '8px',
    textAlign: 'left',
    maxWidth: '800px',
    width: '100%',
    overflowX: 'auto'
  },
  debugTitle: { fontWeight: 'bold', color: '#b91c1c', marginBottom: '0.5rem', fontSize: '0.9rem' },
  debugMsg: { color: '#0f172a', fontWeight: '600', fontSize: '0.85rem', marginBottom: '0.5rem' },
  debugStack: { color: '#334155', fontSize: '0.75rem', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }
};

export default ErrorBoundary;
