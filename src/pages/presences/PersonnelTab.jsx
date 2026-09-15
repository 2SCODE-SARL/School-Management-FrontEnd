import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ClipboardCheck, Plus } from 'lucide-react'
import { listPersonnelParDate, pointerPersonnel } from '../../api/presences'
import { searchEmployes } from '../../api/rh'
import { useAuth } from '../../auth/AuthContext'
import { getPrimaryRole } from '../../auth/roleHome'
import { ApiErrorMessage } from '../../components/ui/ApiErrorMessage'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { Select } from '../../components/ui/Select'
import { TextField } from '../../components/ui/TextField'
import { Badge } from '../../components/ui/Badge'
import { Alert } from '../../components/ui/Alert'
import { ApiError } from '../../api/client'
import { PERSONNEL_STATUT_LABELS, PERSONNEL_STATUT_OPTIONS, personnelStatutBadgeVariant } from '../../config/presencesLabels'
import { rules, validate } from '../../lib/validate'

const today = () => new Date().toISOString().slice(0, 10)
const nowTime = () => new Date().toTimeString().slice(0, 5)

/** Une heure saisie pour AUJOURD'HUI ne doit pas être dans le futur — évite de pointer en avance. */
function isFutureTime(dateStr, timeStr) {
  if (!timeStr || dateStr !== today()) return false
  return timeStr > nowTime()
}

// La lecture (`GET .../presences/...`) peut renvoyer soit un "HH:MM" nu
// (nouveau format confirmé côté écriture), soit un date-time complet
// (ancien format documenté) — on gère les deux plutôt que de deviner.
function formatHeure(value) {
  if (!value) return '—'
  return value.length <= 5 ? value : value.slice(11, 16)
}

// `restrictedEmploye` : un Enseignant ne pointe QUE sa propre présence — le
// champ devient un affichage figé plutôt qu'un choix libre parmi tout le
// personnel (Directeur/Admin, eux, gardent le sélecteur complet).
//
// `PointerPersonnelDto` distingue deux notions différentes (confirmé par
// la doc à jour) :
// - `heureDebut`/`heureFin` (HH:MM) = le créneau/la séance pointée —
//   permet plusieurs séances par jour pour un même employé. L'API l'exige
//   toujours, mais ce qui compte vraiment pour l'utilisateur c'est l'heure
//   réelle d'arrivée/de départ en classe — donc le créneau est optionnel
//   côté formulaire et se déduit de l'heure réelle si non renseigné.
// - `heureArrivee`/`heureDepart` (date-time) = l'heure RÉELLE d'arrivée/de
//   départ — c'est elle qui est obligatoire ici.
function PointerPersonnelForm({ employeOptions, restrictedEmploye, date, onCancel, onSubmit, isSubmitting }) {
  const [employeId, setEmployeId] = useState(restrictedEmploye?.id ?? '')
  const [statut, setStatut] = useState('PRESENT')
  const [heureDebut, setHeureDebut] = useState('')
  const [heureFin, setHeureFin] = useState('')
  const [heureArriveeReelle, setHeureArriveeReelle] = useState('')
  const [heureDepartReelle, setHeureDepartReelle] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [formError, setFormError] = useState('')

  const isToday = date === today()
  const maxTime = isToday ? nowTime() : undefined

  async function handleSubmit(e) {
    e.preventDefault()
    setFormError('')
    const errors = validate(
      { employeId, heureArriveeReelle, heureDepartReelle },
      {
        employeId: [rules.required("Choisis l'employé.")],
        heureArriveeReelle: [rules.required("L'heure d'arrivée réelle est requise.")],
        heureDepartReelle: [rules.required('L\'heure de départ réelle est requise.')],
      },
    )
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return

    // Empêche de pointer en avance : ni une date future, ni une heure du
    // jour qui n'est pas encore passée (heure réelle, prioritaire, ou
    // créneau si saisi séparément).
    if (date > today()) {
      setFormError('Impossible de pointer pour une date future.')
      return
    }
    if (isFutureTime(date, heureArriveeReelle)) {
      setFormError("L'heure d'arrivée saisie n'est pas encore passée.")
      return
    }
    if (isFutureTime(date, heureDepartReelle)) {
      setFormError("L'heure de départ saisie n'est pas encore passée.")
      return
    }
    if (isFutureTime(date, heureDebut) || isFutureTime(date, heureFin)) {
      setFormError("Ce créneau n'a pas encore eu lieu.")
      return
    }

    // Le créneau reste exigé par l'API — s'il n'est pas renseigné, on
    // retombe sur l'heure réelle (comportement voulu : "il peut même
    // mettre la même heure").
    const payload = {
      employeId,
      date,
      statut,
      heureDebut: heureDebut || heureArriveeReelle,
      heureFin: heureFin || heureDepartReelle,
      heureArrivee: `${date}T${heureArriveeReelle}:00`,
      heureDepart: `${date}T${heureDepartReelle}:00`,
    }

    try {
      await onSubmit(payload)
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Une erreur est survenue.')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {restrictedEmploye ? (
        <div>
          <label className="block text-sm font-medium text-ink-700 mb-1.5">Employé</label>
          <div className="rounded-lg border border-ink-200 bg-ink-50 px-3 py-2.5 text-sm text-ink-900">
            {restrictedEmploye.prenom} {restrictedEmploye.nom} <span className="text-ink-400">(toi)</span>
          </div>
        </div>
      ) : (
        <Select
          id="employeId"
          label="Employé"
          options={[{ value: '', label: 'Choisir un employé...' }, ...employeOptions]}
          value={employeId}
          onChange={(e) => setEmployeId(e.target.value)}
          error={fieldErrors.employeId}
          required
        />
      )}
      <Select
        id="statut"
        label="Statut"
        options={PERSONNEL_STATUT_OPTIONS}
        value={statut}
        onChange={(e) => setStatut(e.target.value)}
        required
      />
      <div>
        <p className="text-sm font-medium text-ink-700 mb-1.5">
          Heure réelle (arrivée/départ en classe)<span className="text-danger-500"> *</span>
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <TextField
            id="heureArriveeReelle"
            label="Arrivée"
            type="time"
            value={heureArriveeReelle}
            onChange={(e) => setHeureArriveeReelle(e.target.value)}
            error={fieldErrors.heureArriveeReelle}
            max={maxTime}
            required
          />
          <TextField
            id="heureDepartReelle"
            label="Départ"
            type="time"
            value={heureDepartReelle}
            onChange={(e) => setHeureDepartReelle(e.target.value)}
            error={fieldErrors.heureDepartReelle}
            max={maxTime}
            required
          />
        </div>
        <p className="text-xs text-ink-400 mt-1.5">Ne peut pas être une heure future — impossible de pointer avant que ce soit arrivé.</p>
      </div>
      <div>
        <p className="text-sm font-medium text-ink-700 mb-1.5">Créneau pointé (optionnel)</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <TextField id="heureDebut" label="Début" type="time" value={heureDebut} onChange={(e) => setHeureDebut(e.target.value)} max={maxTime} />
          <TextField id="heureFin" label="Fin" type="time" value={heureFin} onChange={(e) => setHeureFin(e.target.value)} max={maxTime} />
        </div>
        <p className="text-xs text-ink-400 mt-1.5">
          Permet plusieurs séances dans la journée (ex: 08:00-10:00 puis 14:00-16:00). Laissé vide, l'heure réelle est
          reprise pour le créneau.
        </p>
      </div>
      {formError && <Alert variant="danger">{formError}</Alert>}
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>Annuler</Button>
        <Button type="submit" isLoading={isSubmitting}>Pointer</Button>
      </div>
    </form>
  )
}

/** Présence du personnel — indépendante des cours planifiés. */
export function PersonnelTab({ etablissementId }) {
  const { user } = useAuth()
  const role = getPrimaryRole(user)
  const isEnseignant = role === 'ENSEIGNANT'
  const [date, setDate] = useState(today())
  const [isPointerOpen, setPointerOpen] = useState(false)
  const queryClient = useQueryClient()

  const { data: employesData } = useQuery({
    queryKey: ['rh', 'employes', etablissementId, { q: '', type: '' }],
    queryFn: () => searchEmployes(etablissementId, {}),
    enabled: Boolean(etablissementId),
  })
  const employes = Array.isArray(employesData) ? employesData : (employesData?.items ?? [])
  const employeOptions = employes.map((e) => ({ value: e.id, label: `${e.prenom ?? ''} ${e.nom ?? ''}`.trim() }))
  // Sa propre fiche RH — distincte de son id de compte Utilisateur (voir
  // api/rh.js : Employé et Utilisateur sont deux ressources liées par
  // `utilisateurId`, pas la même chose).
  const ownEmploye = isEnseignant ? employes.find((e) => e.utilisateurId === user?.id) : null

  const queryKey = ['presences', 'personnel', etablissementId, date]
  const { data, isLoading, isError, error } = useQuery({
    queryKey,
    queryFn: () => listPersonnelParDate(etablissementId, date),
    enabled: Boolean(etablissementId && date),
  })
  const presences = Array.isArray(data) ? data : (data?.items ?? [])

  const pointerMutation = useMutation({
    mutationFn: (payload) => pointerPersonnel(etablissementId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey })
      setPointerOpen(false)
    },
  })

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
        <TextField id="date" label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} max={today()} className="max-w-xs" />
        <Button onClick={() => setPointerOpen(true)} disabled={date > today() || (isEnseignant && !ownEmploye)}>
          <Plus className="h-4 w-4" />
          {isEnseignant ? 'Pointer ma présence' : 'Pointer un employé'}
        </Button>
      </div>

      {date > today() && (
        <Alert variant="warning" className="mb-4">
          Impossible de pointer une présence pour une date future.
        </Alert>
      )}

      {isEnseignant && !ownEmploye && (
        <Alert variant="warning" className="mb-4">
          Aucune fiche employé n'est liée à ton compte — demande au Directeur
          de la créer pour pouvoir pointer ta présence.
        </Alert>
      )}

      <div className="bg-white rounded-2xl border border-ink-100 overflow-hidden">
        {isLoading && (
          <div className="p-12 flex justify-center">
            <div className="h-8 w-8 rounded-full border-2 border-ink-200 border-t-primary-600 animate-spin" />
          </div>
        )}
        {isError && <ApiErrorMessage error={error} fallback="Impossible de charger les présences." />}
        {!isLoading && !isError && presences.length === 0 && (
          <div className="p-16 text-center text-ink-400">
            <ClipboardCheck className="h-8 w-8 mx-auto mb-3 opacity-50" />
            Aucun pointage pour cette date.
          </div>
        )}
        {!isLoading && !isError && presences.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-ink-50/80">
                <tr className="text-left text-xs text-ink-500 uppercase tracking-wide border-b border-ink-100">
                  <th className="px-4 py-3 font-medium">Employé</th>
                  <th className="px-4 py-3 font-medium">Créneau</th>
                  <th className="px-4 py-3 font-medium">Arrivée réelle</th>
                  <th className="px-4 py-3 font-medium">Départ réel</th>
                  <th className="px-4 py-3 font-medium">Statut</th>
                </tr>
              </thead>
              <tbody>
                {presences.map((p, i) => (
                  <tr key={p.id ?? i} className="border-b border-ink-50 last:border-0">
                    <td className="px-4 py-3 font-medium text-ink-900">
                      {p.employe ? `${p.employe.prenom ?? ''} ${p.employe.nom ?? ''}`.trim() : (employeOptions.find((o) => o.value === p.employeId)?.label ?? '—')}
                    </td>
                    <td className="px-4 py-3 text-ink-600">
                      {p.heureDebut ? `${formatHeure(p.heureDebut)}–${formatHeure(p.heureFin)}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-ink-600">{formatHeure(p.heureArrivee)}</td>
                    <td className="px-4 py-3 text-ink-600">{formatHeure(p.heureDepart)}</td>
                    <td className="px-4 py-3">
                      <Badge variant={personnelStatutBadgeVariant(p.statut)}>
                        {PERSONNEL_STATUT_LABELS[p.statut] ?? p.statut}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={isPointerOpen} onClose={() => setPointerOpen(false)} title={isEnseignant ? 'Pointer ma présence' : "Pointer la présence d'un employé"}>
        <PointerPersonnelForm
          employeOptions={employeOptions}
          restrictedEmploye={ownEmploye}
          date={date}
          isSubmitting={pointerMutation.isPending}
          onCancel={() => setPointerOpen(false)}
          onSubmit={(payload) => pointerMutation.mutateAsync(payload)}
        />
      </Modal>
    </div>
  )
}
