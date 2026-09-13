import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Layers } from 'lucide-react'
import { createSerie, listNiveaux, listSeries, updateSerie } from '../../api/academique'
import { SimpleResourceTab } from '../../components/crud/SimpleResourceTab'
import { Select } from '../../components/ui/Select'
import { Badge } from '../../components/ui/Badge'
import { NIVEAU_LABELS } from '../../config/academiqueLabels'
import { rules } from '../../lib/validate'

export function SeriesTab({ etablissementId }) {
  const [niveauId, setNiveauId] = useState('')

  const { data: niveauxData } = useQuery({
    queryKey: ['academique', 'niveaux', etablissementId],
    queryFn: () => listNiveaux(etablissementId),
  })
  const niveaux = Array.isArray(niveauxData) ? niveauxData : (niveauxData?.items ?? [])
  const niveauOptions = niveaux.map((n) => ({
    value: n.id,
    label: NIVEAU_LABELS[n.libelle] ?? n.libelle,
  }))

  // Un id de niveau d'un AUTRE établissement ne doit jamais survivre à un
  // changement d'établissement (confirmé par le backend : sinon "niveau
  // introuvable" pour ce tenant).
  useEffect(() => {
    setNiveauId('')
  }, [etablissementId])

  // Sélectionne le premier niveau disponible une fois la liste chargée.
  useEffect(() => {
    if (!niveauId && niveauOptions.length > 0) {
      setNiveauId(niveauOptions[0].value)
    }
  }, [niveauOptions, niveauId])

  const createFields = [
    { name: 'libelle', label: 'Série', type: 'text', placeholder: 'SM', required: true },
    { name: 'optionnel', label: 'Série optionnelle (ex: arts)', type: 'checkbox' },
  ]
  const editFields = [...createFields, { name: 'actif', label: 'Active', type: 'checkbox' }]

  if (niveauOptions.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-dashed border-ink-200 p-12 text-center text-ink-400">
        Crée d'abord au moins un niveau dans l'onglet "Niveaux" — les séries
        lui sont rattachées.
      </div>
    )
  }

  return (
    <div>
      <div className="mb-4 max-w-xs">
        <Select
          id="niveau-filter"
          label="Niveau"
          options={niveauOptions}
          value={niveauId}
          onChange={(e) => setNiveauId(e.target.value)}
        />
      </div>

      <SimpleResourceTab
        // La clé de requête change avec le niveau : la liste se recharge
        // automatiquement quand on change de sélection.
        queryKey={['academique', 'series', etablissementId, niveauId]}
        listFn={() => listSeries(etablissementId, niveauId)}
        createFn={(data) => createSerie(etablissementId, { ...data, niveauId })}
        updateFn={(id, data) => updateSerie(etablissementId, id, data)}
        createFields={createFields}
        editFields={editFields}
        createRules={{ libelle: [rules.required('Le libellé est requis.')] }}
        itemLabel="une série"
        emptyMessage="Aucune série pour ce niveau."
        emptyIcon={Layers}
        columns={[
          {
            key: 'libelle',
            label: 'Série',
            render: (item) => <span className="font-medium text-ink-900">{item.libelle}</span>,
          },
          {
            key: 'optionnel',
            label: 'Optionnelle',
            render: (item) => (item.optionnel ? 'Oui' : 'Non'),
          },
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
    </div>
  )
}
