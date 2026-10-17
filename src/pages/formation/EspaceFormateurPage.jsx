import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Building2, GraduationCap, Plus, Store, User } from 'lucide-react'
import {
  createIndividualTrainingProvider,
  createOrganizationTrainingProvider,
  listMyTrainingProviders,
  listTrainingCountries,
  listTrainingLanguages,
} from '../../api/training'
import { ApiErrorMessage } from '../../components/ui/ApiErrorMessage'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { useToast } from '../../components/ui/ToastContext'
import { pick } from '../../lib/pick'
import { IndividualProviderForm } from './IndividualProviderForm'
import { OrganizationProviderForm } from './OrganizationProviderForm'

/**
 * Point d'entrée "formateur" du module Formation (marketplace de cours) —
 * accessible à n'importe quel compte connecté, tous rôles confondus (le
 * module a son propre système de rôles, indépendant des rôles scolaires).
 * Liste les profils prestataires déjà créés, et permet d'en créer un
 * nouveau (individuel ou organisme).
 */
export default function EspaceFormateurPage() {
  const [createMode, setCreateMode] = useState(null) // null | 'individual' | 'organization'
  const queryClient = useQueryClient()
  const { showToast } = useToast()

  const providersQuery = useQuery({
    queryKey: ['training', 'providers', 'mine'],
    queryFn: listMyTrainingProviders,
  })
  const providers = Array.isArray(providersQuery.data) ? providersQuery.data : (providersQuery.data?.items ?? [])

  const countriesQuery = useQuery({
    queryKey: ['training', 'referentiels', 'countries'],
    queryFn: listTrainingCountries,
  })
  const countries = Array.isArray(countriesQuery.data) ? countriesQuery.data : (countriesQuery.data?.items ?? [])
  const countryOptions = countries.map((c) => ({ value: c.id, label: c.nom }))

  const languagesQuery = useQuery({
    queryKey: ['training', 'referentiels', 'languages'],
    queryFn: listTrainingLanguages,
  })
  const languages = Array.isArray(languagesQuery.data) ? languagesQuery.data : (languagesQuery.data?.items ?? [])
  const languageOptions = languages.map((l) => ({ value: l.id, label: l.libelle }))

  function invalidateProviders() {
    queryClient.invalidateQueries({ queryKey: ['training', 'providers', 'mine'] })
  }

  const createIndividualMutation = useMutation({
    mutationFn: createIndividualTrainingProvider,
    onSuccess: () => {
      invalidateProviders()
      setCreateMode(null)
      showToast('Profil formateur créé avec succès')
    },
  })
  const createOrganizationMutation = useMutation({
    mutationFn: createOrganizationTrainingProvider,
    onSuccess: () => {
      invalidateProviders()
      setCreateMode(null)
      showToast('Organisme de formation créé avec succès')
    },
  })

  const referentielsReady = countries.length > 0 && languages.length > 0
  const referentielsMissing = !countriesQuery.isLoading && !languagesQuery.isLoading && !referentielsReady

  return (
    <div>
      <p className="text-sm font-medium text-ink-400 mb-1">Formation</p>
      <h1 className="font-heading text-2xl font-bold text-ink-900 mb-1">Espace formateur</h1>
      <p className="text-sm text-ink-500 mb-6">
        Crée ton profil pour publier et vendre des formations en ligne sur la plateforme.
      </p>

      {referentielsMissing && (
        <div className="mb-6 rounded-2xl border border-warning-200 bg-warning-50 p-4 text-sm text-warning-700">
          Aucun pays ou langue n'est encore configuré pour le module Formation — un administrateur doit d'abord en
          ajouter (Référentiels) avant que tu puisses créer ton profil.
        </div>
      )}

      {providersQuery.isLoading ? (
        <div className="p-12 flex justify-center">
          <div className="h-8 w-8 rounded-full border-2 border-ink-200 border-t-primary-600 animate-spin" />
        </div>
      ) : providersQuery.isError ? (
        <ApiErrorMessage
          error={providersQuery.error}
          fallback="Impossible de charger tes profils formateur."
          className="p-6 text-center text-sm text-danger-600"
        />
      ) : providers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-ink-200 p-10 text-center">
          <Store className="h-8 w-8 mx-auto mb-3 text-ink-300" />
          <p className="text-sm text-ink-500 mb-5">
            Tu n'as encore aucun profil formateur. Choisis comment tu veux publier tes formations.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <Button onClick={() => setCreateMode('individual')} disabled={!referentielsReady}>
              <User className="h-4 w-4" />
              Formateur individuel
            </Button>
            <Button variant="secondary" onClick={() => setCreateMode('organization')} disabled={!referentielsReady}>
              <Building2 className="h-4 w-4" />
              Organisme de formation
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex justify-end mb-4">
            <Button size="sm" onClick={() => setCreateMode('individual')} disabled={!referentielsReady}>
              <Plus className="h-3.5 w-3.5" />
              Nouveau profil
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {providers.map((provider) => {
              const isOrg = Boolean(pick(provider, ['denomination'], null))
              const name = pick(provider, ['denomination', 'publicName', 'nom'], 'Profil formateur')
              const subtitle = isOrg
                ? pick(provider, ['adresse'], null)
                : [pick(provider, ['specialite'], null), pick(provider, ['ville'], null)].filter(Boolean).join(' — ')
              const statut = pick(provider, ['statut', 'status', 'verificationStatut'], null)
              return (
                <div key={provider.id} className="bg-white rounded-2xl border border-ink-100 p-5">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-xl bg-primary-50 flex items-center justify-center shrink-0">
                      {isOrg ? (
                        <Building2 className="h-5 w-5 text-primary-600" />
                      ) : (
                        <GraduationCap className="h-5 w-5 text-primary-600" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-ink-900 truncate">{name}</p>
                      {subtitle && <p className="text-sm text-ink-500 truncate">{subtitle}</p>}
                      {statut && <p className="text-xs text-ink-400 mt-1">Statut : {statut}</p>}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      <Modal
        open={createMode === 'individual'}
        onClose={() => setCreateMode(null)}
        title="Devenir formateur individuel"
      >
        <IndividualProviderForm
          countryOptions={countryOptions}
          languageOptions={languageOptions}
          isSubmitting={createIndividualMutation.isPending}
          onCancel={() => setCreateMode(null)}
          onSubmit={(data) => createIndividualMutation.mutateAsync(data)}
        />
      </Modal>

      <Modal
        open={createMode === 'organization'}
        onClose={() => setCreateMode(null)}
        title="Créer un organisme de formation"
      >
        <OrganizationProviderForm
          countryOptions={countryOptions}
          isSubmitting={createOrganizationMutation.isPending}
          onCancel={() => setCreateMode(null)}
          onSubmit={(data) => createOrganizationMutation.mutateAsync(data)}
        />
      </Modal>
    </div>
  )
}
