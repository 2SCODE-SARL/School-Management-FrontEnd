const VARIANTS = {
  success: 'bg-success-50 text-success-600',
  danger: 'bg-danger-50 text-danger-600',
  warning: 'bg-warning-50 text-warning-600',
  neutral: 'bg-ink-100 text-ink-600',
  primary: 'bg-primary-50 text-primary-700',
}

/** Étiquette de statut courte (actif/inactif, payé/impayé, en attente...). */
export function Badge({ children, variant = 'neutral', className = '' }) {
  return (
    <span
      className={[
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
        VARIANTS[variant],
        className,
      ].join(' ')}
    >
      {children}
    </span>
  )
}
