import { forwardRef } from 'react'
import { ChevronDown } from 'lucide-react'

/** Liste déroulante standard du design system. `options`: [{ value, label }]. */
export const Select = forwardRef(function Select(
  { label, id, options, error, className = '', required, ...props },
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
        <select
          id={id}
          ref={ref}
          required={required}
          className={[
            'w-full appearance-none rounded-lg border bg-white pl-3 pr-9 py-2.5 text-sm text-ink-900 outline-none transition-colors',
            error
              ? 'border-danger-400 focus:border-danger-500 focus:ring-4 focus:ring-danger-500/10'
              : 'border-ink-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10',
          ].join(' ')}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400 pointer-events-none" />
      </div>
      {error && <p className="text-xs text-danger-600 mt-1.5">{error}</p>}
    </div>
  )
})
