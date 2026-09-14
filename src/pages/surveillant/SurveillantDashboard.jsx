import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Bell, LogIn } from 'lucide-react'
import { listAccesParDate, listAlertes } from '../../api/presences'
import { useAuth } from '../../auth/AuthContext'
import { WelcomeBanner } from '../../components/ui/WelcomeBanner'
import { DashboardListCard } from '../../components/ui/DashboardListCard'
import { Badge } from '../../components/ui/Badge'
import { ACCES_TYPE_LABELS, ALERTE_NIVEAU_LABELS, alerteNiveauBadgeVariant } from '../../config/presencesLabels'
import { formatDateTime } from '../../lib/formatDate'

const today = () => new Date().toISOString().slice(0, 10)

export default function SurveillantDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const etablissementId = user?.etablissementId

  function goTo(tab) {
    navigate('/surveillant/presences', { state: { tab } })
  }

  const { data: accesData, isLoading: isLoadingAcces } = useQuery({
    queryKey: ['presences', 'acces', etablissementId, today()],
    queryFn: () => listAccesParDate(etablissementId, today()),
    enabled: Boolean(etablissementId),
  })
  const acces = (Array.isArray(accesData) ? accesData : (accesData?.items ?? []))
    .slice()
    .sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''))

  const { data: alertesData, isLoading: isLoadingAlertes } = useQuery({
    queryKey: ['presences', 'alertes', etablissementId, { lue: false }],
    queryFn: () => listAlertes(etablissementId, { lue: false }),
    enabled: Boolean(etablissementId),
  })
  const alertes = Array.isArray(alertesData) ? alertesData : (alertesData?.items ?? [])

  return (
    <div>
      <WelcomeBanner name={user?.prenom} subtitle="Entrées/sorties et alertes du jour." />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DashboardListCard
          title="Derniers passages"
          total={acces.length}
          items={acces.slice(0, 6)}
          isLoading={isLoadingAcces}
          onSeeAll={() => goTo('acces')}
          emptyMessage="Aucun passage enregistré aujourd'hui."
          renderItem={(a, i) => (
            <div key={a.id ?? i} className="flex items-center justify-between gap-3 px-5 py-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <LogIn className="h-4 w-4 text-ink-400 shrink-0" />
                <span className="text-sm text-ink-800 truncate">
                  {a.eleve ? `${a.eleve.prenom ?? ''} ${a.eleve.nom ?? ''}`.trim() : '—'}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge variant={a.type === 'ENTREE' ? 'success' : 'neutral'}>{ACCES_TYPE_LABELS[a.type] ?? a.type}</Badge>
                <span className="text-xs text-ink-400">{formatDateTime(a.createdAt ?? a.dateHeure) ?? '—'}</span>
              </div>
            </div>
          )}
        />

        <DashboardListCard
          title="Alertes non lues"
          total={alertes.length}
          items={alertes.slice(0, 6)}
          isLoading={isLoadingAlertes}
          onSeeAll={() => goTo('alertes')}
          emptyMessage="Aucune alerte non lue."
          renderItem={(a, i) => (
            <div key={a.id ?? i} className="flex items-start gap-3 px-5 py-3">
              <Bell className="h-4 w-4 text-ink-400 shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <Badge variant={alerteNiveauBadgeVariant(a.niveau)} className="mb-1">
                  {ALERTE_NIVEAU_LABELS[a.niveau] ?? a.niveau ?? 'Info'}
                </Badge>
                <p className="text-sm text-ink-800 truncate">{a.message}</p>
              </div>
            </div>
          )}
        />
      </div>
    </div>
  )
}
