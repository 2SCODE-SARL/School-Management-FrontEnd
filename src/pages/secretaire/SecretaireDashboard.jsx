import { useNavigate } from 'react-router-dom'
import { useQueries, useQuery } from '@tanstack/react-query'
import { ClipboardList, GraduationCap, IdCard, KeyRound } from 'lucide-react'
import { searchEleves } from '../../api/eleves'
import { listInscriptions } from '../../api/inscriptions'
import { listAnneesScolaires } from '../../api/etablissements'
import { searchEmployes } from '../../api/rh'
import { useAuth } from '../../auth/AuthContext'
import { StatTile } from '../../components/ui/StatTile'
import { INSCRIPTION_STATUT_LABELS, INSCRIPTION_STATUT_OPTIONS } from '../../config/eleveLabels'

/**
 * Pas de tableau de bord dédié côté API pour ce rôle (seuls
 * general/directeur/comptable/enseignant/parent existent) — vue calculée
 * côté client à partir de ce que le Secrétaire peut déjà consulter.
 */
export default function SecretaireDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const etablissementId = user?.etablissementId

  function goTo(path, tab) {
    navigate(path, { state: { tab } })
  }

  const { data: elevesData, isLoading: isLoadingEleves } = useQuery({
    queryKey: ['eleves', 'list', etablissementId, { q: '', statut: undefined, page: 1 }],
    queryFn: () => searchEleves(etablissementId, { limit: 1 }),
    enabled: Boolean(etablissementId),
  })

  const { data: employesData, isLoading: isLoadingEmployes } = useQuery({
    queryKey: ['rh', 'employes', etablissementId, { q: '', type: '' }],
    queryFn: () => searchEmployes(etablissementId, {}),
    enabled: Boolean(etablissementId),
  })
  const employes = Array.isArray(employesData) ? employesData : (employesData?.items ?? [])
  const sansCompte = employes.filter((e) => !e.utilisateurId).length

  const { data: anneesData, isLoading: isLoadingAnnees, isError: isErrorAnnees } = useQuery({
    queryKey: ['academique', 'annees', etablissementId],
    queryFn: () => listAnneesScolaires(etablissementId),
    enabled: Boolean(etablissementId),
    retry: false,
  })
  const annees = Array.isArray(anneesData) ? anneesData : (anneesData?.items ?? [])
  const anneeEnCours =
    annees.find((a) => a.statut === 'EN_COURS') ??
    annees.slice().sort((a, b) => (b.dateDebut ?? '').localeCompare(a.dateDebut ?? ''))[0]

  // `statut` est obligatoire côté API (pas de "tous statuts") — on
  // interroge les 5 valeurs en parallèle pour construire la répartition.
  const inscriptionsQueries = useQueries({
    queries: INSCRIPTION_STATUT_OPTIONS.map(({ value: statut }) => ({
      queryKey: ['inscriptions', 'list', etablissementId, anneeEnCours?.id, statut],
      queryFn: () => listInscriptions(etablissementId, { anneeScolaireId: anneeEnCours.id, statut }),
      enabled: Boolean(etablissementId && anneeEnCours?.id),
    })),
  })
  const inscriptionsParStatut = INSCRIPTION_STATUT_OPTIONS.map(({ value: statut }, i) => {
    const data = inscriptionsQueries[i]?.data
    const items = Array.isArray(data) ? data : (data?.items ?? [])
    return { statut, count: items.length }
  })
  const totalInscriptions = inscriptionsParStatut.reduce((sum, s) => sum + s.count, 0)
  const isLoadingInscriptions = isLoadingAnnees || inscriptionsQueries.some((q) => q.isLoading)

  const isLoading = isLoadingEleves || isLoadingEmployes

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-ink-900 mb-1">Tableau de bord</h1>
      <p className="text-sm text-ink-500 mb-6">
        Élèves, inscriptions, employés et documents de l'établissement.
      </p>

      {isLoading ? (
        <div className="p-16 flex justify-center bg-white rounded-2xl border border-ink-100">
          <div className="h-8 w-8 rounded-full border-2 border-ink-200 border-t-primary-600 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatTile icon={GraduationCap} label="Élèves" value={elevesData?.total ?? 0} onClick={() => goTo('/secretaire/eleves', 'eleves')} />
          <StatTile
            icon={ClipboardList}
            label="Inscriptions (année en cours)"
            value={isErrorAnnees ? '—' : (isLoadingInscriptions ? '…' : totalInscriptions)}
            hint={isErrorAnnees ? 'Accès aux années scolaires refusé' : undefined}
            onClick={isErrorAnnees ? undefined : () => goTo('/secretaire/eleves', 'inscriptions')}
          />
          <StatTile icon={IdCard} label="Employés" value={employes.length} onClick={() => goTo('/secretaire/rh', 'employes')} />
          <StatTile
            icon={KeyRound}
            label="Employés sans compte"
            value={sansCompte}
            hint={sansCompte > 0 ? 'À provisionner dans Ressources humaines' : undefined}
            onClick={() => goTo('/secretaire/rh', 'employes')}
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-2xl border border-ink-100 p-5">
          <p className="font-heading font-semibold text-ink-900 mb-4">Inscriptions par statut</p>
          {isErrorAnnees ? (
            <p className="text-sm text-danger-600">
              Accès refusé aux années scolaires — impossible d'afficher les
              inscriptions pour ce rôle actuellement.
            </p>
          ) : !anneeEnCours ? (
            <p className="text-sm text-ink-400">Aucune année scolaire configurée.</p>
          ) : (
            <div className="space-y-2">
              {inscriptionsParStatut.map(({ statut, count }) => (
                <div key={statut} className="flex items-center justify-between text-sm">
                  <span className="text-ink-600">{INSCRIPTION_STATUT_LABELS[statut]}</span>
                  <span className="font-medium text-ink-900">{count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-ink-100 p-5">
          <p className="font-heading font-semibold text-ink-900 mb-4">Accès rapides</p>
          <ul className="text-sm text-ink-600 space-y-1.5 list-disc list-inside">
            <li>Préinscrire ou réinscrire un élève dans "Élèves & Inscriptions"</li>
            <li>Créer une fiche employé ou provisionner un compte dans "Ressources humaines"</li>
            <li>Suivre les demandes des parents et documents dans "Demandes"</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
