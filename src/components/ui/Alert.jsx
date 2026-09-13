const VARIANTS = {
  danger: 'bg-danger-50 text-danger-600',
  success: 'bg-success-50 text-success-600',
  warning: 'bg-warning-50 text-warning-600',
}

/** Bandeau de message court (erreur de formulaire, confirmation...). */
export function Alert({ children, variant = 'danger', className = '' }) {
  return (
    <p
      role="alert"
      className={[
        'text-sm rounded-lg px-3 py-2',
        VARIANTS[variant],
        className,
      ].join(' ')}
    >
      {children}
    </p>
  )
}
