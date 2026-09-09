import * as React from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
  helperText?: string
  label?: string
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, helperText, label, id, required, ...props }, ref) => {
    const inputId = id || React.useId()
    const helperId = `${inputId}-helper`

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-semibold text-muted-foreground">
            {label}
            {required && <span className="ml-1 text-destructive">*</span>}
          </label>
        )}
        <input
          type={type}
          id={inputId}
          ref={ref}
          required={required}
          aria-invalid={error || undefined}
          aria-describedby={helperText ? helperId : undefined}
          className={cn(
            'flex min-h-[44px] w-full rounded-xl border bg-card px-4 py-2.5 text-base sm:text-sm font-normal text-foreground shadow-xs outline-none transition-all duration-150 placeholder:text-muted-foreground/60',
            'focus:border-primary focus:ring-2 focus:ring-primary/20',
            'disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-destructive focus:border-destructive focus:ring-destructive/20',
            className,
          )}
          {...props}
        />
        {helperText && (
          <p
            id={helperId}
            className={cn('text-xs font-medium', error ? 'text-destructive' : 'text-muted-foreground')}
          >
            {helperText}
          </p>
        )}
      </div>
    )
  },
)
Input.displayName = 'Input'

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean
  helperText?: string
  label?: string
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, helperText, label, id, required, ...props }, ref) => {
    const textareaId = id || React.useId()
    const helperId = `${textareaId}-helper`

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={textareaId} className="block text-xs font-semibold text-muted-foreground">
            {label}
            {required && <span className="ml-1 text-destructive">*</span>}
          </label>
        )}
        <textarea
          id={textareaId}
          ref={ref}
          required={required}
          aria-invalid={error || undefined}
          aria-describedby={helperText ? helperId : undefined}
          className={cn(
            'flex min-h-[96px] w-full rounded-xl border bg-card px-4 py-2.5 text-base sm:text-sm font-normal text-foreground shadow-xs outline-none transition-all duration-150 placeholder:text-muted-foreground/60 resize-y',
            'focus:border-primary focus:ring-2 focus:ring-primary/20',
            'disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-destructive focus:border-destructive focus:ring-destructive/20',
            className,
          )}
          {...props}
        />
        {helperText && (
          <p
            id={helperId}
            className={cn('text-xs font-medium', error ? 'text-destructive' : 'text-muted-foreground')}
          >
            {helperText}
          </p>
        )}
      </div>
    )
  },
)
Textarea.displayName = 'Textarea'

export { Input, Textarea }
