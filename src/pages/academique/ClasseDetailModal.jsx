import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { BookOpen, ChevronDown, Layers, Pencil, Plus, Trash2 } from 'lucide-react'
import {
  assignMatiereClasse,
  getClasse,
  listClasseMatieres,
  listMatieres,
  removeMatiereClasse,
} from '../../api/academique'
import { searchEmployes } from '../../api/rh'
import { Modal } from '../../components/ui/Modal'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Select } from '../../components/ui/Select'
import { TextField } from '../../components/ui/TextField'
import { Alert } from '../../components/ui/Alert'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { ApiError } from '../../api/client'
import { rules, validate } from '../../lib/validate'
import { EnseignantPickerModal } from './EnseignantPickerModal'

/** Petit formulaire d'affectation d'une matière à la classe. */
function AssignMatiereForm({ matiereOptions, employesList, enseignantLabelById, onCancel, onSubmit, isSubmitting }) {
  const [matiereId, setMatiereId] = useState(matiereOptions[0]?.value ?? '')
  const [coefficient, setCoefficient] = useState('')
  const [enseignantId, setEnseignantId] = useState('')
  const [isPickerOpen, setPickerOpen] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})
  const [formError, setFormError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setFormError('')
    const errors = validate({ matiereId }, { matiereId: [rules.required('Choisis une matière.')] })
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return

    const payload = { matiereId }
    if (coefficient !== '') payload.coefficient = Number(coefficient)
    if (enseignantId) payload.enseignantId = enseignantId

    try {
      await onSubmit(payload)
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Une erreur est survenue.')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Select
        id="matiereId"
        label="Matière"
        options={matiereOptions}
        value={matiereId}
        onChange={(e) => setMatiereId(e.target.value)}
        error={fieldErrors.matiereId}
        required
      />
      <TextField
        id="coefficient"
        label="Coefficient pour cette classe (optionnel)"
        type="number"
        value={coefficient}
        onChange={(e) => setCoefficient(e.target.value)}
        placeholder="Laisse vide pour garder celui de la matière"
      />
      <div>
        <label className="block text-sm font-medium text-ink-700 mb-1.5">Enseignant</label>
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          className="w-full flex items-center justify-between gap-2 rounded-lg border border-ink-200 bg-white px-3 py-2.5 text-sm text-left hover:border-ink-300 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-colors"
        >
          <span className={enseignantId ? 'text-ink-900' : 'text-ink-400'}>
            {enseignantId ? (enseignantLabelById[enseignantId] ?? 'Enseignant') : 'Non affecté pour le moment'}
          </span>
          <ChevronDown className="h-4 w-4 text-ink-400 shrink-0" />
        </button>
      </div>

      {formError && <Alert variant="danger">{formError}</Alert>}
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit" isLoading={isSubmitting}>
          Affecter
        </Button>
      </div>

      <EnseignantPickerModal
        open={isPickerOpen}
        onClose={() => setPickerOpen(false)}
        employes={employesList}
        onSelect={setEnseignantId}
      />
    </form>
  )
}

/** Détail d'une classe : infos + matières affectées (ajout/retrait inclus). */
export function ClasseDetailModal({ etablissementId, classeId, onClose, onEdit }) {
  const [isAssignOpen, setAssignOpen] = useState(false)
  const [removingMatiereId, setRemovingMatiereId] = useState(null)
  const queryClient = useQueryClient()

  const classeQueryKey = ['academique', 'classes', 'detail', etablissementId, classeId]
  const { data: classe, isLoading, isError } = useQuery({
    queryKey: classeQueryKey,
    queryFn: () => getClasse(etablissementId, classeId),
    enabled: Boolean(etablissementId && classeId),
  })

  const matieresClasseKey = ['academique', 'classes', 'matieres', etablissementId, classeId]
  const { data: matieresClasseData } = useQuery({
    queryKey: matieresClasseKey,
    queryFn: () => listClasseMatieres(etablissementId, classeId),
    enabled: Boolean(etablissementId && classeId),
  })
  const matieresClasse = Array.isArray(matieresClasseData)
    ? matieresClasseData
    : (matieresClasseData?.items ?? [])

  const { data: matieresData } = useQuery({
    queryKey: ['academique', 'matieres', etablissementId],
    queryFn: () => listMatieres(etablissementId),
    enabled: Boolean(etablissementId),
  })
  const allMatieres = Array.isArray(matieresData) ? matieresData : (matieresData?.items ?? [])
  const assignedIds = new Set(
    matieresClasse.map((item) => item.matiereId ?? item.matiere?.id ?? item.id),
  )
  const matiereOptions = allMatieres
    .filter((m) => !assignedIds.has(m.id))
    .map((m) => ({ value: m.id, label: m.intitule }))

  // `enseignantId` attend l'id d'une fiche Employé (RH), pas celui d'un
  // compte Utilisateur — ce sont deux ressources distinctes côté API (voir
  // api/rh.js). D'où l'erreur "Enseignant introuvable" quand on envoyait
  // l'id d'un compte Utilisateur ayant le rôle Enseignant.
  const { data: employesData } = useQuery({
    queryKey: ['rh', 'employes', 'options', etablissementId],
    queryFn: () => searchEmployes(etablissementId, { type: 'ENSEIGNANT' }),
    enabled: Boolean(etablissementId),
  })
  const employesList = Array.isArray(employesData) ? employesData : (employesData?.items ?? [])
  const enseignantLabelById = Object.fromEntries(
    employesList.map((e) => [e.id, `${e.prenom ?? ''} ${e.nom ?? ''}`.trim()]),
  )

  function invalidateAll() {
    queryClient.invalidateQueries({ queryKey: matieresClasseKey })
    queryClient.invalidateQueries({ queryKey: classeQueryKey })
  }

  const assignMutation = useMutation({
    mutationFn: (payload) => assignMatiereClasse(etablissementId, classeId, payload),
    onSuccess: () => {
      invalidateAll()
      setAssignOpen(false)
    },
  })

  const removeMutation = useMutation({
    mutationFn: (matiereId) => removeMatiereClasse(etablissementId, classeId, matiereId),
    onSuccess: () => {
      invalidateAll()
      setRemovingMatiereId(null)
    },
  })

  return (
    <>
      <Modal open={Boolean(classeId)} onClose={onClose} title="Détail de la classe">
        {isLoading && (
          <div className="p-8 flex justify-center">
            <div className="h-8 w-8 rounded-full border-2 border-ink-200 border-t-primary-600 animate-spin" />
          </div>
        )}
        {isError && (
          <p className="text-sm text-danger-600 text-center py-8">Impossible de charger cette classe.</p>
        )}
        {classe && (
          <>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-12 w-12 rounded-xl bg-primary-50 flex items-center justify-center shrink-0">
                <Layers className="h-5 w-5 text-primary-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-heading font-bold text-ink-900 truncate">{classe.nom}</p>
                <p className="text-xs text-ink-400">
                  {classe.niveau?.libelle ?? '—'}
                  {classe.serie ? ` · ${classe.serie.libelle}` : ''}
                </p>
              </div>
              <Badge variant={classe.actif === false ? 'danger' : 'success'} className="shrink-0">
                {classe.actif === false ? 'Inactive' : 'Active'}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-x-4 mb-2 text-sm">
              <div className="py-2.5 border-b border-ink-50">
                <p className="text-xs text-ink-400">Capacité max</p>
                <p className="text-ink-900">{classe.capaciteMax ?? '—'}</p>
              </div>
              <div className="py-2.5 border-b border-ink-50">
                <p className="text-xs text-ink-400">Salle principale</p>
                <p className="text-ink-900">{classe.salle?.numero ?? '—'}</p>
              </div>
            </div>

            <div className="pt-4 border-t border-ink-100">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-ink-900">Matières affectées</p>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setAssignOpen(true)}
                  disabled={matiereOptions.length === 0}
                >
                  <Plus className="h-3.5 w-3.5" />
                  Affecter
                </Button>
              </div>

              {matieresClasse.length === 0 ? (
                <p className="text-sm text-ink-400">Aucune matière affectée pour l'instant.</p>
              ) : (
                <div className="space-y-2">
                  {matieresClasse.map((item, index) => {
                    const matiere = item.matiere ?? item
                    const matiereId = item.matiereId ?? item.matiere?.id ?? item.id
                    const enseignantLabel = item.enseignantId
                      ? (enseignantLabelById[item.enseignantId] ?? 'Enseignant')
                      : null
                    return (
                      <div
                        key={matiereId ?? index}
                        className="flex items-center justify-between gap-3 rounded-lg border border-ink-100 px-3 py-2"
                      >
                        <div className="min-w-0 flex items-center gap-2">
                          <BookOpen className="h-4 w-4 text-ink-400 shrink-0" />
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-ink-900 truncate">
                              {matiere.intitule ?? 'Matière'}
                            </p>
                            <p className="text-xs text-ink-400">
                              Coef. {item.coefficient ?? matiere.coefficient ?? '—'}
                              {enseignantLabel ? ` · ${enseignantLabel}` : ' · Aucun enseignant'}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setRemovingMatiereId(matiereId)}
                          className="text-ink-400 hover:text-danger-600 transition-colors shrink-0"
                          aria-label="Retirer cette matière"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="flex flex-wrap justify-end gap-2 pt-5 mt-4 border-t border-ink-100">
              <Button size="sm" onClick={() => onEdit(classe)}>
                <Pencil className="h-3.5 w-3.5" />
                Modifier
              </Button>
            </div>
          </>
        )}
      </Modal>

      <Modal open={isAssignOpen} onClose={() => setAssignOpen(false)} title="Affecter une matière">
        <AssignMatiereForm
          matiereOptions={matiereOptions}
          employesList={employesList}
          enseignantLabelById={enseignantLabelById}
          isSubmitting={assignMutation.isPending}
          onCancel={() => setAssignOpen(false)}
          onSubmit={(payload) => assignMutation.mutateAsync(payload)}
        />
      </Modal>

      <ConfirmDialog
        open={Boolean(removingMatiereId)}
        onClose={() => setRemovingMatiereId(null)}
        onConfirm={() => removeMutation.mutate(removingMatiereId)}
        isLoading={removeMutation.isPending}
        title="Retirer cette matière ?"
        description="La matière ne sera plus enseignée dans cette classe."
        confirmLabel="Retirer"
      />
    </>
  )
}
