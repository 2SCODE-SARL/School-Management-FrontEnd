import { useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown, ChevronRight, ChevronsLeft, ChevronsRight, GraduationCap, X } from 'lucide-react'
import { useAuth } from '../../auth/AuthContext'
import { getPrimaryRole } from '../../auth/roleHome'
import { MODULE_GROUP_META } from '../../config/modules'
import { useSidebar } from './SidebarContext'

// Ordre d'affichage des sections — les modules sans `group` (Tableau de
// bord) restent en tête, hors section.
const GROUP_ORDER = ['academique', 'finances', 'gestion', 'parametrage']

/** Répartit les modules visibles en sections, dans l'ordre `GROUP_ORDER`. */
function groupNavItems(items) {
  const ungrouped = items.filter((item) => !item.group)
  const sections = GROUP_ORDER.map((key) => ({
    key,
    ...MODULE_GROUP_META[key],
    items: items.filter((item) => item.group === key),
  })).filter((section) => section.items.length > 0)
  return { ungrouped, sections }
}

/** Sous-pages d'un module visibles pour ce rôle (mêmes règles `allowedRoles` que les modules). */
function visibleChildrenOf(item, primaryRole) {
  if (!item.children) return []
  return item.children.filter((child) => !child.allowedRoles || child.allowedRoles.includes(primaryRole))
}

export function Sidebar({ navigation, subtitle = 'Espace Administrateur' }) {
  const { user } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const primaryRole = getPrimaryRole(user)
  const { collapsed, setCollapsed, mobileOpen, setMobileOpen } = useSidebar()
  const visibleItems = navigation.filter(
    (item) => !item.allowedRoles || item.allowedRoles.includes(primaryRole),
  )
  const { ungrouped, sections } = groupNavItems(visibleItems)

  // La section qui contient la page courante démarre dépliée, les autres
  // repliées — ensuite chacune se plie/déplie librement au clic.
  const [openSections, setOpenSections] = useState(() => {
    const active = sections.find((section) => section.items.some((item) => location.pathname.startsWith(item.path)))
    return new Set(active ? [active.key] : [])
  })
  function toggleSection(key) {
    setOpenSections((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  // Sous-menu flottant (un seul ouvert à la fois) — un module avec au moins
  // deux sous-pages visibles pour ce rôle s'ouvre en liste flottante plutôt
  // que de naviguer directement (voir FlyoutNavItem). Rendu via un portail
  // (position figée aux coordonnées du bouton) car le panneau <nav> a un
  // défilement qui, sinon, coupe tout ce qui déborde à droite. S'ouvre au
  // clic ET au survol ; la fermeture au survol est différée pour laisser le
  // temps de glisser la souris du bouton vers le panneau sans qu'il se
  // referme entre les deux.
  const [openFlyout, setOpenFlyout] = useState(null) // { path, top, left } | null
  const closeTimeoutRef = useRef(null)
  function cancelScheduledClose() {
    clearTimeout(closeTimeoutRef.current)
  }
  function scheduleClose() {
    cancelScheduledClose()
    closeTimeoutRef.current = setTimeout(() => setOpenFlyout(null), 200)
  }
  function closeFlyout() {
    cancelScheduledClose()
    setOpenFlyout(null)
  }
  function openFlyoutFor(item, rect) {
    cancelScheduledClose()
    setOpenFlyout({ path: item.path, top: rect.top, left: rect.right + 8 })
  }
  function handleNavigateChild(item, child) {
    navigate(item.path, { state: { tab: child.key } })
    closeFlyout()
    setMobileOpen(false)
  }

  function renderNavEntry(item) {
    const childItems = visibleChildrenOf(item, primaryRole)
    if (item.hasChildren && childItems.length > 1) {
      return (
        <FlyoutNavItem
          key={item.path}
          item={item}
          childItems={childItems}
          collapsed={collapsed}
          isOpen={openFlyout?.path === item.path}
          position={openFlyout?.path === item.path ? openFlyout : null}
          isActive={location.pathname.startsWith(item.path)}
          onToggle={(rect) =>
            setOpenFlyout((prev) => (prev?.path === item.path ? null : { path: item.path, top: rect.top, left: rect.right + 8 }))
          }
          onHoverOpen={(rect) => openFlyoutFor(item, rect)}
          onScheduleClose={scheduleClose}
          onCancelScheduledClose={cancelScheduledClose}
          onClose={closeFlyout}
          onNavigateChild={(child) => handleNavigateChild(item, child)}
        />
      )
    }
    return <NavItem key={item.path} item={item} collapsed={collapsed} onNavigate={() => setMobileOpen(false)} />
  }

  return (
    <>
      {/* Fond assombri derrière le tiroir mobile */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-ink-900/40 lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={[
          'fixed lg:sticky top-0 left-0 z-40 lg:z-auto flex flex-col h-screen w-64',
          collapsed ? 'lg:w-20' : 'lg:w-64',
          'bg-gradient-to-b from-primary-600 via-primary-700 to-primary-900',
          'shadow-xl shadow-primary-900/20 rounded-r-3xl',
          'transition-all duration-200 ease-in-out',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        ].join(' ')}
      >
        <div
          className={[
            'flex items-center gap-3 pt-7 pb-6 px-6',
            collapsed ? 'lg:px-0 lg:justify-center' : '',
          ].join(' ')}
        >
          <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center shrink-0">
            <GraduationCap className="h-5 w-5 text-primary-700" strokeWidth={2.2} />
          </div>
          <div className={`min-w-0 ${collapsed ? 'lg:hidden' : ''}`}>
            <p className="font-heading font-bold text-white text-sm leading-tight truncate">
              Gestion des Écoles
            </p>
            <p className="text-xs text-white/60 truncate">{subtitle}</p>
          </div>
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="ml-auto lg:hidden h-8 w-8 flex items-center justify-center rounded-lg text-white/70 hover:bg-white/10 transition-colors"
            aria-label="Fermer le menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className={`border-t border-white/15 ${collapsed ? 'lg:mx-3' : 'mx-6'}`} />

        <nav
          className="scrollbar-on-dark flex-1 overflow-y-auto px-3 pt-6 pb-6 space-y-1"
          onScroll={closeFlyout}
        >
          {ungrouped.map(renderNavEntry)}

          {sections.map((section) => {
            const isOpen = collapsed || openSections.has(section.key)
            const SectionIcon = section.icon
            return (
              <div key={section.key} className="mt-4 pt-4 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => toggleSection(section.key)}
                  className={`flex w-full items-center justify-between gap-2 px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-white/40 hover:text-white/70 transition-colors ${
                    collapsed ? 'lg:hidden' : ''
                  }`}
                >
                  <span className="flex items-center gap-1.5 truncate">
                    <SectionIcon className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{section.label}</span>
                  </span>
                  <ChevronDown className={`h-3 w-3 shrink-0 transition-transform ${isOpen ? '' : '-rotate-90'}`} />
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      <div className="space-y-1 pt-0.5">{section.items.map(renderNavEntry)}</div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </nav>

        <button
          type="button"
          onClick={() => setCollapsed((v) => !v)}
          className="hidden lg:flex items-center justify-center gap-2 mx-3 mb-4 h-9 rounded-xl text-white/70 hover:bg-white/10 hover:text-white transition-colors"
          aria-label={collapsed ? 'Agrandir le menu' : 'Réduire le menu'}
          title={collapsed ? 'Agrandir le menu' : 'Réduire le menu'}
        >
          {collapsed ? (
            <ChevronsRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronsLeft className="h-4 w-4" />
              <span className="text-xs font-medium">Réduire</span>
            </>
          )}
        </button>
      </aside>
    </>
  )
}

function NavItem({ item: { label, path, icon: Icon, end }, collapsed, onNavigate }) {
  return (
    <NavLink
      to={path}
      end={end}
      onClick={onNavigate}
      title={collapsed ? label : undefined}
      className={({ isActive }) =>
        [
          'relative flex items-center gap-3 py-2.5 px-3 rounded-xl text-sm font-medium transition-colors',
          collapsed ? 'lg:justify-center lg:px-0' : '',
          isActive ? 'text-white' : 'text-white/80 hover:bg-white/10 hover:text-white',
        ].join(' ')
      }
    >
      {({ isActive }) =>
        isActive ? (
          <>
            {/* Surbrillance active discrète : un fond translucide qui glisse
                en douceur d'un item à l'autre (layoutId partagé, Framer
                Motion) — plus sobre qu'un bloc blanc plein. */}
            <motion.div
              layoutId="sidebar-active-pill"
              className="absolute inset-0 rounded-xl bg-white/15"
              transition={{ type: 'spring', stiffness: 450, damping: 38 }}
            />
            <Icon className="relative z-10 h-4.5 w-4.5 shrink-0" />
            <span className={`relative z-10 truncate flex-1 font-semibold ${collapsed ? 'lg:hidden' : ''}`}>
              {label}
            </span>
          </>
        ) : (
          <>
            <Icon className="h-4.5 w-4.5 shrink-0" />
            <span className={`truncate flex-1 ${collapsed ? 'lg:hidden' : ''}`}>{label}</span>
          </>
        )
      }
    </NavLink>
  )
}

/**
 * Module avec plusieurs sous-pages (ex: Élèves & Inscriptions → Élèves /
 * Inscriptions / Parents / Types de documents) : au lieu de naviguer
 * directement, ouvre une liste flottante (comme un sous-menu d'app de
 * bureau) — chaque sous-page navigue vers la page du module en lui
 * indiquant quel onglet ouvrir (`state.tab`, déjà lu par ces pages).
 */
function FlyoutNavItem({
  item,
  childItems,
  collapsed,
  isOpen,
  position,
  isActive,
  onToggle,
  onHoverOpen,
  onScheduleClose,
  onCancelScheduledClose,
  onClose,
  onNavigateChild,
}) {
  const Icon = item.icon
  const buttonRef = useRef(null)

  function handleClick() {
    const rect = buttonRef.current?.getBoundingClientRect()
    if (rect) onToggle(rect)
  }
  function handleMouseEnter() {
    const rect = buttonRef.current?.getBoundingClientRect()
    if (rect) onHoverOpen(rect)
  }

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={onScheduleClose}
        title={collapsed ? item.label : undefined}
        className={[
          'relative flex w-full items-center gap-3 py-2.5 px-3 rounded-xl text-sm font-medium transition-colors',
          collapsed ? 'lg:justify-center lg:px-0' : '',
          isActive || isOpen ? 'bg-white/15 text-white' : 'text-white/80 hover:bg-white/10 hover:text-white',
        ].join(' ')}
      >
        <Icon className="h-4.5 w-4.5 shrink-0" />
        <span
          className={`truncate flex-1 text-left ${isActive ? 'font-semibold' : ''} ${collapsed ? 'lg:hidden' : ''}`}
        >
          {item.label}
        </span>
        <ChevronRight
          className={`h-4 w-4 opacity-50 shrink-0 transition-transform ${isOpen ? 'rotate-90' : ''} ${
            collapsed ? 'lg:hidden' : ''
          }`}
        />
      </button>

      {isOpen &&
        position &&
        createPortal(
          <>
            {/* Ferme le sous-menu au clic ailleurs. z-30 (pas 40, sous la
                sidebar) pour ne pas recouvrir le bouton déclencheur — sinon
                le survol du bouton bascule aussitôt sur cette couche et
                déclenche un mouseleave, qui referme puis rouvre en boucle. */}
            <div className="fixed inset-0 z-30" onClick={onClose} aria-hidden="true" />
            <div
              style={{ top: position.top, left: position.left }}
              onMouseEnter={onCancelScheduledClose}
              onMouseLeave={onScheduleClose}
              className="fixed z-50 w-60 origin-top-left animate-dropdown-in overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-xl shadow-ink-900/10"
            >
              <p className="truncate border-b border-ink-100 px-3.5 py-2.5 text-xs font-semibold uppercase tracking-wide text-ink-400">
                {item.label}
              </p>
              <div className="p-1.5">
                {childItems.map((child) => (
                  <button
                    key={child.key}
                    type="button"
                    onClick={() => onNavigateChild(child)}
                    className="block w-full truncate rounded-lg px-2.5 py-2 text-left text-sm font-medium text-ink-700 transition-colors hover:bg-primary-50 hover:text-primary-700"
                  >
                    {child.label}
                  </button>
                ))}
              </div>
            </div>
          </>,
          document.body,
        )}
    </div>
  )
}
