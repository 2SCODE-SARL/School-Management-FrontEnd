import { useEffect, useState } from 'react'
import { useMutation, useQueries, useQuery } from '@tanstack/react-query'
import { Send } from 'lucide-react'
import { getAvisDirection, listAppreciations, setAppreciation, setAvisDirection } from '../../api/resultats'
import { listClasses, listClasseMatieres } from '../../api/academique'
import { listAnneesScolaires, getAnneeScolaire } from '../../api/etablissements'
import { listElevesClasse } from '../../api/eleves'
import { Button } from '../../components/ui/Button'
import { Select } from '../../components/ui/Select'
import { Alert } from '../../components/ui/Alert'
import { TabBar } from '../../components/ui/TabBar'
import { ApiError } from '../../api/client'
import { NIVEAU_LABELS } from '../../config/academiqueLabels'

/**
 * Sélecteurs communs année/trimestre/classe — même pattern que les autres
 * onglets Résultats (ExamensTab, ClassementsTab...).
 */
function useAnneeTrimestreClasse(etablissementId) {
  const [anneeScolaireId, setAnneeScolaireId] = useState('')
  const [trimestreId, setTrimestreId] = useState('')
  const [classeId, setClasseId] = useState('')

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

  return {
    anneeScolaireId, setAnneeScolaireId, anneeOptions, isLoadingAnnees, annees,
    trimestreId, setTrimestreId, trimestreOptions,
    classeId, setClasseId, classeOptions,
  }
}

function SelectorsRow({ state }) {
  return (
    <div className="flex flex-wrap gap-3 mb-4">
      <div className="max-w-xs w-full">
        <Select id="annee-filter" label="Année scolaire" options={state.anneeOptions} value={state.anneeScolaireId} onChange={(e) => state.setAnneeScolaireId(e.target.value)} />
      </div>
      <div className="max-w-xs w-full">
        <Select
          id="trimestre-filter"
          label="Trimestre"
          options={state.trimestreOptions.length ? state.trimestreOptions : [{ value: '', label: 'Aucun trimestre' }]}
          value={state.trimestreId}
          onChange={(e) => state.setTrimestreId(e.target.value)}
        />
      </div>
      <div className="max-w-xs w-full">
        <Select
          id="classe-filter"
          label="Classe"
          options={state.classeOptions.length ? state.classeOptions : [{ value: '', label: 'Aucune classe' }]}
          value={state.classeId}
          onChange={(e) => state.setClasseId(e.target.value)}
        />
      </div>
    </div>
  )
}

/** Appréciation par matière (`SetAppreciationDto`) — Enseignant/Directeur/Admin. */
function AppreciationParMatiere({ etablissementId }) {
  const state = useAnneeTrimestreClasse(etablissementId)
  const [matiereId, setMatiereId] = useState('')
  const [commentaires, setCommentaires] = useState({})
  const [formError, setFormError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const { data: matieresData } = useQuery({
    queryKey: ['academique', 'classe-matieres', etablissementId, state.classeId],
    queryFn: () => listClasseMatieres(etablissementId, state.classeId),
    enabled: Boolean(etablissementId && state.classeId),
  })
  const matieres = Array.isArray(matieresData) ? matieresData : (matieresData?.items ?? [])
  // Mapping confirmé via ExamenForm.jsx, qui utilise déjà ce même endpoint.
  const matiereOptions = matieres.map((m) => ({
    value: m.matiereId ?? m.matiere?.id ?? m.id,
    label: m.matiere?.intitule ?? m.intitule ?? '—',
  }))

  useEffect(() => {
    setMatiereId('')
    setCommentaires({})
  }, [state.classeId])

  const { data: rosterData, isLoading: isLoadingRoster } = useQuery({
    queryKey: ['eleves', 'classe-roster', etablissementId, state.classeId],
    queryFn: () => listElevesClasse(etablissementId, state.classeId, { limit: 100 }),
    enabled: Boolean(etablissementId && state.classeId),
  })
  const eleves = (rosterData?.items ?? []).slice().sort((a, b) => `${a.nom ?? ''}`.localeCompare(`${b.nom ?? ''}`))

  // Relit les appréciations déjà saisies (GET ajouté par le backend suite
  // à notre remontée -9) pour préremplir plutôt que d'écrire à l'aveugle.
  // Un appel par élève : l'endpoint renvoie toutes les matières d'un coup,
  // filtré ici sur la matière sélectionnée.
  const existingQueries = useQueries({
    queries: eleves.map((el) => ({
      queryKey: ['resultats', 'appreciations', etablissementId, el.id, state.trimestreId],
      queryFn: () => listAppreciations(etablissementId, el.id, state.trimestreId),
      enabled: Boolean(etablissementId && el.id && state.trimestreId),
    })),
  })
  const existingByEleve = Object.fromEntries(
    eleves.map((el, i) => {
      const list = Array.isArray(existingQueries[i]?.data) ? existingQueries[i].data : (existingQueries[i]?.data?.items ?? [])
      const match = list.find((a) => (a.matiereId ?? a.matiere?.id) === matiereId)
      return [el.id, match?.commentaire ?? '']
    }),
  )

  const saveMutation = useMutation({
    mutationFn: async () => {
      const entries = eleves.filter((el) => commentaires[el.id]?.trim())
      for (const el of entries) {
        await setAppreciation(etablissementId, {
          eleveId: el.id,
          matiereId,
          trimestreId: state.trimestreId,
          commentaire: commentaires[el.id].trim(),
        })
      }
      return entries.length
    },
    onSuccess: (count) => {
      setSuccessMessage(`${count} appréciation${count > 1 ? 's' : ''} enregistrée${count > 1 ? 's' : ''}.`)
      setCommentaires({})
    },
    onError: (err) => setFormError(err instanceof ApiError ? err.message : 'Une erreur est survenue.'),
  })

  async function handleSave() {
    setFormError('')
    setSuccessMessage('')
    if (!matiereId) {
      setFormError('Choisis une matière.')
      return
    }
    const hasAny = eleves.some((el) => commentaires[el.id]?.trim())
    if (!hasAny) {
      setFormError('Saisis au moins une appréciation.')
      return
    }
    saveMutation.mutate()
  }

  return (
    <div>
      <SelectorsRow state={state} />
      <div className="max-w-xs mb-4">
        <Select
          id="matiere-filter"
          label="Matière"
          options={matiereOptions.length ? [{ value: '', label: 'Choisir...' }, ...matiereOptions] : [{ value: '', label: 'Aucune matière' }]}
          value={matiereId}
          onChange={(e) => setMatiereId(e.target.value)}
        />
      </div>

      <div className="bg-white rounded-2xl border border-ink-100 p-5">
        {isLoadingRoster ? (
          <div className="p-8 flex justify-center">
            <div className="h-8 w-8 rounded-full border-2 border-ink-200 border-t-primary-600 animate-spin" />
          </div>
        ) : eleves.length === 0 ? (
          <p className="text-sm text-ink-400 text-center py-6">Aucun élève dans cette classe.</p>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
            {eleves.map((el) => (
              <div key={el.id} className="flex items-center gap-2">
                <p className="w-56 shrink-0 text-sm text-ink-900 truncate">
                  {el.prenom} {el.nom}
                </p>
                <input
                  value={commentaires[el.id] ?? existingByEleve[el.id] ?? ''}
                  onChange={(e) => setCommentaires((c) => ({ ...c, [el.id]: e.target.value }))}
                  placeholder="Élève sérieux et appliqué..."
                  className="flex-1 rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-900 outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-colors"
                />
              </div>
            ))}
          </div>
        )}

        {formError && <Alert variant="danger" className="mt-3">{formError}</Alert>}
        {successMessage && <Alert variant="success" className="mt-3">{successMessage}</Alert>}

        <div className="flex justify-end pt-4 mt-4 border-t border-ink-100">
          <Button isLoading={saveMutation.isPending} onClick={handleSave}>
            <Send className="h-3.5 w-3.5" />
            Enregistrer les appréciations
          </Button>
        </div>
      </div>
    </div>
  )
}

/** Avis de direction (`SetAvisDirectionDto`) — Directeur/Admin uniquement, transmis aux parents. */
function AvisDirection({ etablissementId }) {
  const state = useAnneeTrimestreClasse(etablissementId)
  const [messages, setMessages] = useState({})
  const [formError, setFormError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    setMessages({})
  }, [state.classeId])

  const { data: rosterData, isLoading: isLoadingRoster } = useQuery({
    queryKey: ['eleves', 'classe-roster', etablissementId, state.classeId],
    queryFn: () => listElevesClasse(etablissementId, state.classeId, { limit: 100 }),
    enabled: Boolean(etablissementId && state.classeId),
  })
  const eleves = (rosterData?.items ?? []).slice().sort((a, b) => `${a.nom ?? ''}`.localeCompare(`${b.nom ?? ''}`))

  // Relit l'avis déjà envoyé (GET ajouté par le backend suite à notre
  // remontée -9) pour préremplir plutôt que d'écrire à l'aveugle.
  const existingQueries = useQueries({
    queries: eleves.map((el) => ({
      queryKey: ['resultats', 'avis-direction', etablissementId, el.id, state.trimestreId],
      queryFn: () => getAvisDirection(etablissementId, el.id, state.trimestreId),
      enabled: Boolean(etablissementId && el.id && state.trimestreId),
    })),
  })
  const existingByEleve = Object.fromEntries(
    eleves.map((el, i) => [el.id, existingQueries[i]?.data?.message ?? '']),
  )

  const saveMutation = useMutation({
    mutationFn: async () => {
      const entries = eleves.filter((el) => messages[el.id]?.trim())
      for (const el of entries) {
        await setAvisDirection(etablissementId, { eleveId: el.id, trimestreId: state.trimestreId, message: messages[el.id].trim() })
      }
      return entries.length
    },
    onSuccess: (count) => {
      setSuccessMessage(`${count} avis enregistré${count > 1 ? 's' : ''} — visible sur le bulletin transmis aux parents.`)
      setMessages({})
    },
    onError: (err) => setFormError(err instanceof ApiError ? err.message : 'Une erreur est survenue.'),
  })

  function handleSave() {
    setFormError('')
    setSuccessMessage('')
    const hasAny = eleves.some((el) => messages[el.id]?.trim())
    if (!hasAny) {
      setFormError('Saisis au moins un avis.')
      return
    }
    saveMutation.mutate()
  }

  return (
    <div>
      <SelectorsRow state={state} />

      <div className="bg-white rounded-2xl border border-ink-100 p-5">
        {isLoadingRoster ? (
          <div className="p-8 flex justify-center">
            <div className="h-8 w-8 rounded-full border-2 border-ink-200 border-t-primary-600 animate-spin" />
          </div>
        ) : eleves.length === 0 ? (
          <p className="text-sm text-ink-400 text-center py-6">Aucun élève dans cette classe.</p>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
            {eleves.map((el) => (
              <div key={el.id} className="flex items-center gap-2">
                <p className="w-56 shrink-0 text-sm text-ink-900 truncate">
                  {el.prenom} {el.nom}
                </p>
                <input
                  value={messages[el.id] ?? existingByEleve[el.id] ?? ''}
                  onChange={(e) => setMessages((m) => ({ ...m, [el.id]: e.target.value }))}
                  placeholder="Félicitations pour les progrès..."
                  className="flex-1 rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-900 outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-colors"
                />
              </div>
            ))}
          </div>
        )}

        {formError && <Alert variant="danger" className="mt-3">{formError}</Alert>}
        {successMessage && <Alert variant="success" className="mt-3">{successMessage}</Alert>}

        <div className="flex justify-end pt-4 mt-4 border-t border-ink-100">
          <Button isLoading={saveMutation.isPending} onClick={handleSave}>
            <Send className="h-3.5 w-3.5" />
            Enregistrer les avis
          </Button>
        </div>
      </div>
    </div>
  )
}

/**
 * Appréciations par matière (Enseignant/Directeur/Admin) + avis de
 * direction (Directeur/Admin, transmis aux parents sur le bulletin). Le
 * `GET` de relecture par élève+trimestre a été ajouté par le backend
 * suite à notre remontée -9 — les champs se préremplissent maintenant
 * avec la valeur déjà enregistrée, éditable comme un upsert normal.
 */
export function AppreciationsTab({ etablissementId, canAvisDirection }) {
  const [subTab, setSubTab] = useState('appreciations')

  return (
    <div>
      {canAvisDirection && (
        <TabBar
          tabs={[
            { key: 'appreciations', label: 'Appréciations par matière' },
            { key: 'avis', label: 'Avis de direction' },
          ]}
          active={subTab}
          onChange={setSubTab}
        />
      )}

      {subTab === 'appreciations' || !canAvisDirection ? <AppreciationParMatiere etablissementId={etablissementId} /> : <AvisDirection etablissementId={etablissementId} />}
    </div>
  )
}
