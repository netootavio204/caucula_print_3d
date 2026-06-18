import { Menu, X } from 'lucide-react'
import { useState } from 'react'
import { Link, Outlet } from 'react-router-dom'
import { Brand } from './Brand'
import { Button } from '../ui/Button'

export function PublicLayout() {
  const [open, setOpen] = useState(false)
  return <div className="min-h-screen bg-dark text-white">
    <header className="fixed inset-x-0 top-0 z-40 border-b border-white/10 bg-dark/90 backdrop-blur-xl"><div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8"><Brand light /><nav className="hidden items-center gap-3 md:flex"><Link className="px-3 py-2 text-sm text-slate-300 transition hover:text-white" to="/login">Entrar</Link><Link to="/cadastro"><Button>Começar grátis</Button></Link></nav><button className="grid size-11 place-items-center rounded-xl border border-white/10 md:hidden" onClick={() => setOpen((value) => !value)} aria-label="Abrir menu">{open ? <X /> : <Menu />}</button></div>
    {open && <nav className="border-t border-white/10 p-4 md:hidden"><Link onClick={() => setOpen(false)} className="block rounded-xl px-4 py-3 text-slate-200 hover:bg-white/5" to="/login">Entrar</Link><Link onClick={() => setOpen(false)} className="mt-2 block rounded-xl bg-primary px-4 py-3 text-center font-semibold" to="/cadastro">Começar grátis</Link></nav>}</header>
    <main><Outlet /></main>
  </div>
}
