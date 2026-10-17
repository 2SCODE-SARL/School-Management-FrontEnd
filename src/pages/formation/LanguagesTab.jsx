import { Languages } from 'lucide-react'
import { createTrainingLanguage, listTrainingLanguages, updateTrainingLanguage } from '../../api/training'
import { SimpleResourceTab } from '../../components/crud/SimpleResourceTab'
import { Badge } from '../../components/ui/Badge'
import { rules } from '../../lib/validate'

const CREATE_FIELDS = [
  { name: 'libelle', label: 'Libellé', type: 'text', placeholder: 'Français', required: true },
  { name: 'code', label: 'Code', type: 'text', placeholder: 'fr', required: true },
]

const EDIT_FIELDS = [...CREATE_FIELDS, { name: 'actif', label: 'Actif', type: 'checkbox' }]

const RULES = {
  libelle: [rules.required('Le libellé est requis.')],
  code: [rules.required('Le code est requis.')],
}

/** Référentiel Formation : langues d'enseignement disponibles pour les cours. */
export function LanguagesTab() {
  return (
    <SimpleResourceTab
      queryKey={['training', 'referentiels', 'languages']}
      listFn={listTrainingLanguages}
      createFn={createTrainingLanguage}
      updateFn={updateTrainingLanguage}
      createFields={CREATE_FIELDS}
      editFields={EDIT_FIELDS}
      createRules={RULES}
      itemLabel="une langue"
      emptyMessage="Aucune langue configurée."
      emptyIcon={Languages}
      searchKeys={['libelle', 'code']}
      searchPlaceholder="Rechercher une langue..."
      columns={[
        {
          key: 'libelle',
          label: 'Libellé',
          render: (item) => <span className="font-medium text-ink-900">{item.libelle}</span>,
        },
        { key: 'code', label: 'Code' },
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
