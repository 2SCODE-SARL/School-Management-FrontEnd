import { forwardRef } from 'react'

/**
 * Champ de saisie standard du design system : label + icône optionnelle
 * + adornment de fin (ex: bouton afficher/masquer mot de passe) + erreur.
 */
export const TextField = forwardRef(function TextField(
  { label, id, icon: Icon, endAdornment, error, className = '', required, ...props },
  ref,
) {
  return (
    <div className={className}>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-ink-700 mb-1.5">
          {label}
          {required && <span className="text-danger-500"> *</span>}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-ink-400 pointer-events-none" />
        )}
        <input
          id={id}
          ref={ref}
          required={required}
          className={[
            'w-full rounded-lg border bg-white py-2.5 text-sm text-ink-900 placeholder:text-ink-400 outline-none transition-colors',
            Icon ? 'pl-10' : 'pl-3',
            endAdornment ? 'pr-10' : 'pr-3',
            error
              ? 'border-danger-400 focus:border-danger-500 focus:ring-4 focus:ring-danger-500/10'
              : 'border-ink-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10',
          ].join(' ')}
          {...props}
        />
        {endAdornment && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {endAdornment}
          </div>
        )}
      </div>
      {error && <p className="text-xs text-danger-600 mt-1.5">{error}</p>}
    </div>
  )
})
