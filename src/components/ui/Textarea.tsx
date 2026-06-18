import { forwardRef, type TextareaHTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> { label?: string; error?: string; containerClassName?: string }
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea({ label, error, className, containerClassName, id, ...props }, ref) {
  const textareaId = id ?? props.name
  return <label className={cn('block', containerClassName)} htmlFor={textareaId}>
    {label && <span className="field-label">{label}</span>}
    <textarea ref={ref} id={textareaId} className={cn('focus-ring min-h-28 w-full resize-y rounded-xl border border-border bg-white px-3 py-2.5 text-sm', error && 'border-danger', className)} {...props} />
    {error && <span className="mt-1 block text-xs text-danger">{error}</span>}
  </label>
})
