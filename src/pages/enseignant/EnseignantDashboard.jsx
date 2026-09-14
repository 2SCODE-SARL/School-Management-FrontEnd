import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { CalendarClock, ClipboardCheck, GraduationCap, UserX } from 'lucide-react'
import { getEnseignantDashboard } from '../../api/dashboard'
import { useAuth } from '../../auth/AuthContext'
import { StatTile } from '../../components/ui/StatTile'
import { WelcomeBanner } from '../../components/ui/WelcomeBanner'

export default function EnseignantDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const { data, isLoading, isError } = useQuery({
    queryKey: ['dashboard', 'enseignant', user?.etablissementId],
    queryFn: () => getEnseignantDashboard(user.etablissementId),
    enabled: Boolean(user?.etablissementId),
  })

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

          <div className="bg-white rounded-2xl border border-dashed border-ink-200 p-10 text-center text-ink-400 mt-6">
            Le détail de l'emploi du temps et des présences à pointer
            arrivera ici, module par module.
          </div>
        </>
      )}
    </div>
  )
}
