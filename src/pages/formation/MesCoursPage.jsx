import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { BookOpen, Plus } from 'lucide-react'
import {
  createTrainingProduct,
  listMyTrainingProducts,
  listMyTrainingProviders,
  listTrainingCountries,
  listTrainingCurrencies,
  listTrainingLanguages,
} from '../../api/training'
import { ApiErrorMessage } from '../../components/ui/ApiErrorMessage'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { useToast } from '../../components/ui/ToastContext'
import {
  TRAINING_PRODUCT_STATUS_LABELS,
  TRAINING_PRODUCT_TYPE_LABELS,
  trainingProductStatusBadgeVariant,
} from '../../config/trainingLabels'
import { CreateProductForm } from './CreateProductForm'

function providerName(provider) {
  const isOrg = provider.type === 'ORGANIZATION'
  const profile = isOrg ? provider.organizationProfile : provider.trainerProfile
  return isOrg ? (profile?.denomination ?? 'Organisme') : (profile?.publicName || 'Formateur individuel')
}

/**
 * Cours (produits de formation) créés par mes prestataires vérifiés —
 * accessible à tous les rôles, comme le reste du module Formation.
 */
export default function MesCoursPage() {
  const [isCreateOpen, setCreateOpen] = useState(false)
  const queryClient = useQueryClient()
  const { showToast } = useToast()

  const providersQuery = useQuery({
    queryKey: ['training', 'providers', 'mine'],
    queryFn: listMyTrainingProviders,
  })
  const providers = Array.isArray(providersQuery.data) ? providersQuery.data : (providersQuery.data?.items ?? [])
  const verifiedProviders = providers.filter((p) => p.verificationStatus === 'VERIFIED')
  const providerOptions = verifiedProviders.map((p) => ({ value: p.id, label: providerName(p) }))

  const countriesQuery = useQuery({
    queryKey: ['training', 'referentiels', 'countries'],
    queryFn: listTrainingCountries,
  })
  const countryOptions = (
    Array.isArray(countriesQuery.data) ? countriesQuery.data : (countriesQuery.data?.items ?? [])
  ).map((c) => ({ value: c.id, label: c.nom }))

  const languagesQuery = useQuery({
    queryKey: ['training', 'referentiels', 'languages'],
    queryFn: listTrainingLanguages,
  })
  const languageOptions = (
    Array.isArray(languagesQuery.data) ? languagesQuery.data : (languagesQuery.data?.items ?? [])
  ).map((l) => ({ value: l.id, label: l.libelle }))

  const currenciesQuery = useQuery({
    queryKey: ['training', 'referentiels', 'currencies'],
    queryFn: listTrainingCurrencies,
  })
  const currencyOptions = (
    Array.isArray(currenciesQuery.data) ? currenciesQuery.data : (currenciesQuery.data?.items ?? [])
  ).map((c) => ({ value: c.id, label: `${c.libelle} (${c.code})` }))

  const productsQuery = useQuery({
    queryKey: ['training', 'products', 'mine'],
    queryFn: () => listMyTrainingProducts(),
  })
  const products = Array.isArray(productsQuery.data) ? productsQuery.data : (productsQuery.data?.items ?? [])

  const createMutation = useMutation({
    mutationFn: createTrainingProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['training', 'products', 'mine'] })
      setCreateOpen(false)
      showToast('Cours créé avec succès')
    },
  })

  const referentielsReady = countryOptions.length > 0 && languageOptions.length > 0 && currencyOptions.length > 0

  return (
    <div>
      <p className="text-sm font-medium text-ink-400 mb-1">Formation</p>
      <h1 className="font-heading text-2xl font-bold text-ink-900 mb-1">Mes cours</h1>
      <p className="text-sm text-ink-500 mb-6">Formations créées par tes profils formateur vérifiés.</p>

      {providersQuery.isSuccess && verifiedProviders.length === 0 && (
        <div className="mb-6 rounded-2xl border border-warning-200 bg-warning-50 p-4 text-sm text-warning-700">
          Aucun de tes profils formateur n'est encore vérifié — va dans "Espace formateur" pour soumettre ton dossier
          de vérification avant de pouvoir créer un cours.
        </div>
      )}
      {!referentielsReady && providersQuery.isSuccess && verifiedProviders.length > 0 && (
        <div className="mb-6 rounded-2xl border border-warning-200 bg-warning-50 p-4 text-sm text-warning-700">
          Il manque un pays, une langue ou une devise dans les référentiels Formation — un administrateur doit
          d'abord en ajouter.
        </div>
      )}

      <div className="flex justify-end mb-4">
        <Button onClick={() => setCreateOpen(true)} disabled={verifiedProviders.length === 0 || !referentielsReady}>
          <Plus className="h-4 w-4" />
          Nouveau cours
        </Button>
      </div>

      <div className="bg-white rounded-2xl border border-ink-100 overflow-hidden">
        {productsQuery.isLoading ? (
          <div className="p-12 flex justify-center">
            <div className="h-8 w-8 rounded-full border-2 border-ink-200 border-t-primary-600 animate-spin" />
          </div>
        ) : productsQuery.isError ? (
          <ApiErrorMessage
            error={productsQuery.error}
            fallback="Impossible de charger tes cours."
            className="p-8 text-center text-sm text-danger-600"
          />
        ) : products.length === 0 ? (
          <div className="p-12 text-center text-ink-400">
            <BookOpen className="h-8 w-8 mx-auto mb-3 opacity-50" />
            Aucun cours créé pour le moment.
          </div>
        ) : (
          <div className="divide-y divide-ink-100">
            {products.map((product) => (
              <div key={product.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink-900 truncate">{product.titre}</p>
                  <p className="text-xs text-ink-400 truncate">
                    {TRAINING_PRODUCT_TYPE_LABELS[product.type] ?? product.type}
                  </p>
                </div>
                {product.publicationStatus && (
                  <Badge variant={trainingProductStatusBadgeVariant(product.publicationStatus)} className="shrink-0">
                    {TRAINING_PRODUCT_STATUS_LABELS[product.publicationStatus] ?? product.publicationStatus}
                  </Badge>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal open={isCreateOpen} onClose={() => setCreateOpen(false)} title="Créer un cours">
        <CreateProductForm
          providerOptions={providerOptions}
          countryOptions={countryOptions}
          languageOptions={languageOptions}
          currencyOptions={currencyOptions}
          isSubmitting={createMutation.isPending}
          onCancel={() => setCreateOpen(false)}
          onSubmit={(data) => createMutation.mutateAsync(data)}
        />
      </Modal>
    </div>
  )
}
