import { createContext, useCallback, useContext, useState } from 'react'
import { CheckCircle2, X, XCircle } from 'lucide-react'

const ToastContext = createContext(null)

const VARIANT_ICON = {
  success: { Icon: CheckCircle2, className: 'text-success-600' },
  danger: { Icon: XCircle, className: 'text-danger-600' },
}

let nextId = 0

/**
 * Confirmations flottantes et temporaires (ex: "Élève inscrit avec
 * succès"), pour une action ponctuelle qui ne justifie pas un bandeau
 * permanent en haut de page — contrairement à `Alert`, utilisé ailleurs
 * pour des messages qui restent affichés dans le flux de la page.
 */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const showToast = useCallback(
    (message, { variant = 'success', duration = 3500 } = {}) => {
      const id = ++nextId
      setToasts((prev) => [...prev, { id, message, variant }])
      setTimeout(() => dismiss(id), duration)
    },
    [dismiss],
  )

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col items-end gap-2 pointer-events-none">
        {toasts.map((t) => {
          const { Icon, className } = VARIANT_ICON[t.variant] ?? VARIANT_ICON.success
          return (
            <div
              key={t.id}
              role="status"
              className="pointer-events-auto flex max-w-sm items-center gap-2.5 rounded-xl border border-ink-100 bg-white px-4 py-3 shadow-lg shadow-ink-900/10 animate-toast-in"
            >
              <Icon className={`h-4.5 w-4.5 shrink-0 ${className}`} />
              <p className="text-sm font-medium text-ink-900">{t.message}</p>
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                className="ml-1 shrink-0 text-ink-300 hover:text-ink-500 transition-colors"
                aria-label="Fermer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast doit être utilisé dans un <ToastProvider>')
  return ctx
}
