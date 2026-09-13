import { useState } from 'react'
import { Button } from '../../components/ui/Button'
import { TextField } from '../../components/ui/TextField'
import { Select } from '../../components/ui/Select'
import { Alert } from '../../components/ui/Alert'
import { ApiError } from '../../api/client'
import { rules, validate } from '../../lib/validate'
import {
  EMPLOYE_TYPE_OPTIONS,
  EMPLOYE_TYPE_TO_DEFAULT_ROLE,
  TYPE_CONTRAT_OPTIONS,
} from '../../config/rhLabels'
import { CompteEmployeFields } from './CompteEmployeFields'

const EMPTY_FORM = {
  type: 'ENSEIGNANT',
  typeContrat: 'PERMANENT',
  prenom: '',
  nom: '',
  dateEmbauche: '',
  salaireBase: '',
  maxHeuresHebdo: '',
}

function emptyCompte(type) {
  return {
    email: '',
    password: '',
    roleCode: EMPLOYE_TYPE_TO_DEFAULT_ROLE[type] ?? 'SECRETAIRE',
    telephone: '',
  }
}

/**
 * Création OU édition d'une fiche Employé. À la création, le compte de
 * connexion peut être créé dans la même requête (`CreateEmployeDto.compte`,
 * imbriqué). En édition, ni le type ni le compte ne sont modifiables ici
 * (absents d'`UpdateEmployeDto` — le type est figé, le compte se gère
 * depuis le détail).
 */
export function EmployeForm({ initialValues, onSubmit, onCancel, isSubmitting }) {
  const isEdit = Boolean(initialValues)
  const [form, setForm] = useState(() =>
    isEdit
      ? {
          ...EMPTY_FORM,
          type: initialValues.type ?? EMPTY_FORM.type,
          typeContrat: initialValues.typeContrat ?? EMPTY_FORM.typeContrat,
          prenom: initialValues.prenom ?? '',
          nom: initialValues.nom ?? '',
          dateEmbauche: initialValues.dateEmbauche?.slice(0, 10) ?? '',
          salaireBase: initialValues.salaireBase ?? '',
          maxHeuresHebdo: initialValues.maxHeuresHebdo ?? '',
        }
      : EMPTY_FORM,
  )
  const [withCompte, setWithCompte] = useState(false)
  const [compte, setCompte] = useState(() => emptyCompte(EMPTY_FORM.type))
  const [fieldErrors, setFieldErrors] = useState({})
  const [compteErrors, setCompteErrors] = useState({})
  const [formError, setFormError] = useState('')

  function update(field) {
    return (e) => {
      const value = e.target.value
      setForm((f) => ({ ...f, [field]: value }))
      setFieldErrors((errs) => ({ ...errs, [field]: undefined }))
      // Le type d'employé suggère un rôle de compte par défaut différent —
      // seulement si le rôle n'a pas déjà été changé à la main.
      if (field === 'type') {
        setCompte((c) => ({ ...c, roleCode: EMPLOYE_TYPE_TO_DEFAULT_ROLE[value] ?? c.roleCode }))
      }
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setFormError('')

    const errors = validate(form, {
      prenom: [rules.required('Le prénom est requis.')],
      nom: [rules.required('Le nom est requis.')],
    })
    const cErrors = !isEdit && withCompte
      ? validate(compte, {
          email: [rules.required("L'email est requis."), rules.email()],
          password: [rules.required('Le mot de passe est requis.'), rules.minLength(8)],
        })
      : {}
    setFieldErrors(errors)
    setCompteErrors(cErrors)
    if (Object.keys(errors).length > 0 || Object.keys(cErrors).length > 0) return

    const editableFields = isEdit
      ? ['typeContrat', 'prenom', 'nom', 'dateEmbauche', 'salaireBase', 'maxHeuresHebdo']
      : Object.keys(form)
    const payload = Object.fromEntries(
      Object.entries(form)
        .filter(([k, v]) => editableFields.includes(k) && v !== '')
        .map(([k, v]) => [k, ['salaireBase', 'maxHeuresHebdo'].includes(k) ? Number(v) : v]),
    )
    if (!isEdit && withCompte) {
      payload.compte = Object.fromEntries(Object.entries(compte).filter(([, v]) => v !== ''))
    }

    try {
      await onSubmit(payload)
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Une erreur est survenue.')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {isEdit ? (
          <div>
            <label className="block text-sm font-medium text-ink-700 mb-1.5">Type d'employé</label>
            <div className="rounded-lg border border-ink-200 bg-ink-50 px-3 py-2.5 text-sm text-ink-500">
              {EMPLOYE_TYPE_OPTIONS.find((o) => o.value === form.type)?.label ?? form.type}
            </div>
          </div>
        ) : (
          <Select id="type" label="Type d'employé" options={EMPLOYE_TYPE_OPTIONS} value={form.type} onChange={update('type')} required />
        )}
        <Select id="typeContrat" label="Type de contrat" options={TYPE_CONTRAT_OPTIONS} value={form.typeContrat} onChange={update('typeContrat')} required />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <TextField id="prenom" label="Prénom" required value={form.prenom} onChange={update('prenom')} error={fieldErrors.prenom} placeholder="Amadou" />
        <TextField id="nom" label="Nom" required value={form.nom} onChange={update('nom')} error={fieldErrors.nom} placeholder="Diallo" />
      </div>

      <TextField id="dateEmbauche" label="Date d'embauche" type="date" value={form.dateEmbauche} onChange={update('dateEmbauche')} />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <TextField id="salaireBase" label="Salaire de base (GNF)" type="number" value={form.salaireBase} onChange={update('salaireBase')} placeholder="300000" />
        <TextField id="maxHeuresHebdo" label="Heures max / semaine" type="number" value={form.maxHeuresHebdo} onChange={update('maxHeuresHebdo')} placeholder="20" />
      </div>

      {!isEdit && (
        <div className="pt-2 border-t border-ink-100">
          <label className="flex items-center gap-2 text-sm text-ink-700 pt-4">
            <input
              type="checkbox"
              checked={withCompte}
              onChange={(e) => setWithCompte(e.target.checked)}
              className="h-4 w-4 rounded border-ink-300 text-primary-600 focus:ring-primary-500"
            />
            Créer aussi son compte de connexion maintenant
          </label>
          {!withCompte && (
            <p className="text-xs text-ink-400 mt-1.5">
              Sans ça, la fiche est créée seule — un compte pourra être
              provisionné plus tard depuis son détail.
            </p>
          )}

          {withCompte && (
            <div className="pt-4">
              <CompteEmployeFields value={compte} onChange={setCompte} errors={compteErrors} />
            </div>
          )}
        </div>
      )}

      {formError && <Alert variant="danger">{formError}</Alert>}

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit" isLoading={isSubmitting}>
          {isEdit ? 'Enregistrer les modifications' : 'Créer'}
        </Button>
      </div>
    </form>
  )
}
