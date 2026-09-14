import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { AlertTriangle, CalendarClock, ClipboardCheck, GraduationCap, UserX } from 'lucide-react'
import { getEnseignantDashboard } from '../../api/dashboard'
import { listReclamations } from '../../api/resultats'
import { useAuth } from '../../auth/AuthContext'
import { StatTile } from '../../components/ui/StatTile'
import { WelcomeBanner } from '../../components/ui/WelcomeBanner'
import { DashboardListCard } from '../../components/ui/DashboardListCard'
import { Badge } from '../../components/ui/Badge'
import { RECLAMATION_STATUT_LABELS, reclamationStatutBadgeVariant } from '../../config/resultatsLabels'

export default function EnseignantDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const etablissementId = user?.etablissementId

  const { data, isLoading, isError } = useQuery({
    queryKey: ['dashboard', 'enseignant', etablissementId],
    queryFn: () => getEnseignantDashboard(etablissementId),
    enabled: Boolean(etablissementId),
  })

  // Aperçu "Réclamations à traiter" — scopé à l'enseignant côté backend
  // (voir ReclamationsTab.jsx), même endpoint que l'onglet dédié.
  const { data: reclamationsData, isLoading: isLoadingReclamations } = useQuery({
    queryKey: ['resultats', 'reclamations', etablissementId, 'EN_ATTENTE'],
    queryFn: () => listReclamations(etablissementId, 'EN_ATTENTE'),
    enabled: Boolean(etablissementId),
  })
  const reclamations = (Array.isArray(reclamationsData) ? reclamationsData : (reclamationsData?.items ?? []))
    .slice()
    .sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''))

  // Champs confirmés via un vrai payload (voir commentaire ci-dessous) —
  // ne correspondaient à aucun des noms devinés au départ.
  const classes = data?.classesAssignees ?? []
  const cours = data?.emploiDuTemps ?? []
  const aPointer = data?.aPointerAujourdhui ?? []
  const totalAbsences = data?.absences?.total ?? 0

  return (
    <div>
      <WelcomeBanner name={user?.prenom} subtitle="Retrouve tes classes, ton emploi du temps et les présences à pointer." />

      {isLoading && (
        <div className="p-16 flex justify-center bg-white rounded-2xl border border-ink-100">
          <div className="h-8 w-8 rounded-full border-2 border-ink-200 border-t-primary-600 animate-spin" />
        </div>
      )}

      {isError && (
        <p className="p-8 text-center text-sm text-danger-600 bg-white rounded-2xl border border-ink-100">
          Impossible de charger ton tableau de bord.
        </p>
      )}

      {!isLoading && !isError && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatTile icon={GraduationCap} label="Mes classes" value={classes.length} />
            <StatTile icon={CalendarClock} label="Cours à venir" value={cours.length} />
            <StatTile
              icon={ClipboardCheck}
              label="À pointer aujourd'hui"
              value={aPointer.length}
              onClick={() => navigate('/enseignant/presences', { state: { tab: 'personnel' } })}
            />
            <StatTile
              icon={UserX}
              label="Absences (total)"
              value={totalAbsences}
              onClick={() => navigate('/enseignant/presences', { state: { tab: 'personnel' } })}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-ink-100 p-5">
              <p className="font-heading font-semibold text-ink-900 mb-4">Mes classes</p>
              {classes.length === 0 ? (
                <p className="text-sm text-ink-400">
                  Aucune classe assignée pour le moment — ça se fait depuis
                  Ressources humaines, en habilitant l'enseignant à une
                  matière, puis en l'affectant à une classe dans Académique.
                </p>
              ) : (
                <div className="space-y-2">
                  {classes.map((c) => (
                    <div
                      key={c.classeId}
                      className="flex items-center justify-between rounded-lg border border-ink-100 px-3 py-2.5 text-sm"
                    >
                      <span className="font-medium text-ink-900">{c.nom}</span>
                      <span className="text-ink-500">{c.matiere}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Aperçu de liste — le détail complet est à un clic */}
            <DashboardListCard
              title="Réclamations à traiter"
              total={reclamations.length}
              items={reclamations.slice(0, 5)}
              isLoading={isLoadingReclamations}
              onSeeAll={() => navigate('/enseignant/resultats', { state: { tab: 'reclamations' } })}
              emptyMessage="Aucune réclamation en attente."
              renderItem={(r, i) => (
                <div key={r.id ?? i} className="flex items-center justify-between gap-3 px-5 py-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <AlertTriangle className="h-4 w-4 text-ink-400 shrink-0" />
                    <p className="text-sm font-medium text-ink-900 truncate">{r.motif}</p>
                  </div>
                  <Badge variant={reclamationStatutBadgeVariant(r.statut)} className="shrink-0">
                    {RECLAMATION_STATUT_LABELS[r.statut] ?? r.statut}
                  </Badge>
                </div>
              )}
            />
          </div>
        </>
      )}
    </div>
  )
}
