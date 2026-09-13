import { LoaderCircle } from 'lucide-react'

const VARIANTS = {
  primary:
    'bg-primary-600 hover:bg-primary-700 text-white shadow-sm shadow-primary-600/10',
  secondary:
    'bg-white hover:bg-ink-50 text-ink-700 border border-ink-200',
  ghost: 'bg-transparent hover:bg-ink-100 text-ink-600',
  danger: 'bg-danger-600 hover:bg-danger-700 text-white',
}

const SIZES = {
  sm: 'text-xs px-3 py-1.5 gap-1.5',
  md: 'text-sm px-4 py-2.5 gap-2',
}

/**
 * Bouton d'action de base du design system.
 * variant: 'primary' | 'secondary' | 'ghost' | 'danger'
 * size: 'sm' | 'md' (défaut) — 'sm' pour les rangées d'actions serrées
 * (pieds de modale de détail, lignes de tableau...).
 */
export function Button({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  fullWidth = false,
  type = 'button',
  className = '',
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      className={[
        'inline-flex items-center justify-center rounded-lg font-heading font-semibold transition-colors',
        'disabled:opacity-60 disabled:cursor-not-allowed',
        VARIANTS[variant],
        SIZES[size],
        fullWidth ? 'w-full' : '',
        className,
      ].join(' ')}
      {...props}
    >
      {isLoading && <LoaderCircle className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  )
}
