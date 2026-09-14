import { useQuery } from '@tanstack/react-query'
import { Cake, GraduationCap, MapPin, School, User, Users } from 'lucide-react'
import { getClasseCourante, getProfil } from '../../api/portailEleve'
import { Avatar } from '../../components/ui/Avatar'
import { Badge } from '../../components/ui/Badge'
import { InfoRow } from '../../components/ui/InfoRow'
import { WelcomeBanner } from '../../components/ui/WelcomeBanner'
import { NIVEAU_LABELS } from '../../config/academiqueLabels'
import { SEXE_LABELS, STATUT_ELEVE_LABELS, statutEleveBadgeVariant } from '../../config/eleveLabels'
import { formatDate } from '../../lib/formatDate'

/** "Mon dossier" — profil académique de l'élève + sa classe de l'année en cours. */
export default function EleveDashboard() {
  const { data: profil, isLoading: isLoadingProfil, isError: isErrorProfil } = useQuery({
    queryKey: ['portail-eleve', 'profil'],
    queryFn: getProfil,
  })
  const { data: classeCourante, isLoading: isLoadingClasse } = useQuery({
    queryKey: ['portail-eleve', 'classe'],
    queryFn: getClasseCourante,
  })

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

      <div className="bg-white rounded-2xl border border-ink-100 p-5 mb-6">
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
    </div>
  )
}
