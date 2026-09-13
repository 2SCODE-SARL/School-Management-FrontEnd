import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { TextField } from '../../components/ui/TextField'
import { Select } from '../../components/ui/Select'
import { Alert } from '../../components/ui/Alert'
import { ApiError } from '../../api/client'
import { listClasses, listNiveaux } from '../../api/academique'
import { rules, validate } from '../../lib/validate'
import { PARENT_TYPE_OPTIONS, SEXE_OPTIONS } from '../../config/eleveLabels'
import { NIVEAU_LABELS } from '../../config/academiqueLabels'

const EMPTY_ELEVE = {
  prenom: '',
  nom: '',
  dateNaissance: '',
  lieuNaissance: '',
  sexe: 'M',
  quartier: '',
  nationalite: 'Guinéenne',
  telephone: '',
}

const NO_CLASSE_OPTION = { value: '', label: "Laisser l'affectation pour plus tard" }

function emptyParent() {
  return { type: 'PERE', nomPrenom: '', profession: '', telephone: '', email: '', residence: '', lienParente: '' }
}

/** Une ligne de saisie pour un parent/tuteur, à l'intérieur du formulaire de préinscription. */
function ParentFields({ parent, errors, onChange, onRemove, canRemove }) {
  const isTuteur = parent.type === 'TUTEUR'

  function update(field) {
    return (e) => onChange({ ...parent, [field]: e.target.value })
  }

  return (
    <div className="rounded-xl border border-ink-100 p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1">
          <Select id="type" label="Type" options={PARENT_TYPE_OPTIONS} value={parent.type} onChange={update('type')} required />
          <TextField
            id="nomPrenom"
            label="Nom et prénom"
            required
            value={parent.nomPrenom}
            onChange={update('nomPrenom')}
            error={errors?.nomPrenom}
            placeholder="Soumah Abdoulaye"
          />
        </div>
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="mt-7 text-ink-400 hover:text-danger-600 transition-colors shrink-0"
            aria-label="Retirer ce parent"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>

      {isTuteur && (
        <TextField
          id="lienParente"
          label="Lien de parenté"
          required
          value={parent.lienParente}
          onChange={update('lienParente')}
          error={errors?.lienParente}
          placeholder="Oncle, grand-père..."
        />
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <TextField id="telephone" label="Téléphone" value={parent.telephone} onChange={update('telephone')} placeholder="+224620000000" />
        <TextField id="email" label="Email" type="email" value={parent.email} onChange={update('email')} />
      </div>
    </div>
  )
}

/**
 * Préinscription : crée l'élève, ses parents et son dossier d'inscription
 * en une seule requête (`PreinscrireDto`). Le niveau demandé est requis ;
 * la classe demandée reste optionnelle (l'affectation peut se faire plus
 * tard, manuellement ou automatiquement, depuis le détail de l'inscription).
 */
export function PreinscrireForm({ etablissementId, anneeScolaireId, onSubmit, onCancel, isSubmitting }) {
  const [eleve, setEleve] = useState(EMPTY_ELEVE)
  const [niveauDemandeId, setNiveauDemandeId] = useState('')
  const [classeDemandeeId, setClasseDemandeeId] = useState('')
  const [etablissementPrecedent, setEtablissementPrecedent] = useState('')
  const [resultatScolaire, setResultatScolaire] = useState('')
  const [moyenneDernier, setMoyenneDernier] = useState('')
  const [rangDernier, setRangDernier] = useState('')
  const [parents, setParents] = useState([emptyParent()])
  const [fieldErrors, setFieldErrors] = useState({})
  const [parentErrors, setParentErrors] = useState([])
  const [formError, setFormError] = useState('')

  const { data: niveauxData } = useQuery({
    queryKey: ['academique', 'niveaux', etablissementId],
    queryFn: () => listNiveaux(etablissementId),
    enabled: Boolean(etablissementId),
  })
  const niveaux = Array.isArray(niveauxData) ? niveauxData : (niveauxData?.items ?? [])
  const niveauOptions = niveaux.map((n) => ({ value: n.id, label: NIVEAU_LABELS[n.libelle] ?? n.libelle }))

  const { data: classesData } = useQuery({
    queryKey: ['academique', 'classes', etablissementId, anneeScolaireId],
    queryFn: () => listClasses(etablissementId, anneeScolaireId),
    enabled: Boolean(etablissementId && anneeScolaireId),
  })
  const classes = Array.isArray(classesData) ? classesData : (classesData?.items ?? [])
  const classeOptions = [
    NO_CLASSE_OPTION,
    ...classes
      .filter((c) => !niveauDemandeId || c.niveau?.id === niveauDemandeId)
      .map((c) => ({ value: c.id, label: c.nom })),
  ]

  function updateEleveField(field) {
    return (e) => {
      setEleve((f) => ({ ...f, [field]: e.target.value }))
      setFieldErrors((errs) => ({ ...errs, [field]: undefined }))
    }
  }

  function updateParent(index, next) {
    setParents((list) => list.map((p, i) => (i === index ? next : p)))
  }

  function removeParent(index) {
    setParents((list) => list.filter((_, i) => i !== index))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setFormError('')

    const eleveErrors = validate(eleve, {
      prenom: [rules.required('Le prénom est requis.')],
      nom: [rules.required('Le nom est requis.')],
      dateNaissance: [rules.required('La date de naissance est requise.')],
      lieuNaissance: [rules.required('Le lieu de naissance est requis.')],
    })
    const niveauError = niveauDemandeId ? {} : { niveauDemandeId: 'Le niveau demandé est requis.' }
    const parentsErrors = parents.map((p) =>
      validate(p, {
        nomPrenom: [rules.required('Le nom et prénom sont requis.')],
        ...(p.type === 'TUTEUR'
          ? { lienParente: [rules.required('Le lien de parenté est requis pour un tuteur.')] }
          : {}),
      }),
    )

    setFieldErrors({ ...eleveErrors, ...niveauError })
    setParentErrors(parentsErrors)
    const hasErrors =
      Object.keys(eleveErrors).length > 0 ||
      Object.keys(niveauError).length > 0 ||
      parentsErrors.some((e) => Object.keys(e).length > 0)
    if (hasErrors) return

    const payload = {
      anneeScolaireId,
      eleve: Object.fromEntries(Object.entries(eleve).filter(([, v]) => v !== '')),
      niveauDemandeId,
      parents: parents.map((p) => {
        const cleaned = Object.fromEntries(Object.entries(p).filter(([, v]) => v !== ''))
        if (p.type !== 'TUTEUR') delete cleaned.lienParente
        return cleaned
      }),
    }
    if (classeDemandeeId) payload.classeDemandeeId = classeDemandeeId
    if (etablissementPrecedent) payload.etablissementPrecedent = etablissementPrecedent
    if (resultatScolaire) payload.resultatScolaire = resultatScolaire
    if (moyenneDernier !== '') payload.moyenneDernier = Number(moyenneDernier)
    if (rangDernier !== '') payload.rangDernier = Number(rangDernier)

    try {
      await onSubmit(payload)
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Une erreur est survenue.')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <div>
        <p className="text-sm font-medium text-ink-900 mb-3">Élève</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <TextField id="prenom" label="Prénom" required value={eleve.prenom} onChange={updateEleveField('prenom')} error={fieldErrors.prenom} placeholder="Abdoulaye" />
          <TextField id="nom" label="Nom" required value={eleve.nom} onChange={updateEleveField('nom')} error={fieldErrors.nom} placeholder="Soumah" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <TextField id="dateNaissance" label="Date de naissance" type="date" required value={eleve.dateNaissance} onChange={updateEleveField('dateNaissance')} error={fieldErrors.dateNaissance} />
          <Select id="sexe" label="Sexe" options={SEXE_OPTIONS} value={eleve.sexe} onChange={updateEleveField('sexe')} required />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <TextField id="lieuNaissance" label="Lieu de naissance" required value={eleve.lieuNaissance} onChange={updateEleveField('lieuNaissance')} error={fieldErrors.lieuNaissance} placeholder="Conakry" />
          <TextField id="telephone" label="Téléphone" value={eleve.telephone} onChange={updateEleveField('telephone')} placeholder="+224621000000" />
        </div>
      </div>

      <div className="pt-4 border-t border-ink-100">
        <p className="text-sm font-medium text-ink-900 mb-3">Demande</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            id="niveauDemandeId"
            label="Niveau demandé"
            options={[{ value: '', label: 'Choisir un niveau...' }, ...niveauOptions]}
            value={niveauDemandeId}
            onChange={(e) => {
              setNiveauDemandeId(e.target.value)
              setClasseDemandeeId('')
            }}
            error={fieldErrors.niveauDemandeId}
            required
          />
          <Select
            id="classeDemandeeId"
            label="Classe demandée (optionnel)"
            options={classeOptions}
            value={classeDemandeeId}
            onChange={(e) => setClasseDemandeeId(e.target.value)}
          />
        </div>
      </div>

      <div className="pt-4 border-t border-ink-100">
        <p className="text-sm font-medium text-ink-900 mb-3">Scolarité antérieure (optionnel)</p>
        <TextField
          id="etablissementPrecedent"
          label="Établissement précédent"
          value={etablissementPrecedent}
          onChange={(e) => setEtablissementPrecedent(e.target.value)}
          className="mb-4"
        />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <TextField id="resultatScolaire" label="Résultat scolaire" value={resultatScolaire} onChange={(e) => setResultatScolaire(e.target.value)} placeholder="Admis" />
          <TextField id="moyenneDernier" label="Dernière moyenne" type="number" value={moyenneDernier} onChange={(e) => setMoyenneDernier(e.target.value)} placeholder="14.5" />
          <TextField id="rangDernier" label="Dernier rang" type="number" value={rangDernier} onChange={(e) => setRangDernier(e.target.value)} placeholder="3" />
        </div>
      </div>

      <div className="pt-4 border-t border-ink-100">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium text-ink-900">Parents / tuteurs</p>
          <Button type="button" size="sm" variant="secondary" onClick={() => setParents((list) => [...list, emptyParent()])}>
            <Plus className="h-3.5 w-3.5" />
            Ajouter un parent
          </Button>
        </div>
        <div className="space-y-3">
          {parents.map((parent, index) => (
            <ParentFields
              key={index}
              parent={parent}
              errors={parentErrors[index]}
              onChange={(next) => updateParent(index, next)}
              onRemove={() => removeParent(index)}
              canRemove={parents.length > 1}
            />
          ))}
        </div>
      </div>

      {formError && <Alert variant="danger">{formError}</Alert>}

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit" isLoading={isSubmitting}>
          Préinscrire
        </Button>
      </div>
    </form>
  )
}
