import { useEffect, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { Button } from './Button'

interface ModalProps { open: boolean; onClose: () => void; title: string; children: ReactNode; footer?: ReactNode }
export function Modal({ open, onClose, title, children, footer }: ModalProps) {
  useEffect(() => { if (!open) return; const close = (event: KeyboardEvent) => event.key === 'Escape' && onClose(); document.addEventListener('keydown', close); return () => document.removeEventListener('keydown', close) }, [open, onClose])
  if (!open) return null
  return <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/60 p-4" role="dialog" aria-modal="true" aria-label={title} onMouseDown={onClose}>
    <div className="flex max-h-[calc(100dvh-2rem)] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl" onMouseDown={(event) => event.stopPropagation()}>
      <header className="flex items-center justify-between border-b border-border px-5 py-4"><h2 className="font-semibold">{title}</h2><Button variant="ghost" className="min-h-9 px-2" onClick={onClose} aria-label="Fechar"><X size={20} /></Button></header>
      <div className="overflow-y-auto p-4 sm:p-5">{children}</div>{footer && <footer className="flex flex-col-reverse justify-end gap-3 border-t border-border px-4 py-4 sm:flex-row sm:px-5 [&>button]:w-full sm:[&>button]:w-auto">{footer}</footer>}
    </div>
  </div>
}
