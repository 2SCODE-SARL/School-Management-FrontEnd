import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ChevronDown } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { TextField } from '../../components/ui/TextField'
import { Select } from '../../components/ui/Select'
import { Alert } from '../../components/ui/Alert'
import { ApiError } from '../../api/client'
import { listClasseMatieres, listSalles } from '../../api/academique'
import { searchEmployes } from '../../api/rh'
import { rules, validate } from '../../lib/validate'
import { JOUR_SEMAINE_OPTIONS, TYPE_ACTIVITE_OPTIONS } from '../../config/emploiDuTempsLabels'
import { EnseignantPickerModal } from '../academique/EnseignantPickerModal'

const EMPTY_FORM = {
  matiereId: '',
  employeId: '',
  salleId: '',
  jourSemaine: '1',
  heureDebut: '08:00',
  heureFin: '09:00',
  date: '',
  chapitre: '',
  typeActivite: 'COURS',
}

/**
 * Création OU édition d'un cours planifié. La matière propose seulement
 * celles déjà affectées à la classe (Académique → Classes → Affecter une
 * matière) — chacune porte son propre `enseignantId`, repris automatiquement
 * ici, modifiable ensuite via le sélecteur enseignant si besoin.
 */
export function CoursForm({ etablissementId, classeId, initialValues, onSubmit, onCancel, isSubmitting }) {
  const isEdit = Boolean(initialValues)
  const [form, setForm] = useState(() => ({
    ...EMPTY_FORM,
    ...(initialValues
      ? {
          matiereId: initialValues.matiereId ?? '',
          employeId: initialValues.employeId ?? '',
          salleId: initialValues.salleId ?? '',
          jourSemaine: String(initialValues.jourSemaine ?? '1'),
          heureDebut: initialValues.heureDebut ?? '08:00',
          heureFin: initialValues.heureFin ?? '09:00',
          date: initialValues.date?.slice(0, 10) ?? '',
          chapitre: initialValues.chapitre ?? '',
          typeActivite: initialValues.typeActivite ?? 'COURS',
        }
      : {}),
  }))
  const [isPickerOpen, setPickerOpen] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})
  const [formError, setFormError] = useState('')

  const { data: matieresClasseData } = useQuery({
    queryKey: ['academique', 'classes', 'matieres', etablissementId, classeId],
    queryFn: () => listClasseMatieres(etablissementId, classeId),
    enabled: Boolean(etablissementId && classeId),
  })
  const matieresClasse = Array.isArray(matieresClasseData)
    ? matieresClasseData
    : (matieresClasseData?.items ?? [])
  const matiereOptions = matieresClasse.map((item) => ({
    value: item.matiereId,
    label: item.matiere?.intitule ?? 'Matière',
  }))

  const { data: sallesData } = useQuery({
    queryKey: ['academique', 'salles', etablissementId],
    queryFn: () => listSalles(etablissementId),
    enabled: Boolean(etablissementId),
  })
  const salles = Array.isArray(sallesData) ? sallesData : (sallesData?.items ?? [])
  const salleOptions = salles.map((s) => ({ value: s.id, label: s.numero }))

  const { data: employesData } = useQuery({
    queryKey: ['rh', 'employes', 'options', etablissementId, 'ENSEIGNANT'],
    queryFn: () => searchEmployes(etablissementId, { type: 'ENSEIGNANT' }),
    enabled: Boolean(etablissementId),
  })
  const employesList = Array.isArray(employesData) ? employesData : (employesData?.items ?? [])
  const enseignantLabelById = Object.fromEntries(
    employesList.map((e) => [e.id, `${e.prenom ?? ''} ${e.nom ?? ''}`.trim()]),
  )

  function update(field) {
    return (e) => {
      const value = e.target.value
      setForm((f) => ({ ...f, [field]: value }))
      setFieldErrors((errs) => ({ ...errs, [field]: undefined }))
      // Reprend l'enseignant déjà affecté à cette matière pour la classe,
      // s'il y en a un — évite la ressaisie dans le cas courant.
      if (field === 'matiereId') {
        const matiere = matieresClasse.find((m) => m.matiereId === value)
        if (matiere?.enseignantId) {
          setForm((f) => ({ ...f, matiereId: value, employeId: matiere.enseignantId }))
        }
      }
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setFormError('')

    const errors = validate(form, {
      matiereId: [rules.required('La matière est requise.')],
      employeId: [rules.required("L'enseignant est requis.")],
      salleId: [rules.required('La salle est requise.')],
      heureDebut: [rules.required("L'heure de début est requise.")],
      heureFin: [rules.required("L'heure de fin est requise.")],
    })
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return

    const payload = {
      matiereId: form.matiereId,
      employeId: form.employeId,
      salleId: form.salleId,
      heureDebut: form.heureDebut,
      heureFin: form.heureFin,
      ...(form.chapitre ? { chapitre: form.chapitre } : {}),
    }
    if (!isEdit) {
      payload.classeId = classeId
      payload.jourSemaine = Number(form.jourSemaine)
      payload.typeActivite = form.typeActivite
      if (form.date) payload.date = form.date
    }

    try {
      await onSubmit(payload)
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Une erreur est survenue.')
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Select
          id="matiereId"
          label="Matière"
          options={[{ value: '', label: 'Choisir une matière...' }, ...matiereOptions]}
          value={form.matiereId}
          onChange={update('matiereId')}
          error={fieldErrors.matiereId}
          required
        />

        <div>
          <label className="block text-sm font-medium text-ink-700 mb-1.5">
            Enseignant <span className="text-danger-500">*</span>
          </label>
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className={[
              'w-full flex items-center justify-between gap-2 rounded-lg border bg-white px-3 py-2.5 text-sm text-left transition-colors',
              fieldErrors.employeId
                ? 'border-danger-400 focus:ring-4 focus:ring-danger-500/10'
                : 'border-ink-200 hover:border-ink-300 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10',
            ].join(' ')}
          >
            <span className={form.employeId ? 'text-ink-900' : 'text-ink-400'}>
              {form.employeId ? (enseignantLabelById[form.employeId] ?? 'Enseignant') : 'Choisir un enseignant...'}
            </span>
            <ChevronDown className="h-4 w-4 text-ink-400 shrink-0" />
          </button>
          {fieldErrors.employeId && <p className="text-xs text-danger-600 mt-1.5">{fieldErrors.employeId}</p>}
        </div>

        <Select
          id="salleId"
          label="Salle"
          options={[{ value: '', label: 'Choisir une salle...' }, ...salleOptions]}
          value={form.salleId}
          onChange={update('salleId')}
          error={fieldErrors.salleId}
          required
        />

        {!isEdit && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              id="jourSemaine"
              label="Jour de la semaine"
              options={JOUR_SEMAINE_OPTIONS}
              value={form.jourSemaine}
              onChange={update('jourSemaine')}
              required
            />
            <Select
              id="typeActivite"
              label="Type d'activité"
              options={TYPE_ACTIVITE_OPTIONS}
              value={form.typeActivite}
              onChange={update('typeActivite')}
              required
            />
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <TextField
            id="heureDebut"
            label="Heure de début"
            type="time"
            required
            value={form.heureDebut}
            onChange={update('heureDebut')}
            error={fieldErrors.heureDebut}
          />
          <TextField
            id="heureFin"
            label="Heure de fin"
            type="time"
            required
            value={form.heureFin}
            onChange={update('heureFin')}
            error={fieldErrors.heureFin}
          />
        </div>

        {!isEdit && (
          <TextField
            id="date"
            label="Séance ponctuelle à une date précise (optionnel)"
            type="date"
            value={form.date}
            onChange={update('date')}
          />
        )}

        <TextField
          id="chapitre"
          label="Chapitre (optionnel)"
          value={form.chapitre}
          onChange={update('chapitre')}
          placeholder="Chapitre 3 — Fractions"
        />

        {formError && <Alert variant="danger">{formError}</Alert>}

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onCancel}>
            Annuler
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            {isEdit ? 'Enregistrer les modifications' : 'Créer le cours'}
          </Button>
        </div>
      </form>

      <EnseignantPickerModal
        open={isPickerOpen}
        onClose={() => setPickerOpen(false)}
        employes={employesList}
        onSelect={(employeId) => {
          setForm((f) => ({ ...f, employeId }))
          setFieldErrors((errs) => ({ ...errs, employeId: undefined }))
        }}
      />
    </>
  )
}
