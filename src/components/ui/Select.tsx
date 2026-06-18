import { forwardRef, type SelectHTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> { label?: string; error?: string; containerClassName?: string }
export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select({ label, error, className, containerClassName, id, children, ...props }, ref) {
  const selectId = id ?? props.name
  return <label className={cn('block', containerClassName)} htmlFor={selectId}>
    {label && <span className="field-label">{label}</span>}
    <select ref={ref} id={selectId} className={cn('focus-ring h-11 w-full rounded-xl border border-border bg-white px-3 text-sm', error && 'border-danger', className)} {...props}>{children}</select>
    {error && <span className="mt-1 block text-xs text-danger">{error}</span>}
  </label>
})
