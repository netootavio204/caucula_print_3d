import { Boxes, Calculator, CircleDollarSign, FolderKanban, HandCoins, Images, LogOut, PackageCheck, ShoppingCart, UsersRound, UserRound, X } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { cn } from '../../lib/cn'
import { Brand } from './Brand'

const items = [
  { to: '/app/orcamento', label: 'Orçamento', icon: Calculator },
  { to: '/app/calculadora-rapida', label: 'Calculadora Rápida', icon: Calculator },
  { to: '/app/orcamentos', label: 'Meus orçamentos', icon: CircleDollarSign },
  { to: '/app/projetos', label: 'Projetos', icon: FolderKanban },
  { to: '/app/estoque', label: 'Estoque', icon: PackageCheck },
  { to: '/app/catalogo', label: 'Catálogo', icon: Images },
  { to: '/app/vendas', label: 'Vendas', icon: ShoppingCart },
  { to: '/app/consignacao', label: 'Consignação', icon: HandCoins },
  { to: '/app/clientes', label: 'Meus clientes', icon: UsersRound },
  { to: '/app/insumos', label: 'Insumos / Custos', icon: Boxes },
  { to: '/app/minha-conta', label: 'Minha conta', icon: UserRound },
]

interface SidebarProps { open: boolean; onClose: () => void; onLogout: () => void }

export function Sidebar({ open, onClose, onLogout }: SidebarProps) {
  return <>
    <button aria-label="Fechar menu" onClick={onClose} className={cn('fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm transition lg:hidden', open ? 'block' : 'hidden')} />
    <aside className={cn('fixed inset-y-0 left-0 z-50 flex w-[min(18rem,88vw)] flex-col overflow-y-auto bg-sidebar px-4 py-6 text-white shadow-2xl transition-transform lg:w-72 lg:translate-x-0', open ? 'translate-x-0' : '-translate-x-full')}>
      <div className="flex items-center justify-between px-2"><Brand light /><button onClick={onClose} className="grid size-9 place-items-center rounded-lg hover:bg-white/10 lg:hidden" aria-label="Fechar menu"><X size={20} /></button></div>
      <nav className="mt-10 flex-1 space-y-1">{items.map(({ to, label, icon: Icon }) => <NavLink onClick={onClose} key={to} to={to} className={({ isActive }) => cn('flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition', isActive ? 'bg-primary text-white shadow-lg shadow-blue-950/30' : 'text-slate-300 hover:bg-white/5 hover:text-white')}><Icon size={20} />{label}</NavLink>)}</nav>
      <button onClick={onLogout} className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-300 transition hover:bg-white/5 hover:text-white"><LogOut size={20} />Sair</button>
    </aside>
  </>
}
