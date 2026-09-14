import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Bell, ChevronDown, LogOut, Menu, Search, User } from 'lucide-react'
import { useAuth } from '../../auth/AuthContext'
import { listMesNotifications, listMesNotificationsNonLues, marquerNotificationLue } from '../../api/communication'
import { Avatar } from '../ui/Avatar'
import { ROLE_LABELS } from '../../config/roles'
import { formatDateTime } from '../../lib/formatDate'
import { useSidebar } from './SidebarContext'

export function Topbar() {
  const { user, logout } = useAuth()
  const { setMobileOpen } = useSidebar()
  const [menuOpen, setMenuOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const menuRef = useRef(null)
  const notifRef = useRef(null)
  const queryClient = useQueryClient()

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false)
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Accessible à tout utilisateur connecté quel que soit son rôle ("01 —
  // Commun | Communication"). Pas de WebSocket disponible : on interroge
  // régulièrement (30s) + on force un rafraîchissement à l'ouverture de la
  // cloche, sinon la pastille reste figée sur l'état du premier chargement.
  const { data: nonLuesData } = useQuery({
    queryKey: ['communication', 'notifications', 'non-lues'],
    queryFn: listMesNotificationsNonLues,
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  })
  const nonLues = Array.isArray(nonLuesData) ? nonLuesData : (nonLuesData?.items ?? [])

  const { data: recentesData, isLoading: isLoadingRecentes } = useQuery({
    queryKey: ['communication', 'notifications', 'recentes'],
    queryFn: () => listMesNotifications({ limit: 10 }),
    enabled: notifOpen,
  })
  const recentes = Array.isArray(recentesData) ? recentesData : (recentesData?.items ?? [])

  const marquerLueMutation = useMutation({
    mutationFn: (notificationId) => marquerNotificationLue(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communication', 'notifications'] })
    },
  })

  const displayName =
    user?.prenom || user?.nom
      ? `${user?.prenom ?? ''} ${user?.nom ?? ''}`.trim()
      : (user?.email ?? 'Utilisateur')
  const primaryRole = user?.roles?.[0]
  const roleLabel = ROLE_LABELS[primaryRole] ?? primaryRole ?? '—'

  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 sm:gap-4 bg-white border-b border-ink-100 px-4 sm:px-6 py-3.5">
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="lg:hidden h-9 w-9 shrink-0 flex items-center justify-center rounded-lg text-ink-600 hover:bg-ink-100 transition-colors"
        aria-label="Ouvrir le menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="relative w-full max-w-xs min-w-0">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
        <input
          type="search"
          placeholder="Rechercher..."
          className="w-full rounded-lg border border-ink-200 bg-ink-50 pl-9 pr-3 py-2 text-sm text-ink-900 placeholder:text-ink-400 outline-none transition-colors focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10"
        />
      </div>

      <div className="flex items-center gap-2 sm:gap-4 shrink-0 ml-auto">
        <div className="relative" ref={notifRef}>
          <button
            type="button"
            onClick={() => {
              setNotifOpen((v) => !v)
              queryClient.invalidateQueries({ queryKey: ['communication', 'notifications'] })
            }}
            className="relative h-9 w-9 flex items-center justify-center rounded-lg text-ink-500 hover:bg-ink-100 transition-colors"
            aria-label="Notifications"
          >
            <Bell className="h-4.5 w-4.5" />
            {nonLues.length > 0 && (
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-danger-500" />
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl border border-ink-100 shadow-lg shadow-ink-900/5 py-2 z-20 max-h-96 overflow-y-auto">
              <p className="px-3 pb-2 text-xs font-semibold text-ink-500 uppercase tracking-wide">Notifications</p>
              {isLoadingRecentes ? (
                <div className="px-3 py-6 flex justify-center">
                  <div className="h-5 w-5 rounded-full border-2 border-ink-200 border-t-primary-600 animate-spin" />
                </div>
              ) : recentes.length === 0 ? (
                <p className="px-3 py-4 text-sm text-ink-400">Aucune notification.</p>
              ) : (
                recentes.map((n) => {
                  const nonLue = n.statut !== 'LUE'
                  return (
                    <button
                      key={n.id}
                      type="button"
                      onClick={() => nonLue && marquerLueMutation.mutate(n.id)}
                      className={[
                        'flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left transition-colors hover:bg-ink-50',
                        nonLue ? 'bg-primary-50/50' : '',
                      ].join(' ')}
                    >
                      <span className="flex items-center gap-1.5 w-full">
                        {nonLue && <span className="h-1.5 w-1.5 rounded-full bg-primary-600 shrink-0" />}
                        <span className="text-sm font-medium text-ink-900 truncate">{n.sujet || n.contenu}</span>
                      </span>
                      {n.sujet && <span className="text-xs text-ink-500 truncate w-full">{n.contenu}</span>}
                      <span className="text-xs text-ink-400">{formatDateTime(n.createdAt)}</span>
                    </button>
                  )
                })
              )}
            </div>
          )}
        </div>

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2.5 rounded-lg py-1.5 pl-1.5 pr-2 hover:bg-ink-100 transition-colors"
          >
            <Avatar name={displayName} src={user?.photoUrl} />
            <span className="text-left hidden sm:block">
              <span className="block text-sm font-medium text-ink-900 leading-tight">
                {displayName}
              </span>
              <span className="block text-xs text-ink-500 leading-tight">
                {roleLabel}
              </span>
            </span>
            <ChevronDown className="h-4 w-4 text-ink-400" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-2 w-44 bg-white rounded-xl border border-ink-100 shadow-lg shadow-ink-900/5 py-1.5 z-20">
              <Link
                to="profil"
                onClick={() => setMenuOpen(false)}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-ink-700 hover:bg-ink-50 transition-colors"
              >
                <User className="h-4 w-4" />
                Mon profil
              </Link>
              <button
                type="button"
                onClick={logout}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-danger-600 hover:bg-danger-50 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Déconnexion
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
