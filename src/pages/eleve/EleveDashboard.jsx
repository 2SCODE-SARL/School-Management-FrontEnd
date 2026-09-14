import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Cake, CalendarClock, FileEdit, GraduationCap, MapPin, School, User, Users } from 'lucide-react'
import { getClasseCourante, getEmploiDuTemps, getNotes, getProfil } from '../../api/portailEleve'
import { Avatar } from '../../components/ui/Avatar'
import { Badge } from '../../components/ui/Badge'
import { InfoRow } from '../../components/ui/InfoRow'
import { WelcomeBanner } from '../../components/ui/WelcomeBanner'
import { DashboardListCard } from '../../components/ui/DashboardListCard'
import { NIVEAU_LABELS } from '../../config/academiqueLabels'
import { SEXE_LABELS, STATUT_ELEVE_LABELS, statutEleveBadgeVariant } from '../../config/eleveLabels'
import { coursStatutBadgeVariant } from '../../config/emploiDuTempsLabels'
import { ELEVE_COURS_ETAT_LABELS } from '../../config/portailEleveLabels'
import { formatDate } from '../../lib/formatDate'

const JOURS_COURTS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']

/** "Mon dossier" — profil académique de l'élève + sa classe de l'année en cours. */
export default function EleveDashboard() {
  const navigate = useNavigate()

  const { data: profil, isLoading: isLoadingProfil, isError: isErrorProfil } = useQuery({
    queryKey: ['portail-eleve', 'profil'],
    queryFn: getProfil,
  })
  const { data: classeCourante, isLoading: isLoadingClasse } = useQuery({
    queryKey: ['portail-eleve', 'classe'],
    queryFn: getClasseCourante,
  })
  // Aperçu "Dernières notes" — même endpoint que l'onglet Résultats.
  const { data: notesData, isLoading: isLoadingNotes } = useQuery({
    queryKey: ['portail-eleve', 'notes'],
    queryFn: getNotes,
  })
  const notes = (Array.isArray(notesData) ? notesData : [])
    .slice()
    .sort((a, b) => (b.examen?.date ?? '').localeCompare(a.examen?.date ?? ''))

  // Aperçu "Aujourd'hui" — même endpoint que l'onglet Emploi du temps,
  // filtré sur le jour courant (`jourSemaine` : 0=dimanche, comme Date.getDay()).
  const { data: emploiData, isLoading: isLoadingEmploi } = useQuery({
    queryKey: ['portail-eleve', 'emploi-du-temps'],
    queryFn: getEmploiDuTemps,
  })
  const aujourdhui = new Date().getDay()
  const coursAujourdhui = (Array.isArray(emploiData) ? emploiData : [])
    .filter((c) => c.jourSemaine === aujourdhui)
    .sort((a, b) => (a.heureDebut ?? '').localeCompare(b.heureDebut ?? ''))

  if (isLoadingProfil) {
    return (
      <div className="p-16 flex justify-center bg-white rounded-2xl border border-ink-100">
        <div className="h-8 w-8 rounded-full border-2 border-ink-200 border-t-primary-600 animate-spin" />
      </div>
    )
  }

  if (isErrorProfil || !profil) {
    return (
      <p className="p-8 text-center text-sm text-danger-600 bg-white rounded-2xl border border-ink-100">
        Impossible de charger ton dossier.
      </p>
    )
  }

  const classe = classeCourante?.classe
  const anneeScolaire = classeCourante?.anneeScolaire

  return (
    <div>
      <WelcomeBanner name={profil.prenom} subtitle="Consulte ton dossier, tes notes et ton emploi du temps." />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-ink-100 p-5">
            <div className="flex items-center gap-4 mb-4">
              <Avatar name={`${profil.prenom} ${profil.nom}`} src={profil.photoUrl} size={56} />
              <div className="min-w-0 flex-1">
                <p className="font-heading font-bold text-lg text-ink-900 truncate">
                  {profil.prenom} {profil.nom}
                </p>
                <p className="text-sm text-ink-400">{profil.matricule}</p>
              </div>
              <Badge variant={statutEleveBadgeVariant(profil.statut)} className="shrink-0">
                {STATUT_ELEVE_LABELS[profil.statut] ?? profil.statut}
              </Badge>
            </div>
            <div>
              <InfoRow icon={School} label="Établissement" value={profil.etablissement?.nom} />
              <InfoRow icon={Cake} label="Date de naissance" value={formatDate(profil.dateNaissance)} />
              <InfoRow icon={MapPin} label="Lieu de naissance" value={profil.lieuNaissance} />
              <InfoRow icon={User} label="Sexe" value={SEXE_LABELS[profil.sexe] ?? profil.sexe} />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-ink-100 p-5">
            <p className="font-heading font-semibold text-ink-900 mb-4">Classe actuelle</p>
            {isLoadingClasse ? (
              <div className="p-6 flex justify-center">
                <div className="h-6 w-6 rounded-full border-2 border-ink-200 border-t-primary-600 animate-spin" />
              </div>
            ) : !classe ? (
              <p className="text-sm text-ink-400">Aucune classe affectée pour l'instant.</p>
            ) : (
              <div>
                <InfoRow icon={GraduationCap} label="Classe" value={`${classe.nom} (${NIVEAU_LABELS[classe.niveau?.libelle] ?? classe.niveau?.libelle ?? ''})`} />
                {classe.serie && <InfoRow icon={GraduationCap} label="Série" value={classe.serie.libelle} />}
                {classe.professeurPrincipal && (
                  <InfoRow
                    icon={Users}
                    label="Professeur principal"
                    value={`${classe.professeurPrincipal.prenom} ${classe.professeurPrincipal.nom}`}
                  />
                )}
                <InfoRow icon={GraduationCap} label="Année scolaire" value={anneeScolaire?.libelle} />
              </div>
            )}
          </div>

          {/* Aperçu de liste — le détail complet est à un clic */}
          <DashboardListCard
            title={`Emploi du temps — ${JOURS_COURTS[aujourdhui]}`}
            total={coursAujourdhui.length}
            items={coursAujourdhui}
            isLoading={isLoadingEmploi}
            onSeeAll={() => navigate('/eleve/emplois-du-temps')}
            emptyMessage="Aucun cours prévu aujourd'hui."
            renderItem={(c) => (
              <div key={c.id} className="flex items-center justify-between gap-3 px-5 py-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <CalendarClock className="h-4 w-4 text-ink-400 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink-900 truncate">{c.matiere?.intitule}</p>
                    <p className="text-xs text-ink-400 truncate">
                      {c.heureDebut}–{c.heureFin} · Salle {c.salle?.numero ?? '—'}
                    </p>
                  </div>
                </div>
                {c.etat && c.etat !== 'PLANIFIE' && (
                  <Badge variant={coursStatutBadgeVariant(c.etat)} className="shrink-0">
                    {ELEVE_COURS_ETAT_LABELS[c.etat] ?? c.etat}
                  </Badge>
                )}
              </div>
            )}
          />
        </div>

        {/* Aperçu de liste — le détail complet est à un clic */}
        <DashboardListCard
          title="Dernières notes"
          total={notes.length}
          items={notes.slice(0, 6)}
          isLoading={isLoadingNotes}
          onSeeAll={() => navigate('/eleve/resultats', { state: { tab: 'notes' } })}
          emptyMessage="Aucune note publiée pour l'instant."
          renderItem={(n) => (
            <div key={n.id} className="flex items-center justify-between gap-3 px-5 py-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <FileEdit className="h-4 w-4 text-ink-400 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink-900 truncate">{n.examen?.intitule}</p>
                  <p className="text-xs text-ink-400 truncate">{n.examen?.matiere?.intitule}</p>
                </div>
              </div>
              <span className="text-sm font-semibold text-ink-900 shrink-0">
                {n.valeur}/{n.bareme === 'SUR_10' ? '10' : '20'}
              </span>
            </div>
          )}
        />
      </div>
    </div>
  )
}
