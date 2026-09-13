import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Dices, Eye, EyeOff } from 'lucide-react'
import { Button } from '../../../components/ui/Button'
import { TextField } from '../../../components/ui/TextField'
import { Select } from '../../../components/ui/Select'
import { Combobox } from '../../../components/ui/Combobox'
import { Alert } from '../../../components/ui/Alert'
import { ApiError } from '../../../api/client'
import { rules, validate } from '../../../lib/validate'
import { generatePassword } from '../../../lib/generatePassword'
import { searchEtablissements } from '../../../api/etablissements'
import { searchEmployes } from '../../../api/rh'
import { useAuth } from '../../../auth/AuthContext'
import { getPrimaryRole } from '../../../auth/roleHome'
import { getAssignableRoleOptions } from '../../../config/roles'
import { ROLE_TO_EMPLOYE_TYPE } from '../../../config/rhLabels'

const BASE_FORM = {
  prenom: '',
  nom: '',
  email: '',
  telephone: '',
  password: '',
}

/** Formulaire de création d'un compte utilisateur (POST /api/users). */
export function UserForm({ onSubmit, onCancel, isSubmitting }) {
  const { user: currentUser } = useAuth()
  const primaryRole = getPrimaryRole(currentUser)
  // Seuls les rôles que CE compte a le droit d'attribuer apparaissent —
  // un Directeur ne voit jamais "Directeur" ni "Administrateur" ici.
  const roleOptions = getAssignableRoleOptions(primaryRole)
  // Seul l'Admin voit la liste des établissements (confirmé : le Directeur
  // reçoit un 403 "Rôle requis: ADMINISTRATEUR" sur /api/etablissements).
  // Pour lui, le compte créé est automatiquement rattaché au sien.
  const canPickEtablissement = primaryRole === 'ADMINISTRATEUR'

  const [form, setForm] = useState({
    ...BASE_FORM,
    roleCode: roleOptions[0]?.value ?? '',
    etablissementId: canPickEtablissement ? '' : (currentUser?.etablissementId ?? ''),
    profilId: '',
  })
  const [fieldErrors, setFieldErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const { data: etablissementsData } = useQuery({
    queryKey: ['etablissements', 'options'],
    queryFn: () => searchEtablissements({ limit: 100 }),
    enabled: canPickEtablissement,
  })
  const etablissementOptions = (etablissementsData?.items ?? []).map((e) => ({
    value: e.id,
    label: e.nom,
  }))

  const isParent = form.roleCode === 'PARENT'
  const showEtablissementField = canPickEtablissement && !isParent

  // Le rôle choisi détermine s'il faut lier une fiche Employé (RH) — c'est
  // elle qui porte contrat/salaire, le compte n'est qu'un accès de
  // connexion par-dessus (voir CreateUserDto.profilId).
  const employeType = ROLE_TO_EMPLOYE_TYPE[form.roleCode]
  const employeEtablissementId = canPickEtablissement
    ? form.etablissementId
    : (currentUser?.etablissementId ?? '')

  const { data: employesData, isError: isEmployesError, error: employesError } = useQuery({
    queryKey: ['rh', 'employes', 'options', employeEtablissementId, employeType],
    queryFn: () => searchEmployes(employeEtablissementId, { type: employeType }),
    enabled: Boolean(employeType && employeEtablissementId),
  })
  const employesList = Array.isArray(employesData) ? employesData : (employesData?.items ?? [])
  const employeOptions = employesList.map((e) => ({
    value: e.id,
    label: `${e.prenom ?? ''} ${e.nom ?? ''}`.trim(),
  }))

  const schema = {
    prenom: [rules.required('Le prénom est requis.')],
    nom: [rules.required('Le nom est requis.')],
    email: [rules.required("L'email est requis."), rules.email()],
    password: [rules.required('Le mot de passe est requis.'), rules.minLength(8)],
    ...(showEtablissementField
      ? { etablissementId: [rules.required("Sélectionnez l'établissement.")] }
      : {}),
  }

  function update(field) {
    return (e) => {
      setForm((f) => ({ ...f, [field]: e.target.value }))
      setFieldErrors((errs) => ({ ...errs, [field]: undefined }))
    }
  }

  // Combobox renvoie directement la valeur choisie (pas un événement).
  function updateEtablissement(value) {
    setForm((f) => ({ ...f, etablissementId: value }))
    setFieldErrors((errs) => ({ ...errs, etablissementId: undefined }))
  }

  // En choisissant une fiche existante, on reprend son nom/prénom pour
  // éviter la ressaisie et garantir que le compte porte bien le même nom
  // que la fiche RH à laquelle il est lié.
  function updateProfilId(value) {
    const employe = employesList.find((e) => e.id === value)
    setForm((f) => ({
      ...f,
      profilId: value,
      ...(employe ? { nom: employe.nom ?? f.nom, prenom: employe.prenom ?? f.prenom } : {}),
    }))
    setFieldErrors((errs) => ({ ...errs, nom: undefined, prenom: undefined }))
  }

  // Changer de rôle change aussi le type de fiche Employé attendu : on
  // repart d'une sélection vide plutôt que de garder un id incohérent.
  function updateRoleCode(e) {
    setForm((f) => ({ ...f, roleCode: e.target.value, profilId: '' }))
  }

  function handleGeneratePassword() {
    setForm((f) => ({ ...f, password: generatePassword() }))
    setFieldErrors((errs) => ({ ...errs, password: undefined }))
    setShowPassword(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setFormError('')

    const errors = validate(form, schema)
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return

    try {
      const payload = Object.fromEntries(
        Object.entries(form).filter(([, v]) => v !== ''),
      )
      if (isParent) delete payload.etablissementId
      await onSubmit(payload)
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Une erreur est survenue.')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <TextField
          id="prenom"
          label="Prénom"
          required
          value={form.prenom}
          onChange={update('prenom')}
          error={fieldErrors.prenom}
          placeholder="Abdoulaye"
        />
        <TextField
          id="nom"
          label="Nom"
          required
          value={form.nom}
          onChange={update('nom')}
          error={fieldErrors.nom}
          placeholder="Soumah"
        />
      </div>

      <TextField
        id="email"
        label="Adresse e-mail"
        type="email"
        required
        value={form.email}
        onChange={update('email')}
        error={fieldErrors.email}
        placeholder="directeur@ecole.gn"
      />

      <TextField
        id="telephone"
        label="Téléphone"
        value={form.telephone}
        onChange={update('telephone')}
        placeholder="+224620000000"
      />

      <div
        className={
          showEtablissementField ? 'grid grid-cols-1 sm:grid-cols-2 gap-4' : ''
        }
      >
        <Select
          id="roleCode"
          label="Rôle"
          options={roleOptions}
          value={form.roleCode}
          onChange={updateRoleCode}
          required
        />
        {showEtablissementField && (
          <Combobox
            id="etablissementId"
            label="Établissement"
            options={etablissementOptions}
            value={form.etablissementId}
            onChange={updateEtablissement}
            placeholder="Sélectionner un établissement..."
            searchPlaceholder="Rechercher une école..."
            error={fieldErrors.etablissementId}
            required
          />
        )}
      </div>
      {isParent && (
        <p className="text-xs text-ink-400 -mt-2">
          Un compte parent est global : il pourra être rattaché à un ou
          plusieurs établissements via ses enfants.
        </p>
      )}
      {!canPickEtablissement && !isParent && (
        <p className="text-xs text-ink-400 -mt-2">
          Ce compte sera automatiquement rattaché à ton établissement.
        </p>
      )}

      {employeType && (
        <div>
          <Combobox
            id="profilId"
            label="Fiche employé à lier (recommandé)"
            options={employeOptions}
            value={form.profilId}
            onChange={updateProfilId}
            placeholder={
              employeOptions.length ? 'Sélectionner une fiche existante...' : 'Aucune fiche disponible'
            }
            searchPlaceholder="Rechercher un employé..."
          />
          {isEmployesError ? (
            <Alert variant="danger" className="mt-1.5">
              Impossible de charger les fiches employé :{' '}
              {employesError instanceof ApiError ? employesError.message : 'erreur inconnue'}
            </Alert>
          ) : (
            <p className="text-xs text-ink-400 mt-1.5">
              Sans fiche liée, le compte n'apparaîtra pas dans les Ressources
              humaines (contrat, salaire, congés...). Crée d'abord la fiche
              dans "Ressources humaines" si elle n'existe pas encore.
            </p>
          )}
        </div>
      )}

      <div>
        <TextField
          id="password"
          label="Mot de passe"
          type={showPassword ? 'text' : 'password'}
          required
          value={form.password}
          onChange={update('password')}
          error={fieldErrors.password}
          placeholder="8 caractères minimum"
          endAdornment={
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="text-ink-400 hover:text-ink-600 transition-colors"
              aria-label={showPassword ? 'Masquer' : 'Afficher'}
            >
              {showPassword ? (
                <EyeOff className="h-4.5 w-4.5" />
              ) : (
                <Eye className="h-4.5 w-4.5" />
              )}
            </button>
          }
        />
        <button
          type="button"
          onClick={handleGeneratePassword}
          className="inline-flex items-center gap-1.5 text-xs text-primary-600 hover:text-primary-700 font-medium mt-1.5"
        >
          <Dices className="h-3.5 w-3.5" />
          Générer un mot de passe sécurisé
        </button>
      </div>

      {formError && <Alert variant="danger">{formError}</Alert>}

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit" isLoading={isSubmitting}>
          Créer le compte
        </Button>
      </div>
    </form>
  )
}
