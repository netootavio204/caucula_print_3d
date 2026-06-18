import { Menu, UserRound } from 'lucide-react'
import { useLocation } from 'react-router-dom'

const titles: Record<string, [string, string]> = {
  '/app/orcamento': ['Novo orçamento', 'Calcule com precisão os custos da sua impressão.'],
  '/app/orcamentos': ['Meus orçamentos', 'Acompanhe e gerencie seus orçamentos.'],
  '/app/projetos': ['Projetos e modelos', 'Organize modelos para trabalhos recorrentes.'],
  '/app/estoque': ['Estoque de produtos', 'Controle suas peças prontas para entrega.'],
  '/app/clientes': ['Meus clientes', 'Centralize contatos e histórico comercial.'],
  '/app/insumos': ['Insumos e custos', 'Configure materiais, máquinas e parâmetros.'],
  '/app/minha-conta': ['Minha conta', 'Mantenha seus dados profissionais atualizados.'],
}

export function Header({ onMenu }: { onMenu: () => void }) {
  const [title, subtitle] = titles[useLocation().pathname] ?? ['CalculaPrint 3D', 'Painel de precificação']

  return <header className="sticky top-0 z-20 flex min-h-20 items-center gap-4 border-b border-border bg-white/95 px-4 backdrop-blur sm:px-6 lg:px-8">
    <button className="grid size-10 shrink-0 place-items-center rounded-xl border border-border lg:hidden" onClick={onMenu} aria-label="Abrir menu"><Menu size={21} /></button>
    <div className="min-w-0 flex-1"><h1 className="truncate text-lg font-bold text-slate-950 sm:text-xl">{title}</h1><p className="hidden truncate text-sm text-slate-500 sm:block">{subtitle}</p></div>
    <div className="grid size-10 place-items-center rounded-full bg-blue-50 text-primary" aria-label="Perfil do usuário"><UserRound size={20} /></div>
  </header>
}
