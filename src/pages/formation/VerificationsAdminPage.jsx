import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ShieldCheck } from 'lucide-react'
import { listProviderVerificationsAdmin } from '../../api/training'
import { ApiErrorMessage } from '../../components/ui/ApiErrorMessage'
import { Badge } from '../../components/ui/Badge'
import { Select } from '../../components/ui/Select'
import { TRAINING_VERIFICATION_STATUS_LABELS, trainingVerificationBadgeVariant } from '../../config/trainingLabels'
import { VerificationDetailAdminModal } from './VerificationDetailAdminModal'

const STATUS_OPTIONS = [
  { value: '', label: 'Tous les statuts' },
  { value: 'SUBMITTED', label: 'Soumis, en attente de revue' },
  { value: 'UNDER_REVIEW', label: 'En cours de revue' },
  { value: 'APPROVED', label: 'Vérifiés' },
  { value: 'REJECTED', label: 'Rejetés' },
  { value: 'DRAFT', label: 'Brouillons' },
]

/**
 * Revue des dossiers de vérification (KYC) des prestataires de formation —
 * Admin uniquement. Champs de la réponse lus défensivement, aucun schéma
 * typé côté API pour cette liste.
 */
export default function VerificationsAdminPage() {
  const [status, setStatus] = useState('SUBMITTED')
  const [openVerificationId, setOpenVerificationId] = useState(null)

  const queryKey = ['training', 'provider-verifications', 'admin', 'list', status]
  const { data, isLoading, isError, error } = useQuery({
    queryKey,
    queryFn: () => listProviderVerificationsAdmin({ status: status || undefined }),
  })
  const items = Array.isArray(data) ? data : (data?.items ?? [])

  return (
    <div>
      <p className="text-sm font-medium text-ink-400 mb-1">Formation</p>
      <h1 className="font-heading text-2xl font-bold text-ink-900 mb-1">Vérifications prestataires</h1>
      <p className="text-sm text-ink-500 mb-6">
        Dossiers de vérification (KYC) soumis par les formateurs et organismes de formation.
      </p>

      <div className="mb-4 max-w-xs">
        <Select id="status-filter" options={STATUS_OPTIONS} value={status} onChange={(e) => setStatus(e.target.value)} />
      </div>

      <div className="bg-white rounded-2xl border border-ink-100 overflow-hidden">
        {isLoading ? (
          <div className="p-12 flex justify-center">
            <div className="h-8 w-8 rounded-full border-2 border-ink-200 border-t-primary-600 animate-spin" />
          </div>
        ) : isError ? (
          <ApiErrorMessage error={error} fallback="Impossible de charger les dossiers." className="p-8 text-center text-sm text-danger-600" />
        ) : items.length === 0 ? (
          <div className="p-12 text-center text-ink-400">
            <ShieldCheck className="h-8 w-8 mx-auto mb-3 opacity-50" />
            Aucun dossier pour ce filtre.
          </div>
        ) : (
          <div className="divide-y divide-ink-100">
            {items.map((item) => {
              const provider = item.provider ?? {}
              const isOrg = provider.type === 'ORGANIZATION' || Boolean(provider.organizationProfile)
              const profile = isOrg ? provider.organizationProfile : provider.trainerProfile
              const name = isOrg
                ? (profile?.denomination ?? item.providerName ?? 'Organisme')
                : (profile?.publicName || item.providerName || 'Formateur individuel')
              const itemStatus = item.status ?? item.verificationStatus
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setOpenVerificationId(item.id)}
                  className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-ink-50 transition-colors"
                >
                  <span className="text-sm font-medium text-ink-900 truncate">{name}</span>
                  {itemStatus && (
                    <Badge variant={trainingVerificationBadgeVariant(itemStatus)}>
                      {TRAINING_VERIFICATION_STATUS_LABELS[itemStatus] ?? itemStatus}
                    </Badge>
                  )}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {openVerificationId && (
        <VerificationDetailAdminModal
          verificationId={openVerificationId}
          listQueryKey={queryKey}
          onClose={() => setOpenVerificationId(null)}
        />
      )}
    </div>
  )
}
