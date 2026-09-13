import { Layers } from 'lucide-react'
import { createNiveau, listNiveaux, updateNiveau } from '../../api/academique'
import { SimpleResourceTab } from '../../components/crud/SimpleResourceTab'
import { Badge } from '../../components/ui/Badge'
import { NIVEAU_LABELS, NIVEAU_OPTIONS } from '../../config/academiqueLabels'
import { rules } from '../../lib/validate'

const CREATE_FIELDS = [
  { name: 'libelle', label: 'Niveau', type: 'select', options: NIVEAU_OPTIONS, required: true },
  { name: 'ordre', label: "Ordre d'affichage", type: 'number', placeholder: '1', required: true },
]

const EDIT_FIELDS = [
  ...CREATE_FIELDS,
  { name: 'actif', label: 'Actif', type: 'checkbox' },
]

const RULES = {
  libelle: [rules.required('Le niveau est requis.')],
  ordre: [
    rules.required("L'ordre d'affichage est requis."),
    rules.integer("Doit être un nombre entier."),
    rules.min(1, "Doit être supérieur ou égal à 1."),
  ],
}

export function NiveauxTab({ etablissementId }) {
  return (
    <SimpleResourceTab
      queryKey={['academique', 'niveaux', etablissementId]}
      listFn={() => listNiveaux(etablissementId)}
      createFn={(data) => createNiveau(etablissementId, data)}
      updateFn={(id, data) => updateNiveau(etablissementId, id, data)}
      createFields={CREATE_FIELDS}
      editFields={EDIT_FIELDS}
      createRules={RULES}
      itemLabel="un niveau"
      emptyMessage="Aucun niveau configuré."
      emptyIcon={Layers}
      columns={[
        {
          key: 'libelle',
          label: 'Niveau',
          render: (item) => (
            <span className="font-medium text-ink-900">
              {NIVEAU_LABELS[item.libelle] ?? item.libelle}
            </span>
          ),
        },
        { key: 'ordre', label: "Ordre d'affichage" },
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
