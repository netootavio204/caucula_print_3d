import { Link, Outlet } from 'react-router-dom'
import { Brand } from './Brand'

export function PublicLayout() {
  return <div className="min-h-screen bg-dark text-white">
    <header className="fixed inset-x-0 top-0 z-40 border-b border-white/10 bg-dark/90 backdrop-blur-xl"><div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8"><Brand light /><Link className="rounded-xl border border-white/15 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10" to="/login">Entrar</Link></div></header>
    <main><Outlet /></main>
  </div>
}
