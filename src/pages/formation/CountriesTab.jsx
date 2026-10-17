import { Globe } from 'lucide-react'
import { createTrainingCountry, listTrainingCountries, updateTrainingCountry } from '../../api/training'
import { SimpleResourceTab } from '../../components/crud/SimpleResourceTab'
import { Badge } from '../../components/ui/Badge'
import { rules } from '../../lib/validate'

const CREATE_FIELDS = [
  { name: 'nom', label: 'Nom', type: 'text', placeholder: 'Guinée', required: true },
  { name: 'codeIso2', label: 'Code ISO2', type: 'text', placeholder: 'GN', required: true },
  { name: 'codeIso3', label: 'Code ISO3 (optionnel)', type: 'text', placeholder: 'GIN' },
]

const EDIT_FIELDS = [...CREATE_FIELDS, { name: 'actif', label: 'Actif', type: 'checkbox' }]

const RULES = {
  nom: [rules.required('Le nom est requis.')],
  codeIso2: [rules.required('Le code ISO2 est requis.')],
}

/** Référentiel Formation : pays (nationalité/pays cible des formateurs, pays des formations). */
export function CountriesTab() {
  return (
    <SimpleResourceTab
      queryKey={['training', 'referentiels', 'countries']}
      listFn={listTrainingCountries}
      createFn={createTrainingCountry}
      updateFn={updateTrainingCountry}
      createFields={CREATE_FIELDS}
      editFields={EDIT_FIELDS}
      createRules={RULES}
      itemLabel="un pays"
      emptyMessage="Aucun pays configuré."
      emptyIcon={Globe}
      searchKeys={['nom', 'codeIso2', 'codeIso3']}
      searchPlaceholder="Rechercher un pays..."
      columns={[
        { key: 'nom', label: 'Nom', render: (item) => <span className="font-medium text-ink-900">{item.nom}</span> },
        { key: 'codeIso2', label: 'ISO2' },
        { key: 'codeIso3', label: 'ISO3', render: (item) => item.codeIso3 ?? '—' },
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
