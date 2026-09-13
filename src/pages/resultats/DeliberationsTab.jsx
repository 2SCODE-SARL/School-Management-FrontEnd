import { useEffect, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { AlertTriangle, CheckCircle2, Plus, Users } from 'lucide-react'
import {
  ajouterDecisionDeliberation,
  ajouterMembreDeliberation,
  cloturerDeliberation,
  createDeliberation,
} from '../../api/resultats'
import { listElevesClasse } from '../../api/eleves'
import { searchEmployes } from '../../api/rh'
import { listClasses } from '../../api/academique'
import { getAnneeScolaire, listAnneesScolaires } from '../../api/etablissements'
import { Button } from '../../components/ui/Button'
import { Select } from '../../components/ui/Select'
import { Combobox } from '../../components/ui/Combobox'
import { Alert } from '../../components/ui/Alert'
import { Badge } from '../../components/ui/Badge'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { ApiError } from '../../api/client'
import { NIVEAU_LABELS } from '../../config/academiqueLabels'
import { DECISION_LABELS, decisionBadgeVariant } from '../../config/portailEleveLabels'

const ROLE_OPTIONS = [
  { value: 'PRESIDENT', label: 'Président' },
  { value: 'RAPPORTEUR', label: 'Rapporteur' },
  { value: 'MEMBRE', label: 'Membre' },
]
const DECISION_OPTIONS = Object.entries(DECISION_LABELS).map(([value, label]) => ({ value, label }))

/**
 * Aucun endpoint ne liste/relit les délibérations (confirmé dans la doc,
 * signalé au backend) : une fois créée, on ne peut la gérer que pendant
 * cette session, via l'id renvoyé à la création — recharger la page la
 * perd définitivement. On prévient clairement à l'écran.
 */
export function DeliberationsTab({ etablissementId }) {
  const [anneeScolaireId, setAnneeScolaireId] = useState('')
  const [classeId, setClasseId] = useState('')
  const [trimestreId, setTrimestreId] = useState('')
  const [deliberation, setDeliberation] = useState(null)
  const [membreEmployeId, setMembreEmployeId] = useState('')
  const [membreRole, setMembreRole] = useState('MEMBRE')
  const [membres, setMembres] = useState([])
  const [decisionEleveId, setDecisionEleveId] = useState('')
  const [decision, setDecision] = useState('ADMIS')
  const [decisions, setDecisions] = useState([])
  const [isCloturerConfirmOpen, setCloturerConfirmOpen] = useState(false)
  const [formError, setFormError] = useState('')
  // Aucun moyen de revérifier après coup (pas de GET) — c'est donc le seul
  // retour visible qu'on puisse donner sur le succès de la clôture.
  const [cloturerSuccessMessage, setCloturerSuccessMessage] = useState('')

  const { data: anneesData, isLoading: isLoadingAnnees } = useQuery({
    queryKey: ['academique', 'annees', etablissementId],
    queryFn: () => listAnneesScolaires(etablissementId),
    enabled: Boolean(etablissementId),
  })
  const annees = Array.isArray(anneesData) ? anneesData : (anneesData?.items ?? [])
  const anneeOptions = annees.map((a) => ({ value: a.id, label: a.libelle }))

  useEffect(() => {
    setAnneeScolaireId('')
  }, [etablissementId])

  useEffect(() => {
    if (anneeScolaireId || annees.length === 0) return
    const enCours = annees.find((a) => a.statut === 'EN_COURS')
    const fallback = annees.slice().sort((a, b) => (b.dateDebut ?? '').localeCompare(a.dateDebut ?? ''))[0]
    setAnneeScolaireId((enCours ?? fallback)?.id ?? '')
  }, [annees, anneeScolaireId])

  const { data: anneeDetail } = useQuery({
    queryKey: ['academique', 'annee-detail', etablissementId, anneeScolaireId],
    queryFn: () => getAnneeScolaire(etablissementId, anneeScolaireId),
    enabled: Boolean(etablissementId && anneeScolaireId),
  })
  const trimestres = anneeDetail?.trimestres ?? []
  const trimestreOptions = trimestres.map((t, i) => ({ value: t.id, label: t.libelle ?? `Trimestre ${i + 1}` }))

  useEffect(() => {
    setTrimestreId('')
  }, [anneeScolaireId])

  useEffect(() => {
    if (trimestreId || trimestres.length === 0) return
    setTrimestreId(trimestres[0].id)
  }, [trimestres, trimestreId])

  const { data: classesData } = useQuery({
    queryKey: ['academique', 'classes', etablissementId, anneeScolaireId],
    queryFn: () => listClasses(etablissementId, anneeScolaireId),
    enabled: Boolean(etablissementId && anneeScolaireId),
  })
  const classes = Array.isArray(classesData) ? classesData : (classesData?.items ?? [])
  const classeOptions = classes.map((c) => ({
    value: c.id,
    label: `${c.nom} (${NIVEAU_LABELS[c.niveau?.libelle] ?? c.niveau?.libelle ?? ''})`,
  }))

  useEffect(() => {
    setClasseId('')
  }, [anneeScolaireId])

  useEffect(() => {
    if (classeId || classes.length === 0) return
    setClasseId(classes[0].id)
  }, [classes, classeId])

  const { data: employesData } = useQuery({
    queryKey: ['rh', 'employes', 'options', etablissementId],
    queryFn: () => searchEmployes(etablissementId),
    enabled: Boolean(etablissementId),
  })
  const employeOptions = (employesData ?? []).map((e) => ({ value: e.id, label: `${e.prenom ?? ''} ${e.nom ?? ''}`.trim() }))

  // Roster réel de la classe (nouvel endpoint ajouté par le backend) — les
  // décisions ne concernent que les élèves de CETTE classe.
  const { data: elevesData } = useQuery({
    queryKey: ['eleves', 'classe-roster', etablissementId, classeId],
    queryFn: () => listElevesClasse(etablissementId, classeId, { limit: 100 }),
    enabled: Boolean(etablissementId && classeId),
  })
  const eleveOptions = (elevesData?.items ?? []).map((e) => ({
    value: e.id,
    label: `${e.prenom ?? ''} ${e.nom ?? ''}`.trim() + (e.matricule ? ` (${e.matricule})` : ''),
  }))

  const createMutation = useMutation({
    mutationFn: () => createDeliberation(etablissementId, { trimestreId, classeId }),
    onSuccess: (result) => {
      setDeliberation(result)
      setFormError('')
      setCloturerSuccessMessage('')
    },
    onError: (err) => setFormError(err instanceof ApiError ? err.message : 'Une erreur est survenue.'),
  })

  const membreMutation = useMutation({
    mutationFn: () => ajouterMembreDeliberation(etablissementId, deliberation.id, { employeId: membreEmployeId, role: membreRole }),
    onSuccess: () => {
      setMembres((list) => [...list, { employeId: membreEmployeId, role: membreRole }])
      setMembreEmployeId('')
    },
  })

  const decisionMutation = useMutation({
    mutationFn: () => ajouterDecisionDeliberation(etablissementId, deliberation.id, { eleveId: decisionEleveId, decision }),
    onSuccess: () => {
      setDecisions((list) => [...list, { eleveId: decisionEleveId, decision }])
      setDecisionEleveId('')
    },
  })

  const cloturerMutation = useMutation({
    mutationFn: () => cloturerDeliberation(etablissementId, deliberation.id),
    onSuccess: () => {
      setCloturerConfirmOpen(false)
      setCloturerSuccessMessage(
        `Délibération de ${classeOptions.find((c) => c.value === classeId)?.label ?? 'la classe'} (${trimestreOptions.find((t) => t.value === trimestreId)?.label ?? 'ce trimestre'}) clôturée avec ${membres.length} membre(s) et ${decisions.length} décision(s).`,
      )
      setDeliberation(null)
      setMembres([])
      setDecisions([])
    },
    onError: (err) => setFormError(err instanceof ApiError ? err.message : 'Une erreur est survenue.'),
  })

  if (!isLoadingAnnees && annees.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-dashed border-warning-500/40 p-10 text-center">
        <AlertTriangle className="h-8 w-8 mx-auto mb-3 text-warning-500" />
        <p className="font-heading font-semibold text-ink-900 mb-1">Aucune année scolaire</p>
      </div>
    )
  }

  return (
    <div>
      <Alert variant="warning" className="mb-4">
        L'API ne permet pas de retrouver une délibération déjà créée (pas d'endpoint de liste) — reste sur cet
        écran jusqu'à la clôture, recharger la page la perd.
      </Alert>

      {cloturerSuccessMessage && (
        <Alert variant="success" className="mb-4">
          {cloturerSuccessMessage}
        </Alert>
      )}

      {!deliberation ? (
        <div className="bg-white rounded-2xl border border-ink-100 p-5">
          <p className="font-heading font-semibold text-ink-900 mb-4">Ouvrir une délibération</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <Select id="annee-filter" label="Année scolaire" options={anneeOptions} value={anneeScolaireId} onChange={(e) => setAnneeScolaireId(e.target.value)} />
            <Select
              id="trimestre-filter"
              label="Trimestre"
              options={trimestreOptions.length ? trimestreOptions : [{ value: '', label: 'Aucun trimestre' }]}
              value={trimestreId}
              onChange={(e) => setTrimestreId(e.target.value)}
            />
            <Select
              id="classe-filter"
              label="Classe"
              options={classeOptions.length ? classeOptions : [{ value: '', label: 'Aucune classe' }]}
              value={classeId}
              onChange={(e) => setClasseId(e.target.value)}
            />
          </div>
          {formError && <Alert variant="danger" className="mb-4">{formError}</Alert>}
          <Button disabled={!trimestreId || !classeId} isLoading={createMutation.isPending} onClick={() => createMutation.mutate()}>
            <Plus className="h-4 w-4" />
            Créer la délibération
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-ink-100 p-5">
            <p className="font-heading font-semibold text-ink-900 mb-1">
              Délibération — {classeOptions.find((c) => c.value === classeId)?.label}
            </p>
            <p className="text-sm text-ink-500 mb-4">{trimestreOptions.find((t) => t.value === trimestreId)?.label}</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Users className="h-4 w-4 text-ink-400" />
                  <p className="text-sm font-medium text-ink-900">Membres</p>
                </div>
                <div className="space-y-2 mb-3">
                  {membres.map((m, i) => (
                    <div key={i} className="flex items-center justify-between text-sm rounded-lg border border-ink-100 px-3 py-1.5">
                      <span className="text-ink-900">{employeOptions.find((o) => o.value === m.employeId)?.label ?? m.employeId}</span>
                      <Badge variant="neutral">{ROLE_OPTIONS.find((r) => r.value === m.role)?.label}</Badge>
                    </div>
                  ))}
                  {membres.length === 0 && <p className="text-xs text-ink-400">Aucun membre ajouté.</p>}
                </div>
                <div className="flex gap-2">
                  <Combobox options={employeOptions} value={membreEmployeId} onChange={setMembreEmployeId} placeholder="Employé..." className="flex-1" />
                  <Select options={ROLE_OPTIONS} value={membreRole} onChange={(e) => setMembreRole(e.target.value)} className="w-32 shrink-0" />
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={!membreEmployeId}
                    isLoading={membreMutation.isPending}
                    onClick={() => membreMutation.mutate()}
                  >
                    Ajouter
                  </Button>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 className="h-4 w-4 text-ink-400" />
                  <p className="text-sm font-medium text-ink-900">Décisions</p>
                </div>
                <div className="space-y-2 mb-3">
                  {decisions.map((d, i) => (
                    <div key={i} className="flex items-center justify-between text-sm rounded-lg border border-ink-100 px-3 py-1.5">
                      <span className="text-ink-900">{eleveOptions.find((o) => o.value === d.eleveId)?.label ?? d.eleveId}</span>
                      <Badge variant={decisionBadgeVariant(d.decision)}>{DECISION_LABELS[d.decision]}</Badge>
                    </div>
                  ))}
                  {decisions.length === 0 && <p className="text-xs text-ink-400">Aucune décision ajoutée.</p>}
                </div>
                <div className="flex gap-2">
                  <Combobox options={eleveOptions} value={decisionEleveId} onChange={setDecisionEleveId} placeholder="Élève..." className="flex-1" />
                  <Select options={DECISION_OPTIONS} value={decision} onChange={(e) => setDecision(e.target.value)} className="w-32 shrink-0" />
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={!decisionEleveId}
                    isLoading={decisionMutation.isPending}
                    onClick={() => decisionMutation.mutate()}
                  >
                    Ajouter
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 mt-4 border-t border-ink-100">
              <Button onClick={() => setCloturerConfirmOpen(true)}>Clôturer la délibération</Button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={isCloturerConfirmOpen}
        onClose={() => setCloturerConfirmOpen(false)}
        onConfirm={() => cloturerMutation.mutate()}
        isLoading={cloturerMutation.isPending}
        title="Clôturer cette délibération ?"
        description="Action non réversible depuis l'interface — assure-toi que toutes les décisions sont ajoutées."
        confirmLabel="Clôturer"
      />
    </div>
  )
}
