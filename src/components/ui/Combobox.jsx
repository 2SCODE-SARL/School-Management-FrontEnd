import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Check, ChevronDown, Search } from 'lucide-react'

/**
 * Liste déroulante avec recherche intégrée — pour les listes potentiellement
 * longues (établissements, futures listes d'élèves/employés...) où un
 * <select> natif devient pénible à parcourir. Rendue via portail pour ne
 * jamais être rognée par un conteneur avec overflow (tableau, modale...).
 */
export function Combobox({
  id,
  label,
  options,
  value,
  onChange,
  placeholder = 'Sélectionner...',
  searchPlaceholder = 'Rechercher...',
  error,
  className = '',
  required,
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 })
  const triggerRef = useRef(null)
  const searchRef = useRef(null)
  const menuRef = useRef(null)

  const selected = options.find((o) => o.value === value)
  const filtered = options.filter((o) =>
    o.label.toLowerCase().includes(query.trim().toLowerCase()),
  )

  function openMenu() {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      setPosition({ top: rect.bottom + 4, left: rect.left, width: rect.width })
    }
    setQuery('')
    setOpen(true)
  }

  useEffect(() => {
    if (!open) return
    const t = setTimeout(() => searchRef.current?.focus(), 0)
    return () => clearTimeout(t)
  }, [open])

  useEffect(() => {
    if (!open) return
    function handleClickOutside(e) {
      if (triggerRef.current?.contains(e.target) || menuRef.current?.contains(e.target)) {
        return
      }
      setOpen(false)
    }
    function handleScroll() {
      setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('scroll', handleScroll, true)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('scroll', handleScroll, true)
    }
  }, [open])

  return (
    <div className={className}>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-ink-700 mb-1.5">
          {label}
          {required && <span className="text-danger-500"> *</span>}
        </label>
      )}

      <button
        id={id}
        ref={triggerRef}
        type="button"
        onClick={() => (open ? setOpen(false) : openMenu())}
        className={[
          'w-full flex items-center justify-between gap-2 rounded-lg border bg-white px-3 py-2.5 text-sm text-left transition-colors',
          error
            ? 'border-danger-400 focus:ring-4 focus:ring-danger-500/10'
            : 'border-ink-200 hover:border-ink-300 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10',
        ].join(' ')}
      >
        <span className={`truncate ${selected ? 'text-ink-900' : 'text-ink-400'}`}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown className="h-4 w-4 text-ink-400 shrink-0" />
      </button>
      {error && <p className="text-xs text-danger-600 mt-1.5">{error}</p>}

      {open &&
        createPortal(
          <div
            ref={menuRef}
            style={{ position: 'fixed', top: position.top, left: position.left, width: position.width }}
            className="flex flex-col max-h-72 bg-white rounded-xl border border-ink-100 shadow-lg shadow-ink-900/5 z-50 overflow-hidden"
          >
            <div className="relative p-2 border-b border-ink-100 shrink-0">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-ink-400 pointer-events-none" />
              <input
                ref={searchRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full rounded-lg border border-ink-200 bg-ink-50 pl-8 pr-2 py-1.5 text-sm text-ink-900 placeholder:text-ink-400 outline-none focus:border-primary-500"
              />
            </div>

            <div className="overflow-y-auto py-1">
              {filtered.length === 0 && (
                <p className="px-3 py-2.5 text-sm text-ink-400">Aucun résultat.</p>
              )}
              {filtered.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value)
                    setOpen(false)
                  }}
                  className="flex w-full items-center justify-between gap-2 px-3 py-2 text-sm text-left text-ink-700 hover:bg-ink-50 transition-colors"
                >
                  <span className="truncate">{opt.label}</span>
                  {opt.value === value && (
                    <Check className="h-4 w-4 text-primary-600 shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </div>,
          document.body,
        )}
    </div>
  )
}
