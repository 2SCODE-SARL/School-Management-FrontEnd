import { useQuery } from '@tanstack/react-query'
import { ClipboardCheck, IdCard, UserCheck, UserX, Users } from 'lucide-react'
import { listComptesEnAttente, searchEmployes } from '../../api/rh'
import { StatTile } from '../../components/ui/StatTile'
import { EMPLOYE_TYPE_LABELS } from '../../config/rhLabels'

/**
 * Vue d'ensemble RH — calculée côté client à partir des listes déjà
 * disponibles (pas d'endpoint de tableau de bord dédié au RH côté API).
 */
export function RhDashboardTab({ etablissementId, canViewComptesEnAttente }) {
  const { data: employesData, isLoading: isLoadingEmployes } = useQuery({
    queryKey: ['rh', 'employes', etablissementId, { q: '', type: '' }],
    queryFn: () => searchEmployes(etablissementId, {}),
    enabled: Boolean(etablissementId),
  })
  const employes = Array.isArray(employesData) ? employesData : (employesData?.items ?? [])

  // Le Secrétaire peut désormais consulter cette liste (mais pas valider) —
  // gardé conditionnel car ce n'est pas garanti pour tous les rôles futurs.
  const { data: enAttenteData, isLoading: isLoadingEnAttente } = useQuery({
    queryKey: ['rh', 'comptes-en-attente', etablissementId],
    queryFn: () => listComptesEnAttente(etablissementId),
    enabled: Boolean(etablissementId) && canViewComptesEnAttente,
  })
  const comptesEnAttente = Array.isArray(enAttenteData) ? enAttenteData : (enAttenteData?.items ?? [])

  const isLoading = isLoadingEmployes || (canViewComptesEnAttente && isLoadingEnAttente)
  const actifs = employes.filter((e) => e.actif !== false).length
  const inactifs = employes.length - actifs
  const avecCompte = employes.filter((e) => e.utilisateurId).length

  const parType = employes.reduce((acc, e) => {
    acc[e.type] = (acc[e.type] ?? 0) + 1
    return acc
  }, {})

  if (isLoading) {
    return (
      <div className="p-16 flex justify-center bg-white rounded-2xl border border-ink-100">
        <div className="h-8 w-8 rounded-full border-2 border-ink-200 border-t-primary-600 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile icon={Users} label="Employés" value={employes.length} />
        <StatTile icon={UserCheck} label="Actifs" value={actifs} />
        <StatTile icon={UserX} label="Inactifs" value={inactifs} />
        {canViewComptesEnAttente && (
          <StatTile
            icon={ClipboardCheck}
            label="Comptes en attente"
            value={comptesEnAttente.length}
            hint={comptesEnAttente.length > 0 ? 'À valider dans l\'onglet dédié' : undefined}
          />
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-ink-100 p-5">
          <p className="font-heading font-semibold text-ink-900 mb-4">Répartition par type</p>
          {employes.length === 0 ? (
            <p className="text-sm text-ink-400">Aucun employé pour le moment.</p>
          ) : (
            <div className="space-y-2">
              {Object.entries(parType).map(([type, count]) => (
                <div key={type} className="flex items-center justify-between text-sm">
                  <span className="text-ink-600">{EMPLOYE_TYPE_LABELS[type] ?? type}</span>
                  <span className="font-medium text-ink-900">{count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-ink-100 p-5">
          <p className="font-heading font-semibold text-ink-900 mb-4">Comptes de connexion</p>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-9 w-9 rounded-lg bg-primary-50 flex items-center justify-center shrink-0">
              <IdCard className="h-4 w-4 text-primary-600" />
            </div>
            <div>
              <p className="text-sm text-ink-900 font-medium">{avecCompte} employé(s) avec un compte lié</p>
              <p className="text-xs text-ink-400">
                sur {employes.length} au total — {employes.length - avecCompte} sans compte
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
