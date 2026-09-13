import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, FileText, Send } from 'lucide-react'
import { genererBulletin, getBulletin, publierBulletin } from '../../api/resultats'
import { searchEleves } from '../../api/eleves'
import { getAnneeScolaire, listAnneesScolaires } from '../../api/etablissements'
import { Button } from '../../components/ui/Button'
import { Select } from '../../components/ui/Select'
import { Combobox } from '../../components/ui/Combobox'
import { Badge } from '../../components/ui/Badge'
import { Alert } from '../../components/ui/Alert'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { ApiError } from '../../api/client'
import { BULLETIN_STATUT_LABELS, bulletinStatutBadgeVariant } from '../../config/portailEleveLabels'

function displayValue(value) {
  if (value === null || value === undefined || value === '') return '—'
  if (typeof value === 'object') return JSON.stringify(value)
  return value
}

/**
 * Génère/consulte/publie le bulletin d'un élève pour un trimestre — pas de
 * roster de classe disponible (signalé au backend), donc recherche
 * l'élève par nom comme pour la saisie de notes.
 */
export function BulletinGenererTab({ etablissementId }) {
  const [anneeScolaireId, setAnneeScolaireId] = useState('')
  const [trimestreId, setTrimestreId] = useState('')
  const [eleveId, setEleveId] = useState('')
  const [genError, setGenError] = useState('')
  const [isPublierConfirmOpen, setPublierConfirmOpen] = useState(false)
  const queryClient = useQueryClient()

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

  const { data: elevesData } = useQuery({
    queryKey: ['eleves', 'options', etablissementId],
    queryFn: () => searchEleves(etablissementId, { limit: 100 }),
    enabled: Boolean(etablissementId),
  })
  const eleveOptions = (elevesData?.items ?? []).map((e) => ({
    value: e.id,
    label: `${e.prenom ?? ''} ${e.nom ?? ''}`.trim() + (e.matricule ? ` (${e.matricule})` : ''),
  }))

  const bulletinQueryKey = ['resultats', 'bulletin', etablissementId, eleveId, trimestreId]
  const { data: bulletin, isLoading: isLoadingBulletin, isError: isErrorBulletin } = useQuery({
    queryKey: bulletinQueryKey,
    queryFn: () => getBulletin(etablissementId, eleveId, trimestreId),
    enabled: Boolean(etablissementId && eleveId && trimestreId),
    retry: false,
  })

  function invalidateBulletin() {
    queryClient.invalidateQueries({ queryKey: bulletinQueryKey })
  }

  const genererMutation = useMutation({
    mutationFn: () => genererBulletin(etablissementId, eleveId, trimestreId),
    onSuccess: () => {
      invalidateBulletin()
      setGenError('')
    },
    onError: (err) => setGenError(err instanceof ApiError ? err.message : 'Une erreur est survenue.'),
  })

  const publierMutation = useMutation({
    mutationFn: () => publierBulletin(etablissementId, bulletin.id),
    onSuccess: () => {
      invalidateBulletin()
      setPublierConfirmOpen(false)
    },
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
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="max-w-xs w-full">
          <Select id="annee-filter" label="Année scolaire" options={anneeOptions} value={anneeScolaireId} onChange={(e) => setAnneeScolaireId(e.target.value)} />
        </div>
        <div className="max-w-xs w-full">
          <Select
            id="trimestre-filter"
            label="Trimestre"
            options={trimestreOptions.length ? trimestreOptions : [{ value: '', label: 'Aucun trimestre' }]}
            value={trimestreId}
            onChange={(e) => setTrimestreId(e.target.value)}
          />
        </div>
        <div className="max-w-xs w-full">
          <Combobox
            id="eleveId"
            label="Élève"
            options={eleveOptions}
            value={eleveId}
            onChange={setEleveId}
            placeholder="Rechercher un élève..."
            searchPlaceholder="Rechercher par nom..."
          />
        </div>
      </div>

      {!eleveId || !trimestreId ? (
        <div className="bg-white rounded-2xl border border-dashed border-ink-200 p-16 text-center text-ink-400">
          Choisis un trimestre et un élève.
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-ink-100 p-5">
          {isLoadingBulletin ? (
            <div className="p-8 flex justify-center">
              <div className="h-8 w-8 rounded-full border-2 border-ink-200 border-t-primary-600 animate-spin" />
            </div>
          ) : isErrorBulletin || !bulletin ? (
            <div className="text-center py-6">
              <FileText className="h-8 w-8 mx-auto mb-3 text-ink-300" />
              <p className="text-sm text-ink-500 mb-4">Aucun bulletin généré pour cet élève ce trimestre.</p>
              <Button isLoading={genererMutation.isPending} onClick={() => genererMutation.mutate()}>
                Générer le bulletin
              </Button>
              {genError && (
                <Alert variant="danger" className="mt-4 text-left">
                  {genError}
                </Alert>
              )}
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="font-heading font-semibold text-ink-900">Bulletin</p>
                  <p className="text-sm text-ink-500">
                    Moyenne : {displayValue(bulletin.moyenneGenerale)} · Rang : {displayValue(bulletin.rang)}
                  </p>
                </div>
                <Badge variant={bulletinStatutBadgeVariant(bulletin.statut)}>
                  {BULLETIN_STATUT_LABELS[bulletin.statut] ?? bulletin.statut}
                </Badge>
              </div>
              {bulletin.appreciation && (
                <div className="mt-3 rounded-lg bg-ink-50 px-3 py-2">
                  <p className="text-xs font-medium text-ink-500 mb-0.5">Appréciation / avis</p>
                  <p className="text-sm text-ink-700">{displayValue(bulletin.appreciation)}</p>
                </div>
              )}
              {bulletin.statut !== 'PUBLIE' && bulletin.statut !== 'VALIDE' && (
                <Button size="sm" className="mt-3" onClick={() => setPublierConfirmOpen(true)}>
                  <Send className="h-3.5 w-3.5" />
                  Publier
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      <ConfirmDialog
        open={isPublierConfirmOpen}
        onClose={() => setPublierConfirmOpen(false)}
        onConfirm={() => publierMutation.mutate()}
        isLoading={publierMutation.isPending}
        title="Publier ce bulletin ?"
        description="Il devient visible dans les portails élève et parent."
        confirmLabel="Publier"
      />
    </div>
  )
}
