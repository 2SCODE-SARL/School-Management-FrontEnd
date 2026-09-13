import { useQueries, useQuery } from '@tanstack/react-query'
import { BookOpen } from 'lucide-react'
import {
  createMatiere,
  listMatieres,
  listNiveaux,
  listSeries,
  updateMatiere,
} from '../../api/academique'
import { SimpleResourceTab } from '../../components/crud/SimpleResourceTab'
import { Badge } from '../../components/ui/Badge'
import {
  MATIERE_TYPE_LABELS,
  MATIERE_TYPE_OPTIONS,
  NIVEAU_LABELS,
} from '../../config/academiqueLabels'
import { rules } from '../../lib/validate'

const NO_SERIE_OPTION = { value: '', label: 'Aucune (matière commune à toutes les séries)' }

// `serieId` est optionnel côté API : on ne l'envoie que s'il a vraiment été choisi.
function cleanPayload(data) {
  const payload = { ...data }
  if (!payload.serieId) delete payload.serieId
  return payload
}

export function MatieresTab({ etablissementId }) {
  const { data: niveauxData } = useQuery({
    queryKey: ['academique', 'niveaux', etablissementId],
    queryFn: () => listNiveaux(etablissementId),
  })
  const niveaux = Array.isArray(niveauxData) ? niveauxData : (niveauxData?.items ?? [])

  // Une matière peut être liée à la série de n'importe quel niveau : on
  // récupère les séries de chaque niveau en parallèle pour construire une
  // liste à plat, préfixée du niveau pour rester lisible.
  const seriesQueries = useQueries({
    queries: niveaux.map((niveau) => ({
      queryKey: ['academique', 'series', etablissementId, niveau.id],
      queryFn: () => listSeries(etablissementId, niveau.id),
      enabled: Boolean(etablissementId),
    })),
  })

  const serieOptions = [
    NO_SERIE_OPTION,
    ...niveaux.flatMap((niveau, index) => {
      const seriesData = seriesQueries[index]?.data
      const series = Array.isArray(seriesData) ? seriesData : (seriesData?.items ?? [])
      return series.map((serie) => ({
        value: serie.id,
        label: `${NIVEAU_LABELS[niveau.libelle] ?? niveau.libelle} — ${serie.libelle}`,
      }))
    }),
  ]
  const serieLabelById = Object.fromEntries(
    serieOptions.filter((o) => o.value).map((o) => [o.value, o.label]),
  )

  const createFields = [
    { name: 'code', label: 'Code', type: 'text', placeholder: 'MATH', required: true },
    { name: 'intitule', label: 'Intitulé', type: 'text', placeholder: 'Mathématiques', required: true },
    { name: 'coefficient', label: 'Coefficient', type: 'number', placeholder: '3', required: true },
    {
      name: 'volumeHoraireHebdo',
      label: 'Volume horaire hebdomadaire',
      type: 'number',
      placeholder: '4',
      required: true,
    },
    { name: 'type', label: 'Type', type: 'select', options: MATIERE_TYPE_OPTIONS },
    { name: 'serieId', label: 'Série associée', type: 'select', options: serieOptions },
  ]

  // Le code n'est pas modifiable une fois créé (absent de UpdateMatiereDto).
  const editFields = [
    ...createFields.filter((f) => f.name !== 'code'),
    { name: 'actif', label: 'Active', type: 'checkbox' },
  ]

  const createRules = {
    code: [rules.required('Le code est requis.')],
    intitule: [rules.required("L'intitulé est requis.")],
  }

  return (
    <SimpleResourceTab
      queryKey={['academique', 'matieres', etablissementId]}
      listFn={() => listMatieres(etablissementId)}
      createFn={(data) => createMatiere(etablissementId, cleanPayload(data))}
      updateFn={(id, data) => updateMatiere(etablissementId, id, cleanPayload(data))}
      createFields={createFields}
      editFields={editFields}
      createRules={createRules}
      searchKeys={['intitule', 'code']}
      searchPlaceholder="Rechercher une matière..."
      filters={[
        {
          key: 'serieId',
          label: 'Toutes les séries',
          options: serieOptions.filter((o) => o.value),
        },
        { key: 'type', label: 'Tous les types', options: MATIERE_TYPE_OPTIONS },
      ]}
      itemLabel="une matière"
      emptyMessage="Aucune matière configurée."
      emptyIcon={BookOpen}
      columns={[
        {
          key: 'intitule',
          label: 'Matière',
          render: (item) => (
            <div>
              <p className="font-medium text-ink-900">{item.intitule}</p>
              <p className="text-xs text-ink-400">{item.code}</p>
            </div>
          ),
        },
        {
          key: 'type',
          label: 'Type',
          render: (item) => MATIERE_TYPE_LABELS[item.type] ?? item.type ?? '—',
        },
        {
          key: 'serieId',
          label: 'Série',
          render: (item) => serieLabelById[item.serieId] ?? 'Commune à toutes',
        },
        { key: 'coefficient', label: 'Coefficient' },
        { key: 'volumeHoraireHebdo', label: 'Vol. horaire/sem.' },
        {
          key: 'actif',
          label: 'Statut',
          render: (item) => (
            <Badge variant={item.actif === false ? 'danger' : 'success'}>
              {item.actif === false ? 'Inactif' : 'Actif'}
            </Badge>
          ),
        },
      ]}
    />
  )
}
