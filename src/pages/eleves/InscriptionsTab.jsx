import { useEffect, useState } from 'react'
import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, ClipboardList, Plus, UserPlus } from 'lucide-react'
import { getAccesPortailEleveStatus } from '../../api/eleves'
import { listInscriptions, preinscrire, reinscrire } from '../../api/inscriptions'
import { listAnneesScolaires } from '../../api/etablissements'
import { listClasses, listNiveaux } from '../../api/academique'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { Select } from '../../components/ui/Select'
import { ApiErrorMessage } from '../../components/ui/ApiErrorMessage'
import { Avatar } from '../../components/ui/Avatar'
import { Badge } from '../../components/ui/Badge'
import { Pagination } from '../../components/ui/Pagination'
import { INSCRIPTION_STATUT_LABELS, INSCRIPTION_STATUT_OPTIONS, inscriptionStatutBadgeVariant } from '../../config/eleveLabels'
import { NIVEAU_LABELS } from '../../config/academiqueLabels'
import { pick } from '../../lib/pick'
import { PreinscrireForm } from './PreinscrireForm'
import { ReinscrireForm } from './ReinscrireForm'
import { InscriptionDetailModal } from './InscriptionDetailModal'

export function InscriptionsTab({ etablissementId }) {
  const [anneeScolaireId, setAnneeScolaireId] = useState('')
  const [statutFilter, setStatutFilter] = useState('BROUILLON')
  const [page, setPage] = useState(1)
  const [isPreinscrireOpen, setPreinscrireOpen] = useState(false)
  const [isReinscrireOpen, setReinscrireOpen] = useState(false)
  const [viewingInscriptionId, setViewingInscriptionId] = useState(null)
  const queryClient = useQueryClient()

  const { data: anneesData, isLoading: isLoadingAnnees, isError: isErrorAnnees, error: anneesError } = useQuery({
    queryKey: ['academique', 'annees', etablissementId],
    queryFn: () => listAnneesScolaires(etablissementId),
    enabled: Boolean(etablissementId),
    retry: false,
  })
  const annees = Array.isArray(anneesData) ? anneesData : (anneesData?.items ?? [])
  const anneeOptions = annees.map((a) => ({ value: a.id, label: a.libelle }))

  // Un id d'année d'un AUTRE établissement ne doit jamais survivre à un
  // changement d'établissement (l'API le refuse à raison — "année scolaire
  // introuvable" pour ce tenant) : on réinitialise dès que l'étab change,
  // avant de relaisser l'effet suivant en choisir une par défaut fraîche.
  useEffect(() => {
    setAnneeScolaireId('')
  }, [etablissementId])

  useEffect(() => {
    if (anneeScolaireId || annees.length === 0) return
    const enCours = annees.find((a) => a.statut === 'EN_COURS')
    const fallback = annees.slice().sort((a, b) => (b.dateDebut ?? '').localeCompare(a.dateDebut ?? ''))[0]
    setAnneeScolaireId((enCours ?? fallback)?.id ?? '')
  }, [annees, anneeScolaireId])

  const listQueryKey = ['inscriptions', 'list', etablissementId, anneeScolaireId, statutFilter, page]
  const { data, isLoading, isError, error } = useQuery({
    queryKey: listQueryKey,
    queryFn: () => listInscriptions(etablissementId, { anneeScolaireId, statut: statutFilter, page }),
    enabled: Boolean(etablissementId && anneeScolaireId && statutFilter),
    placeholderData: (previous) => previous,
  })
  const inscriptions = Array.isArray(data) ? data : (data?.items ?? [])

  useEffect(() => {
    setPage(1)
  }, [anneeScolaireId, statutFilter])

  // Comble "dossier Élève sans photo" avec celle du compte portail lié
  // quand elle existe — même mécanisme et même clé de cache que ElevesTab/
  // EleveDetailModal (partagée entre les trois écrans).
  const accesQueries = useQueries({
    queries: inscriptions.map((item) => {
      const eleveId = pick(item, ['eleve'], {})?.id
      return {
        queryKey: ['eleves', 'acces-portail-status', etablissementId, eleveId],
        queryFn: () => getAccesPortailEleveStatus(etablissementId, eleveId),
        enabled: Boolean(etablissementId && eleveId),
      }
    }),
  })
  const photoByEleveId = Object.fromEntries(
    inscriptions.map((item, i) => [pick(item, ['eleve'], {})?.id, accesQueries[i]?.data?.utilisateur?.photoUrl]),
  )

  // `niveauDemandeId`/`classeDemandeeId`/`affectation` sont des ids à plat
  // (confirmé par un vrai payload) — on les résout via ces listes déjà
  // chargées ailleurs dans le module.
  const { data: niveauxData } = useQuery({
    queryKey: ['academique', 'niveaux', etablissementId],
    queryFn: () => listNiveaux(etablissementId),
    enabled: Boolean(etablissementId),
  })
  const niveauLabelById = Object.fromEntries(
    (Array.isArray(niveauxData) ? niveauxData : (niveauxData?.items ?? [])).map((n) => [
      n.id,
      NIVEAU_LABELS[n.libelle] ?? n.libelle,
    ]),
  )

  const { data: classesData } = useQuery({
    queryKey: ['academique', 'classes', etablissementId, anneeScolaireId],
    queryFn: () => listClasses(etablissementId, anneeScolaireId),
    enabled: Boolean(etablissementId && anneeScolaireId),
  })
  const classeLabelById = Object.fromEntries(
    (Array.isArray(classesData) ? classesData : (classesData?.items ?? [])).map((c) => [c.id, c.nom]),
  )

  const preinscrireMutation = useMutation({
    mutationFn: (payload) => preinscrire(etablissementId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inscriptions', 'list'] })
      queryClient.invalidateQueries({ queryKey: ['eleves', 'list'] })
      setPreinscrireOpen(false)
    },
  })

  const reinscrireMutation = useMutation({
    mutationFn: (payload) => reinscrire(etablissementId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inscriptions', 'list'] })
      queryClient.invalidateQueries({ queryKey: ['eleves', 'list'] })
      setReinscrireOpen(false)
    },
  })

  if (isErrorAnnees) {
    return (
      <div className="bg-white rounded-2xl border border-dashed border-danger-500/40 p-10 text-center">
        <AlertTriangle className="h-8 w-8 mx-auto mb-3 text-danger-500" />
        <p className="font-heading font-semibold text-ink-900 mb-1">Accès refusé aux années scolaires</p>
        <p className="text-sm text-ink-500 max-w-md mx-auto">
          {anneesError?.message || "Ton rôle n'a pas le droit de consulter les années scolaires"}
          {' '}— sans ça, impossible d'afficher les inscriptions. Demande à ton
          Directeur ou à l'administrateur de vérifier tes accès.
        </p>
      </div>
    )
  }

  if (!isLoadingAnnees && annees.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-dashed border-warning-500/40 p-10 text-center">
        <AlertTriangle className="h-8 w-8 mx-auto mb-3 text-warning-500" />
        <p className="font-heading font-semibold text-ink-900 mb-1">Aucune année scolaire</p>
        <p className="text-sm text-ink-500 max-w-md mx-auto">
          Crée d'abord une année scolaire dans l'onglet Académique — les
          inscriptions lui sont rattachées.
        </p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
        <div className="flex flex-wrap gap-3">
          <div className="max-w-xs w-full">
            <Select
              id="annee-filter"
              label="Année scolaire"
              options={anneeOptions}
              value={anneeScolaireId}
              onChange={(e) => setAnneeScolaireId(e.target.value)}
            />
          </div>
          <div className="max-w-xs w-full">
            <Select
              id="statut-filter"
              label="Statut"
              options={INSCRIPTION_STATUT_OPTIONS}
              value={statutFilter}
              onChange={(e) => setStatutFilter(e.target.value)}
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setReinscrireOpen(true)}>
            <UserPlus className="h-4 w-4" />
            Réinscrire
          </Button>
          <Button onClick={() => setPreinscrireOpen(true)}>
            <Plus className="h-4 w-4" />
            Préinscrire
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-ink-100 overflow-hidden">
        {isLoading && (
          <div className="p-12 flex justify-center">
            <div className="h-8 w-8 rounded-full border-2 border-ink-200 border-t-primary-600 animate-spin" />
          </div>
        )}
        {isError && <ApiErrorMessage error={error} fallback="Impossible de charger les inscriptions." />}
        {!isLoading && !isError && inscriptions.length === 0 && (
          <div className="p-16 text-center text-ink-400">
            <ClipboardList className="h-8 w-8 mx-auto mb-3 opacity-50" />
            Aucune inscription avec ce statut pour cette année.
          </div>
        )}
        {!isLoading && !isError && inscriptions.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-ink-50/80">
                <tr className="text-left text-xs text-ink-500 uppercase tracking-wide border-b border-ink-100">
                  <th className="px-4 py-3 font-medium">Élève</th>
                  <th className="px-4 py-3 font-medium">Niveau demandé</th>
                  <th className="px-4 py-3 font-medium">Classe</th>
                  <th className="px-4 py-3 font-medium">Statut</th>
                </tr>
              </thead>
              <tbody>
                {inscriptions.map((item) => {
                  const eleve = pick(item, ['eleve'], {})
                  const affectation = pick(item, ['affectation'], null)
                  const classeLabel =
                    classeLabelById[affectation?.classeId] ??
                    classeLabelById[affectation] ??
                    classeLabelById[item.classeDemandeeId] ??
                    null
                  const statut = pick(item, ['statut'], null)
                  return (
                    <tr
                      key={item.id}
                      onClick={() => setViewingInscriptionId(item.id)}
                      className="border-b border-ink-50 last:border-0 hover:bg-ink-50/60 cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-3 font-medium text-ink-900">
                        <div className="flex items-center gap-2.5">
                          <Avatar
                            name={`${eleve?.prenom ?? ''} ${eleve?.nom ?? ''}`.trim()}
                            src={pick(eleve, ['photoUrl'], null) || photoByEleveId[eleve?.id]}
                            size={32}
                          />
                          {`${eleve?.prenom ?? ''} ${eleve?.nom ?? ''}`.trim() || '—'}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-ink-600">
                        {niveauLabelById[item.niveauDemandeId] ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-ink-600">{classeLabel ?? '—'}</td>
                      <td className="px-4 py-3">
                        {statut ? (
                          <Badge variant={inscriptionStatutBadgeVariant(statut)}>
                            {INSCRIPTION_STATUT_LABELS[statut] ?? statut}
                          </Badge>
                        ) : (
                          <Badge variant="neutral">—</Badge>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {data && !Array.isArray(data) && (
          <div className="px-4 pb-4">
            <Pagination page={data.page} totalPages={data.totalPages} total={data.total} onPageChange={setPage} />
          </div>
        )}
      </div>

      <Modal open={isPreinscrireOpen} onClose={() => setPreinscrireOpen(false)} title="Préinscrire un élève" maxWidth="max-w-2xl">
        <PreinscrireForm
          etablissementId={etablissementId}
          anneeScolaireId={anneeScolaireId}
          isSubmitting={preinscrireMutation.isPending}
          onCancel={() => setPreinscrireOpen(false)}
          onSubmit={(payload) => preinscrireMutation.mutateAsync(payload)}
        />
      </Modal>

      <Modal open={isReinscrireOpen} onClose={() => setReinscrireOpen(false)} title="Réinscrire un élève">
        <ReinscrireForm
          etablissementId={etablissementId}
          anneeScolaireId={anneeScolaireId}
          isSubmitting={reinscrireMutation.isPending}
          onCancel={() => setReinscrireOpen(false)}
          onSubmit={(payload) => reinscrireMutation.mutateAsync(payload)}
        />
      </Modal>

      <InscriptionDetailModal
        etablissementId={etablissementId}
        anneeScolaireId={anneeScolaireId}
        inscriptionId={viewingInscriptionId}
        onClose={() => setViewingInscriptionId(null)}
      />
    </div>
  )
}
