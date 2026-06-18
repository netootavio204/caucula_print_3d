import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { LoaderCircle } from 'lucide-react'
import { cn } from '../../lib/cn'

type Variant = 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost'
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  loading?: boolean
  fullWidth?: boolean
}

const variants: Record<Variant, string> = {
  primary: 'bg-primary text-white hover:bg-primary-hover shadow-sm',
  secondary: 'bg-accent text-white hover:bg-accent-hover shadow-sm',
  outline: 'border border-border bg-white text-slate-700 hover:bg-slate-50',
  danger: 'bg-danger text-white hover:bg-red-700',
  ghost: 'text-slate-600 hover:bg-slate-100',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = 'primary', loading = false, fullWidth = false, disabled, children, ...props },
  ref,
) {
  return (
    <button ref={ref} disabled={disabled || loading} className={cn('inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60', variants[variant], fullWidth && 'w-full', className)} {...props}>
      {loading && <LoaderCircle size={18} className="animate-spin" />}
      {children}
    </button>
  )
})
