import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

interface EmptyStateProps { icon: LucideIcon; title: string; description: string; action?: ReactNode }
export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-12 text-center"><span className="mb-4 grid size-12 place-items-center rounded-2xl bg-blue-50 text-primary"><Icon size={24} /></span><h3 className="font-semibold text-slate-900">{title}</h3><p className="mt-2 max-w-md text-sm leading-6 text-slate-500">{description}</p>{action && <div className="mt-5">{action}</div>}</div>
}
