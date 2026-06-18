import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react'
import { cn } from '../../lib/cn'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  icon?: ReactNode
  containerClassName?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input({ label, error, icon, className, containerClassName, id, ...props }, ref) {
  const inputId = id ?? props.name
  return <label className={cn('block', containerClassName)} htmlFor={inputId}>
    {label && <span className="field-label">{label}</span>}
    <span className="relative block">
      {icon && <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">{icon}</span>}
      <input ref={ref} id={inputId} className={cn('focus-ring h-11 w-full rounded-xl border border-border bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 disabled:bg-slate-100', icon ? 'pl-10' : false, error && 'border-danger', className)} {...props} />
    </span>
    {error && <span className="mt-1 block text-xs text-danger">{error}</span>}
  </label>
})
