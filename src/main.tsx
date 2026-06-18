import { Component, StrictMode, type ErrorInfo, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ToastProvider } from './components/ui/Toast'
import { AuthProvider } from './hooks/useAuth'
import { supabaseConfigured } from './lib/supabase'
import { AppRoutes } from './routes/AppRoutes'
import './styles/globals.css'

// ── ErrorBoundary global ─────────────────────────────────────────────────────
class ErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; message: string }
> {
  constructor(props: { children: ReactNode }) {
    super(props)
    this.state = { hasError: false, message: '' }
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, message: error.message }
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info)
  }
  render() {
    if (this.state.hasError) {
      return <ConfigErrorScreen message={this.state.message} />
    }
    return this.props.children
  }
}

// ── Tela de erro de configuração ─────────────────────────────────────────────
function ConfigErrorScreen({ message }: { message?: string }) {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'system-ui, sans-serif',
      padding: '2rem',
    }}>
      <div style={{
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '1.5rem',
        padding: '3rem',
        maxWidth: '540px',
        width: '100%',
        backdropFilter: 'blur(20px)',
        color: '#f1f5f9',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚙️</div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem', color: '#f8fafc' }}>
          Configuração Necessária
        </h1>
        <p style={{ color: '#94a3b8', marginBottom: '2rem', lineHeight: 1.6 }}>
          As variáveis de ambiente do Supabase não estão configuradas.
          Configure-as no painel da Vercel para o app funcionar.
        </p>
        {message && (
          <div style={{
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: '0.75rem',
            padding: '1rem',
            marginBottom: '1.5rem',
            fontSize: '0.85rem',
            color: '#fca5a5',
            textAlign: 'left',
            wordBreak: 'break-word',
          }}>
            <strong>Erro:</strong> {message}
          </div>
        )}
        <div style={{
          background: 'rgba(99,102,241,0.1)',
          border: '1px solid rgba(99,102,241,0.3)',
          borderRadius: '0.75rem',
          padding: '1.25rem',
          textAlign: 'left',
          fontSize: '0.9rem',
          lineHeight: 1.8,
        }}>
          <strong style={{ color: '#a5b4fc' }}>Variáveis necessárias:</strong>
          <br />
          <code style={{ color: '#6ee7b7' }}>VITE_SUPABASE_URL</code>
          <br />
          <code style={{ color: '#6ee7b7' }}>VITE_SUPABASE_ANON_KEY</code>
          <br /><br />
          <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>
            Acesse: Vercel → Projeto → Settings → Environment Variables
          </span>
        </div>
      </div>
    </div>
  )
}

// ── Bootstrap ────────────────────────────────────────────────────────────────
const rootEl = document.getElementById('root')!

if (!supabaseConfigured) {
  createRoot(rootEl).render(<StrictMode><ConfigErrorScreen /></StrictMode>)
} else {
  createRoot(rootEl).render(
    <StrictMode>
      <ErrorBoundary>
        <BrowserRouter>
          <AuthProvider>
            <ToastProvider>
              <AppRoutes />
            </ToastProvider>
          </AuthProvider>
        </BrowserRouter>
      </ErrorBoundary>
    </StrictMode>,
  )
}
