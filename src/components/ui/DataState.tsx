import { CircleAlert, LoaderCircle } from 'lucide-react'

export function DataLoading({ label = 'Carregando...' }: { label?: string }) {
  return <div className="flex items-center justify-center gap-2 py-12 text-sm text-slate-500"><LoaderCircle size={19} className="animate-spin text-primary" />{label}</div>
}

export function DataError({ message }: { message: string }) {
  return <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"><CircleAlert size={19} className="mt-0.5 shrink-0" /><p>{message}</p></div>
}
