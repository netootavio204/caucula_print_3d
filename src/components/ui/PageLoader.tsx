import { LoaderCircle } from 'lucide-react'

export function PageLoader() {
  return <div className="grid min-h-screen place-items-center bg-surface" role="status"><div className="flex items-center gap-3 text-sm font-medium text-slate-600"><LoaderCircle className="animate-spin text-primary" size={22} />Carregando...</div></div>
}
