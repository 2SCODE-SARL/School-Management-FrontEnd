import { Coins } from 'lucide-react'
import { createTrainingCurrency, listTrainingCurrencies, updateTrainingCurrency } from '../../api/training'
import { SimpleResourceTab } from '../../components/crud/SimpleResourceTab'
import { Badge } from '../../components/ui/Badge'
import { rules } from '../../lib/validate'

const CREATE_FIELDS = [
  { name: 'libelle', label: 'Libellé', type: 'text', placeholder: 'Franc guinéen', required: true },
  { name: 'code', label: 'Code', type: 'text', placeholder: 'GNF', required: true },
  { name: 'symbole', label: 'Symbole (optionnel)', type: 'text', placeholder: 'FG' },
]

const EDIT_FIELDS = [...CREATE_FIELDS, { name: 'actif', label: 'Actif', type: 'checkbox' }]

const RULES = {
  libelle: [rules.required('Le libellé est requis.')],
  code: [rules.required('Le code est requis.')],
}

/** Référentiel Formation : devises utilisables pour le prix des cours. */
export function CurrenciesTab() {
  return (
    <SimpleResourceTab
      queryKey={['training', 'referentiels', 'currencies']}
      listFn={listTrainingCurrencies}
      createFn={createTrainingCurrency}
      updateFn={updateTrainingCurrency}
      createFields={CREATE_FIELDS}
      editFields={EDIT_FIELDS}
      createRules={RULES}
      itemLabel="une devise"
      emptyMessage="Aucune devise configurée."
      emptyIcon={Coins}
      searchKeys={['libelle', 'code']}
      searchPlaceholder="Rechercher une devise..."
      columns={[
        {
          key: 'libelle',
          label: 'Libellé',
          render: (item) => <span className="font-medium text-ink-900">{item.libelle}</span>,
        },
        { key: 'code', label: 'Code' },
        { key: 'symbole', label: 'Symbole', render: (item) => item.symbole ?? '—' },
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
