import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CreditCard, Receipt, Send, Wallet } from 'lucide-react'
import {
  appliquerReduction,
  encaisser,
  genererEcheances,
  initierMobileMoney,
  listEcheances,
} from '../../api/finances'
import { getEleve, searchEleves } from '../../api/eleves'
import { ApiErrorMessage } from '../../components/ui/ApiErrorMessage'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { Select } from '../../components/ui/Select'
import { TextField } from '../../components/ui/TextField'
import { Combobox } from '../../components/ui/Combobox'
import { Badge } from '../../components/ui/Badge'
import { Alert } from '../../components/ui/Alert'
import { Pagination } from '../../components/ui/Pagination'
import { ApiError } from '../../api/client'
import { ECHEANCE_STATUT_LABELS, ECHEANCE_STATUT_OPTIONS, MOBILE_MONEY_FOURNISSEUR_OPTIONS, MODE_PAIEMENT_OPTIONS, echeanceStatutBadgeVariant } from '../../config/financesLabels'
import { formatDate } from '../../lib/formatDate'
import { pick } from '../../lib/pick'
import { reductionsSessionKey } from '../../lib/reductionsSessionCache'

/** Cherche un élève puis choisit une de ses inscriptions pour lui générer ses échéances. */
function GenererEcheancesForm({ etablissementId, onSubmit, isSubmitting }) {
  const [eleveId, setEleveId] = useState('')
  const [inscriptionId, setInscriptionId] = useState('')
  const [formError, setFormError] = useState('')
  const [success, setSuccess] = useState(false)

  const { data: elevesData } = useQuery({
    queryKey: ['eleves', 'options', etablissementId],
    queryFn: () => searchEleves(etablissementId, { limit: 100 }),
    enabled: Boolean(etablissementId),
  })
  const eleveOptions = (elevesData?.items ?? []).map((e) => ({
    value: e.id,
    label: `${e.prenom ?? ''} ${e.nom ?? ''}`.trim() + (e.matricule ? ` (${e.matricule})` : ''),
  }))

  const { data: eleve, isLoading: isLoadingEleve } = useQuery({
    queryKey: ['eleves', 'detail', etablissementId, eleveId],
    queryFn: () => getEleve(etablissementId, eleveId),
    enabled: Boolean(etablissementId && eleveId),
  })
  const inscriptions = eleve?.inscriptions ?? []
  const inscriptionOptions = inscriptions.map((i, index) => ({
    value: i.id,
    label: `${i.anneeScolaire?.libelle ?? `Inscription ${index + 1}`} — ${i.statut ?? ''}`,
  }))

  async function handleSubmit(e) {
    e.preventDefault()
    setFormError('')
    setSuccess(false)
    if (!inscriptionId) {
      setFormError('Choisis une inscription.')
      return
    }
    try {
      await onSubmit(inscriptionId)
      setSuccess(true)
      setEleveId('')
      setInscriptionId('')
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Une erreur est survenue.')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 bg-white rounded-2xl border border-ink-100 p-5">
      <p className="text-sm font-medium text-ink-900">Générer les échéances d'une inscription</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Combobox
          id="eleve"
          label="Élève"
          options={eleveOptions}
          value={eleveId}
          onChange={(v) => {
            setEleveId(v)
            setInscriptionId('')
          }}
          placeholder="Rechercher un élève..."
          searchPlaceholder="Rechercher par nom..."
        />
        <Select
          id="inscription"
          label="Inscription"
          options={[{ value: '', label: isLoadingEleve ? 'Chargement...' : 'Choisir...' }, ...inscriptionOptions]}
          value={inscriptionId}
          onChange={(e) => setInscriptionId(e.target.value)}
          disabled={!eleveId}
        />
      </div>
      {formError && <Alert variant="danger">{formError}</Alert>}
      {success && <Alert variant="success">Échéances générées.</Alert>}
      <div className="flex justify-end pt-1">
        <Button type="submit" size="sm" isLoading={isSubmitting}>
          Générer
        </Button>
      </div>
    </form>
  )
}

function EncaisserForm({ onSubmit, onCancel, isSubmitting }) {
  const [montant, setMontant] = useState('')
  const [mode, setMode] = useState(MODE_PAIEMENT_OPTIONS[0].value)
  const [reference, setReference] = useState('')
  const [formError, setFormError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setFormError('')
    if (!montant || Number(montant) <= 0) {
      setFormError('Indique un montant valide.')
      return
    }
    try {
      await onSubmit({ montant: Number(montant), mode, ...(reference ? { reference } : {}) })
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Une erreur est survenue.')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <TextField id="montant" label="Montant (GNF)" type="number" required value={montant} onChange={(e) => setMontant(e.target.value)} />
      <Select id="mode" label="Mode de paiement" options={MODE_PAIEMENT_OPTIONS} value={mode} onChange={(e) => setMode(e.target.value)} required />
      <TextField id="reference" label="Référence (optionnel)" value={reference} onChange={(e) => setReference(e.target.value)} placeholder="REF-2026-001" />
      {formError && <Alert variant="danger">{formError}</Alert>}
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit" isLoading={isSubmitting}>
          <Wallet className="h-3.5 w-3.5" />
          Encaisser
        </Button>
      </div>
    </form>
  )
}

function AppliquerReductionForm({ etablissementId, onSubmit, onCancel, isSubmitting }) {
  const queryClient = useQueryClient()
  const reductions = queryClient.getQueryData(reductionsSessionKey(etablissementId)) ?? []
  const [reductionId, setReductionId] = useState('')
  const [formError, setFormError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setFormError('')
    if (!reductionId.trim()) {
      setFormError('Choisis (ou saisis) l\'id de la réduction.')
      return
    }
    try {
      await onSubmit(reductionId.trim())
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Une erreur est survenue.')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {reductions.length > 0 ? (
        <Select
          id="reductionId"
          label="Réduction (créée pendant cette session)"
          options={[{ value: '', label: 'Choisir...' }, ...reductions.map((r, i) => ({ value: r.id ?? '', label: r.libelle ?? `Réduction ${i + 1}` }))]}
          value={reductionId}
          onChange={(e) => setReductionId(e.target.value)}
        />
      ) : (
        <Alert variant="warning">
          Aucune réduction créée pendant cette session (onglet "Frais & Réductions") — aucun endpoint ne permet de
          lister les réductions déjà existantes. Saisis directement son id si tu le connais.
        </Alert>
      )}
      <TextField id="reductionIdManuel" label="Ou id de la réduction (manuel)" value={reductionId} onChange={(e) => setReductionId(e.target.value)} />
      {formError && <Alert variant="danger">{formError}</Alert>}
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit" isLoading={isSubmitting}>
          Appliquer
        </Button>
      </div>
    </form>
  )
}

function MobileMoneyForm({ onSubmit, onCancel, isSubmitting }) {
  const [telephone, setTelephone] = useState('')
  const [fournisseur, setFournisseur] = useState(MOBILE_MONEY_FOURNISSEUR_OPTIONS[0].value)
  const [formError, setFormError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setFormError('')
    if (!telephone.trim()) {
      setFormError('Le numéro de téléphone est requis.')
      return
    }
    try {
      await onSubmit({ telephone: telephone.trim(), fournisseur })
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Une erreur est survenue.')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <TextField id="telephone" label="Téléphone" required value={telephone} onChange={(e) => setTelephone(e.target.value)} placeholder="+224620123456" />
      <Select id="fournisseur" label="Fournisseur" options={MOBILE_MONEY_FOURNISSEUR_OPTIONS} value={fournisseur} onChange={(e) => setFournisseur(e.target.value)} required />
      {formError && <Alert variant="danger">{formError}</Alert>}
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit" isLoading={isSubmitting}>
          <Send className="h-3.5 w-3.5" />
          Initier
        </Button>
      </div>
    </form>
  )
}

/** Échéances de paiement — génération, encaissement, réduction, Mobile Money. */
export function EcheancesTab({ etablissementId, canGererFrais }) {
  const [statutFilter, setStatutFilter] = useState('')
  const [page, setPage] = useState(1)
  const [encaissantId, setEncaissantId] = useState(null)
  const [reductionForId, setReductionForId] = useState(null)
  const [mobileMoneyForId, setMobileMoneyForId] = useState(null)
  const queryClient = useQueryClient()

  const queryKey = ['finances', 'echeances', etablissementId, statutFilter, page]
  const { data, isLoading, isError, error } = useQuery({
    queryKey,
    queryFn: () => listEcheances(etablissementId, { statut: statutFilter || undefined, page }),
    enabled: Boolean(etablissementId),
    placeholderData: (previous) => previous,
  })
  const echeances = Array.isArray(data) ? data : (data?.items ?? [])

  function invalidateAll() {
    queryClient.invalidateQueries({ queryKey: ['finances', 'echeances'] })
  }

  const genererMutation = useMutation({
    mutationFn: (inscriptionId) => genererEcheances(etablissementId, inscriptionId),
    onSuccess: invalidateAll,
  })
  const encaisserMutation = useMutation({
    mutationFn: (payload) => encaisser(etablissementId, encaissantId, payload),
    onSuccess: () => {
      invalidateAll()
      setEncaissantId(null)
    },
  })
  const reductionMutation = useMutation({
    mutationFn: (reductionId) => appliquerReduction(etablissementId, reductionForId, reductionId),
    onSuccess: () => {
      invalidateAll()
      setReductionForId(null)
    },
  })
  const mobileMoneyMutation = useMutation({
    mutationFn: (payload) => initierMobileMoney(etablissementId, { ...payload, echeanceId: mobileMoneyForId }),
    onSuccess: () => setMobileMoneyForId(null),
  })

  return (
    <div className="space-y-4">
      {canGererFrais && <GenererEcheancesForm etablissementId={etablissementId} isSubmitting={genererMutation.isPending} onSubmit={(id) => genererMutation.mutateAsync(id)} />}

      <div className="max-w-xs">
        <Select
          id="statut-filter"
          label="Statut"
          options={[{ value: '', label: 'Tous' }, ...ECHEANCE_STATUT_OPTIONS]}
          value={statutFilter}
          onChange={(e) => {
            setStatutFilter(e.target.value)
            setPage(1)
          }}
        />
      </div>

      <div className="bg-white rounded-2xl border border-ink-100 overflow-hidden">
        {isLoading && (
          <div className="p-12 flex justify-center">
            <div className="h-8 w-8 rounded-full border-2 border-ink-200 border-t-primary-600 animate-spin" />
          </div>
        )}
        {isError && <ApiErrorMessage error={error} fallback="Impossible de charger les échéances." />}
        {!isLoading && !isError && echeances.length === 0 && (
          <div className="p-16 text-center text-ink-400">
            <Receipt className="h-8 w-8 mx-auto mb-3 opacity-50" />
            Aucune échéance pour l'instant.
          </div>
        )}
        {!isLoading && !isError && echeances.length > 0 && (
          <div className="divide-y divide-ink-50">
            {echeances.map((ech, index) => {
              // Forme confirmée en live (voir typeFrais/inscription.eleve
              // imbriqués, montantNet/montantRestant, echeanceDate).
              const id = pick(ech, ['id'], index)
              const statut = pick(ech, ['statut'], null)
              const dejaTraitee = statut === 'PAYE' || statut === 'EXONERE' || statut === 'ANNULE'
              const libelle = ech.typeFrais?.libelle ?? 'Échéance'
              const eleve = ech.inscription?.eleve
              const eleveNom = eleve ? `${eleve.prenom ?? ''} ${eleve.nom ?? ''}`.trim() : null
              const montant = pick(ech, ['montantNet', 'montantBrut'])
              const montantRestant = ech.montantRestant
              return (
                <div key={id} className="flex items-center justify-between gap-3 px-4 py-3 flex-wrap">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink-900 truncate">
                      {libelle}
                      {eleveNom ? ` — ${eleveNom}` : ''}
                    </p>
                    <p className="text-xs text-ink-400">
                      {montant} GNF
                      {statut === 'PARTIEL' && montantRestant ? ` (reste ${montantRestant} GNF)` : ''} · échéance{' '}
                      {formatDate(pick(ech, ['echeanceDate'], null)) ?? '—'}
                      {ech.reduction?.libelle ? ` · réduction : ${ech.reduction.libelle}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant={echeanceStatutBadgeVariant(statut)}>{ECHEANCE_STATUT_LABELS[statut] ?? statut ?? '—'}</Badge>
                    {!dejaTraitee && (
                      <>
                        <Button size="sm" variant="secondary" onClick={() => setMobileMoneyForId(id)}>
                          <CreditCard className="h-3.5 w-3.5" />
                          Mobile Money
                        </Button>
                        {canGererFrais && (
                          <Button size="sm" variant="secondary" onClick={() => setReductionForId(id)}>
                            Réduction
                          </Button>
                        )}
                        <Button size="sm" onClick={() => setEncaissantId(id)}>
                          <Wallet className="h-3.5 w-3.5" />
                          Encaisser
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {data && !Array.isArray(data) && (
          <div className="px-4 pb-4">
            <Pagination page={data.page} totalPages={data.totalPages} total={data.total} onPageChange={setPage} />
          </div>
        )}
      </div>

      <Modal open={Boolean(encaissantId)} onClose={() => setEncaissantId(null)} title="Encaisser cette échéance" maxWidth="max-w-sm">
        <EncaisserForm isSubmitting={encaisserMutation.isPending} onCancel={() => setEncaissantId(null)} onSubmit={(payload) => encaisserMutation.mutateAsync(payload)} />
      </Modal>

      <Modal open={Boolean(reductionForId)} onClose={() => setReductionForId(null)} title="Appliquer une réduction" maxWidth="max-w-sm">
        <AppliquerReductionForm etablissementId={etablissementId} isSubmitting={reductionMutation.isPending} onCancel={() => setReductionForId(null)} onSubmit={(id) => reductionMutation.mutateAsync(id)} />
      </Modal>

      <Modal open={Boolean(mobileMoneyForId)} onClose={() => setMobileMoneyForId(null)} title="Initier un paiement Mobile Money" maxWidth="max-w-sm">
        <MobileMoneyForm isSubmitting={mobileMoneyMutation.isPending} onCancel={() => setMobileMoneyForId(null)} onSubmit={(payload) => mobileMoneyMutation.mutateAsync(payload)} />
      </Modal>
    </div>
  )
}
