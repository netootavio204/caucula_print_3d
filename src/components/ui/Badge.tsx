import type { HTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

type BadgeVariant = 'blue' | 'orange' | 'green' | 'red' | 'gray'
const styles: Record<BadgeVariant, string> = { blue: 'bg-blue-50 text-primary', orange: 'bg-orange-50 text-accent-hover', green: 'bg-emerald-50 text-success', red: 'bg-red-50 text-danger', gray: 'bg-slate-100 text-slate-600' }
export function Badge({ className, children, variant = 'blue', ...props }: HTMLAttributes<HTMLSpanElement> & { variant?: BadgeVariant }) {
  return <span className={cn('inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold', styles[variant], className)} {...props}>{children}</span>
}
