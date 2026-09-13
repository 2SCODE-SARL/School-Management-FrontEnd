import { useQuery } from '@tanstack/react-query'
import { CalendarClock } from 'lucide-react'
import { getEmploiDuTemps } from '../../api/portailEleve'
import { Badge } from '../../components/ui/Badge'
import { JOUR_SEMAINE_LABELS, TYPE_ACTIVITE_LABELS, coursStatutBadgeVariant } from '../../config/emploiDuTempsLabels'
import { ELEVE_COURS_ETAT_LABELS } from '../../config/portailEleveLabels'

const JOUR_ORDER = [1, 2, 3, 4, 5, 6, 0] // Lundi -> Dimanche

export default function EmploiDuTempsPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['portail-eleve', 'emploi-du-temps'],
    queryFn: getEmploiDuTemps,
  })
  const cours = Array.isArray(data) ? data : []

  const parJour = JOUR_ORDER.map((jour) => ({
    jour,
    seances: cours
      .filter((c) => c.jourSemaine === jour)
      .sort((a, b) => (a.heureDebut ?? '').localeCompare(b.heureDebut ?? '')),
  }))

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-ink-900 mb-6">Emploi du temps</h1>

      {isLoading && (
        <div className="p-16 flex justify-center bg-white rounded-2xl border border-ink-100">
          <div className="h-8 w-8 rounded-full border-2 border-ink-200 border-t-primary-600 animate-spin" />
        </div>
      )}
      {isError && (
        <p className="p-8 text-center text-sm text-danger-600 bg-white rounded-2xl border border-ink-100">
          Impossible de charger l'emploi du temps.
        </p>
      )}

      {!isLoading && !isError && cours.length === 0 && (
        <div className="p-16 text-center text-ink-400 bg-white rounded-2xl border border-dashed border-ink-200">
          <CalendarClock className="h-8 w-8 mx-auto mb-3 opacity-50" />
          Aucun cours planifié pour l'instant.
        </div>
      )}

      {!isLoading && !isError && cours.length > 0 && (
        <div className="space-y-4">
          {parJour
            .filter((j) => j.seances.length > 0)
            .map(({ jour, seances }) => (
              <div key={jour} className="bg-white rounded-2xl border border-ink-100 overflow-hidden">
                <div className="px-4 py-2.5 bg-ink-50 border-b border-ink-100">
                  <p className="text-sm font-semibold text-ink-900">{JOUR_SEMAINE_LABELS[jour]}</p>
                </div>
                <div className="divide-y divide-ink-50">
                  {seances.map((c) => (
                    <div key={c.id} className="flex items-center justify-between gap-3 px-4 py-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-ink-900 truncate">{c.matiere?.intitule}</p>
                        <p className="text-xs text-ink-400 truncate">
                          {c.heureDebut}–{c.heureFin} · {c.enseignant?.prenom} {c.enseignant?.nom} · Salle {c.salle?.numero}
                          {c.typeActivite !== 'COURS' && ` · ${TYPE_ACTIVITE_LABELS[c.typeActivite] ?? c.typeActivite}`}
                        </p>
                      </div>
                      {c.etat && c.etat !== 'PLANIFIE' && (
                        <Badge variant={coursStatutBadgeVariant(c.etat)} className="shrink-0">
                          {ELEVE_COURS_ETAT_LABELS[c.etat] ?? c.etat}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  )
}
