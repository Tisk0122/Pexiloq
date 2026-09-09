'use client'

import * as React from 'react'
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export type ToastType = 'success' | 'error' | 'info'

export interface ToastMessage {
  id: string
  message: string
  type: ToastType
}

interface ToastContextType {
  toast: (message: string, type?: ToastType) => void
  removeToast: (id: string) => void
}

const ToastContext = React.createContext<ToastContextType | null>(null)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastMessage[]>([])

  const toast = React.useCallback((message: string, type: ToastType = 'info') => {
    const id = crypto.randomUUID()
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 4000)
  }, [])

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toast, removeToast }}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 max-w-sm w-full px-4 sm:px-0 pointer-events-none"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={cn(
              'pointer-events-auto flex items-center justify-between gap-3 rounded-xl border p-4 shadow-lg transition-all animate-in slide-in-from-bottom-5 duration-200',
              t.type === 'success' && 'bg-emerald-950/90 text-emerald-100 border-emerald-800/50',
              t.type === 'error' && 'bg-destructive text-destructive-foreground border-destructive/50',
              t.type === 'info' && 'bg-primary text-primary-foreground border-border/40',
            )}
          >
            <div className="flex items-center gap-2.5 text-xs sm:text-sm font-medium">
              {t.type === 'success' && <CheckCircle2 className="size-4 shrink-0 text-emerald-400" />}
              {t.type === 'error' && <AlertCircle className="size-4 shrink-0 text-red-200" />}
              {t.type === 'info' && <Info className="size-4 shrink-0 text-muted-foreground/80" />}
              <span>{t.message}</span>
            </div>
            <button
              type="button"
              onClick={() => removeToast(t.id)}
              className="grid size-6 place-items-center rounded-md opacity-70 hover:opacity-100 transition-opacity"
              aria-label="Dismiss toast"
            >
              <X className="size-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = React.useContext(ToastContext)
  if (!context) {
    // Graceful fallback if invoked outside ToastProvider
    return {
      toast: (msg: string) => console.log('Toast:', msg),
      removeToast: () => {},
    }
  }
  return context
}
