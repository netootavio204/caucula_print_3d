import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '../../lib/cn'

interface CardProps extends HTMLAttributes<HTMLDivElement> { title?: string; description?: string; action?: ReactNode }
export function Card({ title, description, action, children, className, ...props }: CardProps) {
  return <section className={cn('rounded-2xl border border-border bg-white p-5 shadow-card sm:p-6', className)} {...props}>
    {(title || description || action) && <header className="mb-5 flex flex-col items-start justify-between gap-4 sm:flex-row">
      <div>{title && <h2 className="font-semibold text-slate-900">{title}</h2>}{description && <p className="mt-1 text-sm text-slate-500">{description}</p>}</div>{action}
    </header>}
    {children}
  </section>
}
