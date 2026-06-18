import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { CheckCircle2, CircleAlert, Info, X } from 'lucide-react'

type ToastType = 'success' | 'error' | 'info'
interface ToastItem { id: number; message: string; type: ToastType }
interface ToastContextValue { showToast: (message: string, type?: ToastType) => void }
const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const remove = useCallback((id: number) => setToasts((items) => items.filter((item) => item.id !== id)), [])
  const showToast = useCallback((message: string, type: ToastType = 'info') => { const id = Date.now(); setToasts((items) => [...items, { id, message, type }]); window.setTimeout(() => remove(id), 3500) }, [remove])
  const value = useMemo(() => ({ showToast }), [showToast])
  const icons = { success: CheckCircle2, error: CircleAlert, info: Info }
  return <ToastContext.Provider value={value}>{children}<div className="fixed bottom-4 right-4 z-[60] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2" aria-live="polite">{toasts.map((toast) => { const Icon = icons[toast.type]; return <div key={toast.id} className="flex items-center gap-3 rounded-xl border border-border bg-white p-4 shadow-xl"><Icon size={20} className={toast.type === 'success' ? 'text-success' : toast.type === 'error' ? 'text-danger' : 'text-primary'} /><p className="flex-1 text-sm font-medium">{toast.message}</p><button onClick={() => remove(toast.id)} aria-label="Fechar aviso"><X size={17} /></button></div> })}</div></ToastContext.Provider>
}
export function useToast() { const context = useContext(ToastContext); if (!context) throw new Error('useToast deve ser usado dentro de ToastProvider'); return context }
