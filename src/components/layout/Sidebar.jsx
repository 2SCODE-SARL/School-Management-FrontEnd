import { useState } from 'react'
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

/**
 * Arborescence : ligne verticale + petite branche par élément, comme un
 * menu de dossier/fichiers. Réutilisée pour les modules d'une section ET
 * pour les sous-pages d'un module (imbrication à deux niveaux).
 */
function TreeList({ collapsed, children }) {
  if (collapsed) return <>{children}</>
  return (
    <div className="relative space-y-1 py-1 pl-[27px]">
      <div className="absolute left-[13px] top-0 bottom-2 w-px bg-white/15" aria-hidden="true" />
      {children.map((node) => (
        <div key={node.key} className="relative pl-3">
          <span className="absolute left-0 top-1/2 h-px w-3 -translate-y-1/2 bg-white/15" aria-hidden="true" />
          {node}
        </div>
      ))}
    </div>
  )
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
  // repliées — ensuite chacune se plie/déplie librement au clic. Même
  // principe pour un module à sous-pages (ex: Finances) dans sa section.
  const [openSections, setOpenSections] = useState(() => {
    const active = sections.find((section) => section.items.some((item) => location.pathname.startsWith(item.path)))
    return new Set(active ? [active.key] : [])
  })
  const [openModules, setOpenModules] = useState(() => {
    const active = visibleItems.find((item) => item.hasChildren && location.pathname.startsWith(item.path))
    return new Set(active ? [active.path] : [])
  })
  function toggleSection(key) {
    setOpenSections((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }
  function toggleModule(path) {
    setOpenModules((prev) => {
      const next = new Set(prev)
      if (next.has(path)) next.delete(path)
      else next.add(path)
      return next
    })
  }
  function handleNavigateChild(item, child) {
    navigate(item.path, { state: { tab: child.key } })
    setMobileOpen(false)
  }

  function renderNavEntry(item) {
    const childItems = visibleChildrenOf(item, primaryRole)
    if (item.hasChildren && childItems.length > 1) {
      return (
        <ExpandableNavItem
          key={item.path}
          item={item}
          childItems={childItems}
          collapsed={collapsed}
          isOpen={collapsed || openModules.has(item.path)}
          isActive={location.pathname.startsWith(item.path)}
          onToggle={() => toggleModule(item.path)}
          onNavigateDefault={() => {
            navigate(item.path)
            setMobileOpen(false)
          }}
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

        <nav className="scrollbar-on-dark flex-1 overflow-y-auto px-3 pt-6 pb-6 space-y-1">
          {ungrouped.map(renderNavEntry)}

          {sections.map((section) => {
            const isOpen = collapsed || openSections.has(section.key)
            const SectionIcon = section.icon
            return (
              <div key={section.key} className="mt-2">
                <button
                  type="button"
                  onClick={() => toggleSection(section.key)}
                  className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-semibold text-white/90 transition-colors hover:bg-white/10 ${
                    collapsed ? 'lg:justify-center lg:px-0' : ''
                  }`}
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/10">
                    <SectionIcon className="h-4 w-4" />
                  </span>
                  <span className={`flex-1 truncate text-left ${collapsed ? 'lg:hidden' : ''}`}>{section.label}</span>
                  <ChevronDown
                    className={`h-3.5 w-3.5 shrink-0 opacity-60 transition-transform ${isOpen ? '' : '-rotate-90'} ${
                      collapsed ? 'lg:hidden' : ''
                    }`}
                  />
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
                      <TreeList collapsed={collapsed}>{section.items.map(renderNavEntry)}</TreeList>
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
 * Inscriptions / Parents / Types de documents) : se plie/déplie directement
 * dans la sidebar (même logique que les sections), pas de panneau flottant
 * — chaque sous-page navigue vers la page du module en lui indiquant quel
 * onglet ouvrir (`state.tab`, déjà lu par ces pages).
 */
function ExpandableNavItem({
  item,
  childItems,
  collapsed,
  isOpen,
  isActive,
  onToggle,
  onNavigateDefault,
  onNavigateChild,
}) {
  const Icon = item.icon
  return (
    <div>
      <button
        type="button"
        onClick={collapsed ? onNavigateDefault : onToggle}
        title={collapsed ? item.label : undefined}
        className={[
          'relative flex w-full items-center gap-3 py-2.5 px-3 rounded-xl text-sm font-medium transition-colors',
          collapsed ? 'lg:justify-center lg:px-0' : '',
          isActive ? 'bg-white/15 text-white' : 'text-white/80 hover:bg-white/10 hover:text-white',
        ].join(' ')}
      >
        <Icon className="h-4.5 w-4.5 shrink-0" />
        <span
          className={`truncate flex-1 text-left ${isActive ? 'font-semibold' : ''} ${collapsed ? 'lg:hidden' : ''}`}
        >
          {item.label}
        </span>
        <ChevronRight
          className={`h-4 w-4 opacity-50 shrink-0 transition-transform ${isOpen && !collapsed ? 'rotate-90' : ''} ${
            collapsed ? 'lg:hidden' : ''
          }`}
        />
      </button>

      <AnimatePresence initial={false}>
        {isOpen && !collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <TreeList collapsed={false}>
              {childItems.map((child) => (
                <button
                  key={child.key}
                  type="button"
                  onClick={() => onNavigateChild(child)}
                  className="block w-full truncate rounded-lg px-3 py-2 text-left text-sm text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                >
                  {child.label}
                </button>
              ))}
            </TreeList>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
