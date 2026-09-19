import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowRightCircle, CheckCircle2, Shuffle, UserCheck } from 'lucide-react'
import {
  affectationAutoInscription,
  affecterInscription,
  changerStatutInscription,
  getInscription,
  validerInscription,
} from '../../api/inscriptions'
import { getAccesPortailEleveStatus } from '../../api/eleves'
import { listClasses, listNiveaux } from '../../api/academique'
import { ApiErrorMessage } from '../../components/ui/ApiErrorMessage'
import { Modal } from '../../components/ui/Modal'
import { Avatar } from '../../components/ui/Avatar'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Select } from '../../components/ui/Select'
import { Alert } from '../../components/ui/Alert'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { useToast } from '../../components/ui/ToastContext'
import { ApiError } from '../../api/client'
import {
  INSCRIPTION_STATUT_LABELS,
  getNextInscriptionStatutOptions,
  inscriptionStatutBadgeVariant,
} from '../../config/eleveLabels'
import { NIVEAU_LABELS } from '../../config/academiqueLabels'
import { pick } from '../../lib/pick'
import { InscriptionStepper } from './InscriptionStepper'
import { InscriptionDocuments } from './InscriptionDocuments'

/** Détail d'une inscription : demande initiale + affectation manuelle/auto + validation. */
export function InscriptionDetailModal({ etablissementId, anneeScolaireId, inscriptionId, onClose }) {
  const [classeId, setClasseId] = useState('')
  const [nouveauStatut, setNouveauStatut] = useState('')
  const [isAutoConfirmOpen, setAutoConfirmOpen] = useState(false)
  const [isValiderConfirmOpen, setValiderConfirmOpen] = useState(false)
  const [isSkipAffectationConfirmOpen, setSkipAffectationConfirmOpen] = useState(false)
  const [actionError, setActionError] = useState('')
  const queryClient = useQueryClient()
  const { showToast } = useToast()

  // Ce composant reste monté d'un dossier à l'autre (le parent ne fait que
  // changer `inscriptionId`) : sans ce reset, une classe/un statut choisis
  // pour un dossier resteraient sélectionnés en ouvrant un autre dossier.
  useEffect(() => {
    setClasseId('')
    setNouveauStatut('')
    setActionError('')
  }, [inscriptionId])

  const queryKey = ['inscriptions', 'detail', etablissementId, inscriptionId]
  const { data: inscription, isLoading, isError, error } = useQuery({
    queryKey,
    queryFn: () => getInscription(etablissementId, inscriptionId),
    enabled: Boolean(etablissementId && inscriptionId),
  })

  const { data: classesData } = useQuery({
    queryKey: ['academique', 'classes', etablissementId, anneeScolaireId],
    queryFn: () => listClasses(etablissementId, anneeScolaireId),
    enabled: Boolean(etablissementId && anneeScolaireId),
  })

  // Comble le trou "dossier Élève sans photo" (signalé au backend) quand le
  // compte portail de l'élève, lui, en a une — un seul appel léger, pas de
  // souci de perf ici puisqu'on n'affiche qu'un seul dossier à la fois.
  const eleveIdForAcces = inscription?.eleve?.id
  const { data: accesStatus } = useQuery({
    queryKey: ['eleves', 'acces-portail-status', etablissementId, eleveIdForAcces],
    queryFn: () => getAccesPortailEleveStatus(etablissementId, eleveIdForAcces),
    enabled: Boolean(etablissementId && eleveIdForAcces),
  })
  const classes = Array.isArray(classesData) ? classesData : (classesData?.items ?? [])
  const classeOptions = classes.map((c) => ({ value: c.id, label: c.nom }))
  const classeLabelById = Object.fromEntries(classes.map((c) => [c.id, c.nom]))

  const { data: niveauxData } = useQuery({
    queryKey: ['academique', 'niveaux', etablissementId],
    queryFn: () => listNiveaux(etablissementId),
    enabled: Boolean(etablissementId),
  })
  const niveaux = Array.isArray(niveauxData) ? niveauxData : (niveauxData?.items ?? [])
  const niveauLabelById = Object.fromEntries(
    niveaux.map((n) => [n.id, NIVEAU_LABELS[n.libelle] ?? n.libelle]),
  )

  function invalidateAll() {
    queryClient.invalidateQueries({ queryKey })
    queryClient.invalidateQueries({ queryKey: ['inscriptions', 'list'] })
    queryClient.invalidateQueries({ queryKey: ['eleves', 'list'] })
  }

  const affecterMutation = useMutation({
    mutationFn: () => affecterInscription(etablissementId, inscriptionId, classeId),
    onSuccess: () => {
      invalidateAll()
      setClasseId('')
      setActionError('')
    },
    onError: (err) => setActionError(err instanceof ApiError ? err.message : 'Une erreur est survenue.'),
  })

  const autoMutation = useMutation({
    mutationFn: () => affectationAutoInscription(etablissementId, inscriptionId),
    onSuccess: () => {
      invalidateAll()
      setAutoConfirmOpen(false)
      setActionError('')
    },
    onError: (err) => setActionError(err instanceof ApiError ? err.message : 'Une erreur est survenue.'),
  })

  const validerMutation = useMutation({
    mutationFn: () => validerInscription(etablissementId, inscriptionId),
    onSuccess: () => {
      invalidateAll()
      setValiderConfirmOpen(false)
      setActionError('')
      showToast('Élève inscrit avec succès')
    },
    onError: (err) => setActionError(err instanceof ApiError ? err.message : 'Une erreur est survenue.'),
  })

  const changerStatutMutation = useMutation({
    mutationFn: () => changerStatutInscription(etablissementId, inscriptionId, nouveauStatut),
    onSuccess: () => {
      invalidateAll()
      setNouveauStatut('')
      setActionError('')
    },
    onError: (err) => setActionError(err instanceof ApiError ? err.message : 'Une erreur est survenue.'),
  })

  if (!inscription) {
    return (
      <Modal open={Boolean(inscriptionId)} onClose={onClose} title="Détail de l'inscription">
        {isLoading && (
          <div className="p-8 flex justify-center">
            <div className="h-8 w-8 rounded-full border-2 border-ink-200 border-t-primary-600 animate-spin" />
          </div>
        )}
        {isError && (
          <ApiErrorMessage error={error} fallback="Impossible de charger cette inscription." className="text-sm text-danger-600 text-center py-8" />
        )}
      </Modal>
    )
  }

  const eleve = pick(inscription, ['eleve'], {})
  // `niveauDemandeId`/`classeDemandeeId` sont des ids à plat (pas d'objet
  // imbriqué renvoyé) — on les résout via les listes déjà chargées pour les
  // sélecteurs. `affectation` peut être l'objet classe, ou juste porter un
  // `classeId` selon ce que renvoie vraiment le backend une fois rempli —
  // on couvre les deux cas.
  const niveauDemandeLabel = niveauLabelById[inscription.niveauDemandeId] ?? null
  const classeDemandeeLabel = classeLabelById[inscription.classeDemandeeId] ?? null
  const affectation = pick(inscription, ['affectation'], null)
  const classeAffecteeLabel =
    affectation?.classe?.nom ??
    affectation?.nom ??
    classeLabelById[affectation?.classeId] ??
    classeLabelById[affectation] ??
    null
  const hasAffectation = Boolean(affectation)

  // Passer à "Complète" sans classe affectée coince le dossier pour de bon
  // (les transitions ne reculent jamais) — on prévient avant de laisser
  // faire, plutôt que de laisser découvrir ça après coup.
  function handleChangerStatutClick() {
    if (nouveauStatut === 'COMPLETE' && !hasAffectation) {
      setSkipAffectationConfirmOpen(true)
      return
    }
    changerStatutMutation.mutate()
  }
  const statut = pick(inscription, ['statut'], null)
  const nomComplet = `${eleve?.prenom ?? ''} ${eleve?.nom ?? ''}`.trim() || 'Élève'

  return (
    <>
      <Modal open={Boolean(inscriptionId)} onClose={onClose} title="Détail de l'inscription">
        <div className="flex items-center gap-3 mb-4">
          <Avatar name={nomComplet} src={pick(eleve, ['photoUrl'], null) || accesStatus?.utilisateur?.photoUrl} size={48} />
          <div className="min-w-0 flex-1">
            <p className="font-heading font-bold text-ink-900 truncate">{nomComplet}</p>
            <p className="text-xs text-ink-400">{eleve?.matricule ?? '—'}</p>
          </div>
          {statut && (
            <Badge variant={inscriptionStatutBadgeVariant(statut)} className="shrink-0">
              {INSCRIPTION_STATUT_LABELS[statut] ?? statut}
            </Badge>
          )}
        </div>

        <div className="mb-5">
          <InscriptionStepper statut={statut} />
        </div>

        <div className="grid grid-cols-2 gap-x-4 mb-2 text-sm">
          <div className="py-2.5 border-b border-ink-50">
            <p className="text-xs text-ink-400">Niveau demandé</p>
            <p className="text-ink-900">{niveauDemandeLabel ?? '—'}</p>
          </div>
          <div className="py-2.5 border-b border-ink-50">
            <p className="text-xs text-ink-400">Classe demandée</p>
            <p className="text-ink-900">{classeDemandeeLabel ?? '—'}</p>
          </div>
          <div className="py-2.5 border-b border-ink-50">
            <p className="text-xs text-ink-400">Classe affectée</p>
            <p className="text-ink-900">{classeAffecteeLabel ?? '—'}</p>
          </div>
          <div className="py-2.5 border-b border-ink-50">
            <p className="text-xs text-ink-400">Résultat précédent</p>
            <p className="text-ink-900">{pick(inscription, ['resultatScolaire'])}</p>
          </div>
        </div>

        <div className="pt-4 mt-2 border-t border-ink-100">
          <p className="text-sm font-medium text-ink-900 mb-3">Documents</p>
          <InscriptionDocuments etablissementId={etablissementId} inscriptionId={inscriptionId} eleveNom={nomComplet} />
        </div>

        <div className="pt-4 mt-4 border-t border-ink-100 space-y-4">
          {(() => {
            const nextOptions = getNextInscriptionStatutOptions(statut)
            if (nextOptions.length === 0) {
              return (
                <p className="text-sm text-ink-400">
                  Dossier au statut final ({INSCRIPTION_STATUT_LABELS[statut] ?? statut}) — plus aucune transition possible.
                </p>
              )
            }
            return (
              <div>
                <p className="text-sm font-medium text-ink-900 mb-2">Faire avancer le dossier</p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Select
                    id="nouveauStatut"
                    options={[{ value: '', label: 'Choisir un statut...' }, ...nextOptions]}
                    value={nouveauStatut}
                    onChange={(e) => setNouveauStatut(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    disabled={!nouveauStatut}
                    isLoading={changerStatutMutation.isPending}
                    onClick={handleChangerStatutClick}
                  >
                    <ArrowRightCircle className="h-3.5 w-3.5" />
                    Mettre à jour
                  </Button>
                </div>
                <p className="text-xs text-ink-400 mt-1.5">
                  Les transitions ne vont que vers l'avant (jamais en arrière) —
                  affecte une classe pendant que le dossier est "Soumise",
                  avant de passer à "Complète".
                </p>
              </div>
            )
          })()}

          <div>
            <p className="text-sm font-medium text-ink-900 mb-2">Affecter à une classe</p>
            {statut !== 'SOUMISE' ? (
              <p className="text-sm text-ink-400">
                Seulement possible pendant que le dossier est au statut "Soumise"
                {statut === 'BROUILLON' && ' — fais-le d\'abord passer à "Soumise" ci-dessus.'}
                {(statut === 'COMPLETE' || statut === 'VALIDEE') && " — c'est trop tard pour ce dossier, l'étape a été sautée."}
              </p>
            ) : (
              <div className="flex flex-col sm:flex-row gap-2">
                <Select
                  id="classeId"
                  options={[{ value: '', label: 'Choisir une classe...' }, ...classeOptions]}
                  value={classeId}
                  onChange={(e) => setClasseId(e.target.value)}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={!classeId}
                  isLoading={affecterMutation.isPending}
                  onClick={() => affecterMutation.mutate()}
                >
                  <UserCheck className="h-3.5 w-3.5" />
                  Affecter
                </Button>
              </div>
            )}
          </div>

          {actionError && <Alert variant="danger">{actionError}</Alert>}

          <div className="flex flex-wrap justify-end gap-2 pt-3 border-t border-ink-100">
            <Button
              variant="secondary"
              size="sm"
              disabled={statut !== 'SOUMISE'}
              onClick={() => setAutoConfirmOpen(true)}
            >
              <Shuffle className="h-3.5 w-3.5" />
              Affectation automatique
            </Button>
            <Button size="sm" onClick={() => setValiderConfirmOpen(true)}>
              <CheckCircle2 className="h-3.5 w-3.5" />
              Valider l'inscription
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={isSkipAffectationConfirmOpen}
        onClose={() => setSkipAffectationConfirmOpen(false)}
        onConfirm={() => {
          setSkipAffectationConfirmOpen(false)
          changerStatutMutation.mutate()
        }}
        isLoading={changerStatutMutation.isPending}
        title="Continuer sans affecter de classe ?"
        description="Ce dossier n'a pas encore de classe affectée. Une fois passé à « Complète », il ne sera plus possible d'en affecter une — les transitions ne reculent jamais."
        confirmLabel="Continuer quand même"
      />

      <ConfirmDialog
        open={isAutoConfirmOpen}
        onClose={() => setAutoConfirmOpen(false)}
        onConfirm={() => autoMutation.mutate()}
        isLoading={autoMutation.isPending}
        variant="primary"
        title="Affectation automatique ?"
        description="L'élève sera affecté à la classe la moins pleine du niveau demandé."
        confirmLabel="Affecter automatiquement"
      />

      <ConfirmDialog
        open={isValiderConfirmOpen}
        onClose={() => setValiderConfirmOpen(false)}
        onConfirm={() => validerMutation.mutate()}
        isLoading={validerMutation.isPending}
        variant="primary"
        title="Valider cette inscription ?"
        description="L'élève passe au statut « Inscrit »."
        confirmLabel="Valider"
      />
    </>
  )
}
