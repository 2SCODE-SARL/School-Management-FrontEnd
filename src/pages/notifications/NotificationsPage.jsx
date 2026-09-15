import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Bell, BellOff } from 'lucide-react'
import { listMesNotifications, marquerNotificationLue } from '../../api/communication'
import { ApiErrorMessage } from '../../components/ui/ApiErrorMessage'
import { Badge } from '../../components/ui/Badge'
import { Pagination } from '../../components/ui/Pagination'
import { NOTIFICATION_STATUT_LABELS, notificationStatutBadgeVariant } from '../../config/communicationLabels'
import { formatDateTime } from '../../lib/formatDate'

/** "Mes notifications" en intégralité — accessible à tout rôle depuis la cloche du Topbar. */
export default function NotificationsPage() {
  const [page, setPage] = useState(1)
  const queryClient = useQueryClient()

  const queryKey = ['communication', 'notifications', 'mes-notifications', page]
  const { data, isLoading, isError, error } = useQuery({
    queryKey,
    queryFn: () => listMesNotifications({ page, limit: 20 }),
    placeholderData: (previous) => previous,
  })
  const notifications = Array.isArray(data) ? data : (data?.items ?? [])

  const marquerLueMutation = useMutation({
    mutationFn: (notificationId) => marquerNotificationLue(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communication', 'notifications'] })
    },
  })

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-ink-900 mb-1">Notifications</h1>
      <p className="text-sm text-ink-500 mb-6">Toutes les notifications reçues sur ton compte.</p>

      <div className="bg-white rounded-2xl border border-ink-100 overflow-hidden">
        {isLoading && (
          <div className="p-16 flex justify-center">
            <div className="h-8 w-8 rounded-full border-2 border-ink-200 border-t-primary-600 animate-spin" />
          </div>
        )}
        {isError && <ApiErrorMessage error={error} fallback="Impossible de charger tes notifications." />}
        {!isLoading && !isError && notifications.length === 0 && (
          <div className="p-16 text-center text-ink-400">
            <BellOff className="h-8 w-8 mx-auto mb-3 opacity-50" />
            Aucune notification pour l'instant.
          </div>
        )}
        {!isLoading && !isError && notifications.length > 0 && (
          <div className="divide-y divide-ink-50">
            {notifications.map((n) => {
              const nonLue = n.statut !== 'LUE'
              return (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => nonLue && marquerLueMutation.mutate(n.id)}
                  className={[
                    'flex w-full items-start gap-3 px-5 py-4 text-left transition-colors hover:bg-ink-50/60',
                    nonLue ? 'bg-primary-50/40' : '',
                  ].join(' ')}
                >
                  <div className="mt-1.5 shrink-0">
                    {nonLue ? (
                      <span className="block h-2 w-2 rounded-full bg-primary-600" />
                    ) : (
                      <Bell className="h-4 w-4 text-ink-300" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3 mb-0.5">
                      <p className={`text-sm truncate ${nonLue ? 'font-semibold text-ink-900' : 'font-medium text-ink-700'}`}>
                        {n.sujet || 'Notification'}
                      </p>
                      <Badge variant={notificationStatutBadgeVariant(n.statut)} className="shrink-0">
                        {NOTIFICATION_STATUT_LABELS[n.statut] ?? n.statut}
                      </Badge>
                    </div>
                    {n.contenu && <p className="text-sm text-ink-600 mb-1">{n.contenu}</p>}
                    <p className="text-xs text-ink-400">{formatDateTime(n.createdAt)}</p>
                  </div>
                </button>
              )
            })}
          </div>
        )}

        {data && !Array.isArray(data) && (
          <div className="px-4 pb-4">
            <Pagination page={data.page} totalPages={data.totalPages} total={data.total} onPageChange={setPage} />
          </div>
        )}
      </div>
    </div>
  )
}
