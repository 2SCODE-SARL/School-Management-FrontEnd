import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { LoaderCircle, MoreVertical } from 'lucide-react'

const MENU_WIDTH = 208 // correspond à w-52

/**
 * Menu d'actions compact (déclenché par ⋮), pour garder les lignes de
 * tableau lisibles même avec plusieurs actions possibles.
 * `actions`: [{ label, icon, onClick, variant: 'default' | 'danger', disabled, isLoading }]
 *
 * Rendu via portail (document.body) : un conteneur de tableau avec
 * `overflow-x-auto` rogne sinon tout menu positionné en absolu qui déborde
 * verticalement de ses limites.
 */
export function ActionsMenu({ actions }) {
  const [open, setOpen] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const triggerRef = useRef(null)
  const menuRef = useRef(null)

  function handleToggle(e) {
    e.stopPropagation()
    if (!open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      setPosition({
        top: rect.bottom + 4,
        left: Math.max(8, rect.right - MENU_WIDTH),
      })
    }
    setOpen((v) => !v)
  }

  useEffect(() => {
    if (!open) return

    function handleClickOutside(e) {
      if (triggerRef.current?.contains(e.target) || menuRef.current?.contains(e.target)) {
        return
      }
      setOpen(false)
    }
    // Le scroll (y compris celui du conteneur de tableau) fait qu'un menu
    // en position fixe se détacherait visuellement de son bouton : on le
    // referme plutôt proprement.
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
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={handleToggle}
        className="h-8 w-8 flex items-center justify-center rounded-lg text-ink-500 hover:bg-ink-100 transition-colors"
        aria-label="Actions"
      >
        <MoreVertical className="h-4 w-4" />
      </button>

      {open &&
        createPortal(
          <div
            ref={menuRef}
            onClick={(e) => e.stopPropagation()}
            style={{ position: 'fixed', top: position.top, left: position.left, width: MENU_WIDTH }}
            className="bg-white rounded-xl border border-ink-100 shadow-lg shadow-ink-900/5 py-1.5 z-50"
          >
            {actions.map((action) => (
              <button
                key={action.label}
                type="button"
                disabled={action.disabled || action.isLoading}
                onClick={() => {
                  setOpen(false)
                  action.onClick()
                }}
                className={[
                  'flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
                  action.variant === 'danger'
                    ? 'text-danger-600 hover:bg-danger-50'
                    : 'text-ink-700 hover:bg-ink-50',
                ].join(' ')}
              >
                {action.isLoading ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                ) : (
                  action.icon && <action.icon className="h-4 w-4" />
                )}
                {action.label}
              </button>
            ))}
          </div>,
          document.body,
        )}
    </>
  )
}
