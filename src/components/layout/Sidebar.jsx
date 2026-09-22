import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ChevronRight, ChevronsLeft, ChevronsRight, GraduationCap, X } from 'lucide-react'
import { useAuth } from '../../auth/AuthContext'
import { getPrimaryRole } from '../../auth/roleHome'
import { MODULE_GROUP_LABELS } from '../../config/modules'
import { useSidebar } from './SidebarContext'

// Ordre d'affichage des sections — les modules sans `group` (Tableau de
// bord) restent en tête, hors section.
const GROUP_ORDER = ['academique', 'finances', 'gestion', 'parametrage']

/** Répartit les modules visibles en sections, dans l'ordre `GROUP_ORDER`. */
function groupNavItems(items) {
  const ungrouped = items.filter((item) => !item.group)
  const sections = GROUP_ORDER.map((key) => ({
    key,
    label: MODULE_GROUP_LABELS[key],
    items: items.filter((item) => item.group === key),
  })).filter((section) => section.items.length > 0)
  return { ungrouped, sections }
}

export function Sidebar({ navigation, subtitle = 'Espace Administrateur' }) {
  const { user } = useAuth()
  const primaryRole = getPrimaryRole(user)
  const { collapsed, setCollapsed, mobileOpen, setMobileOpen } = useSidebar()
  const visibleItems = navigation.filter(
    (item) => !item.allowedRoles || item.allowedRoles.includes(primaryRole),
  )
  const { ungrouped, sections } = groupNavItems(visibleItems)

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
          {ungrouped.map((item) => (
            <NavItem key={item.path} item={item} collapsed={collapsed} onNavigate={() => setMobileOpen(false)} />
          ))}

          {sections.map((section) => (
            <div key={section.key} className="pt-3">
              <p
                className={`px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-white/40 ${
                  collapsed ? 'lg:hidden' : ''
                }`}
              >
                {section.label}
              </p>
              {section.items.map((item) => (
                <NavItem key={item.path} item={item} collapsed={collapsed} onNavigate={() => setMobileOpen(false)} />
              ))}
            </div>
          ))}
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

function NavItem({ item: { label, path, icon: Icon, end, hasChildren }, collapsed, onNavigate }) {
  return (
    <NavLink
      to={path}
      end={end}
      onClick={onNavigate}
      title={collapsed ? label : undefined}
      className={({ isActive }) =>
        [
          'relative flex items-center gap-3 py-2.5 px-3 text-sm font-medium transition-colors',
          collapsed ? 'lg:justify-center lg:px-0' : '',
          isActive ? '-mr-3 text-primary-700' : 'rounded-xl text-white/80 hover:bg-white/10 hover:text-white',
        ].join(' ')
      }
    >
      {({ isActive }) =>
        isActive ? (
          <>
            {/* Pastille active "en ruban" : glisse en douceur d'un item à
                l'autre grâce au layoutId partagé (Framer Motion), et se
                découpe en courbe au bord de la sidebar via .nav-active-pill
                (voir index.css). */}
            <motion.div
              layoutId="sidebar-active-pill"
              className="nav-active-pill absolute inset-0 bg-white shadow-sm"
              transition={{ type: 'spring', stiffness: 450, damping: 38 }}
            />
            <Icon className="relative z-10 h-4.5 w-4.5 shrink-0" />
            <span className={`relative z-10 truncate flex-1 ${collapsed ? 'lg:hidden' : ''}`}>{label}</span>
            {hasChildren && (
              <ChevronRight className={`relative z-10 h-4 w-4 opacity-50 shrink-0 ${collapsed ? 'lg:hidden' : ''}`} />
            )}
          </>
        ) : (
          <>
            <Icon className="h-4.5 w-4.5 shrink-0" />
            <span className={`truncate flex-1 ${collapsed ? 'lg:hidden' : ''}`}>{label}</span>
            {hasChildren && <ChevronRight className={`h-4 w-4 opacity-50 shrink-0 ${collapsed ? 'lg:hidden' : ''}`} />}
          </>
        )
      }
    </NavLink>
  )
}
