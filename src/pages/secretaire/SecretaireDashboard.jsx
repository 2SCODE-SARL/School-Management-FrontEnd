import { useNavigate } from 'react-router-dom'
import { useQueries, useQuery } from '@tanstack/react-query'
import { ClipboardList, GraduationCap, IdCard, KeyRound } from 'lucide-react'
import { searchEleves } from '../../api/eleves'
import { listInscriptions } from '../../api/inscriptions'
import { listAnneesScolaires } from '../../api/etablissements'
import { searchEmployes } from '../../api/rh'
import { useAuth } from '../../auth/AuthContext'
import { StatTile } from '../../components/ui/StatTile'
import { WelcomeBanner } from '../../components/ui/WelcomeBanner'
import { DashboardListCard } from '../../components/ui/DashboardListCard'
import { Badge } from '../../components/ui/Badge'
import {
  INSCRIPTION_STATUT_LABELS,
  INSCRIPTION_STATUT_OPTIONS,
  inscriptionStatutBadgeVariant,
} from '../../config/eleveLabels'
import { formatDate } from '../../lib/formatDate'

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

  // Aperçu "Dernières inscriptions soumises" — réutilise l'appel déjà fait
  // pour la répartition par statut (index 1 = 'SOUMISE'), pas de requête
  // supplémentaire.
  const soumisesIndex = INSCRIPTION_STATUT_OPTIONS.findIndex((o) => o.value === 'SOUMISE')
  const soumisesData = inscriptionsQueries[soumisesIndex]?.data
  const inscriptionsSoumises = (Array.isArray(soumisesData) ? soumisesData : (soumisesData?.items ?? []))
    .slice()
    .sort((a, b) => (b.dateInscription ?? b.createdAt ?? '').localeCompare(a.dateInscription ?? a.createdAt ?? ''))

  const isLoading = isLoadingEleves || isLoadingEmployes

  return (
    <div>
      <WelcomeBanner name={user?.prenom} subtitle="Élèves, inscriptions, employés et documents de l'établissement." />

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

        <DashboardListCard
          title="Dernières inscriptions soumises"
          total={inscriptionsSoumises.length}
          items={inscriptionsSoumises.slice(0, 5)}
          isLoading={isLoadingInscriptions}
          onSeeAll={() => goTo('/secretaire/eleves', 'inscriptions')}
          emptyMessage="Aucune inscription soumise pour l'instant."
          renderItem={(item) => {
            const eleve = item.eleve ?? {}
            return (
              <div key={item.id} className="flex items-center justify-between gap-3 px-5 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink-900 truncate">
                    {`${eleve.prenom ?? ''} ${eleve.nom ?? ''}`.trim() || '—'}
                  </p>
                  <p className="text-xs text-ink-400">{formatDate(item.dateInscription ?? item.createdAt) ?? '—'}</p>
                </div>
                <Badge variant={inscriptionStatutBadgeVariant(item.statut)} className="shrink-0">
                  {INSCRIPTION_STATUT_LABELS[item.statut] ?? item.statut}
                </Badge>
              </div>
            )
          }}
        />
      </div>
    </div>
  )
}
