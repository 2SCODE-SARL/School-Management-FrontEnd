import { DoorOpen } from 'lucide-react'
import { createSalle, listSalles, updateSalle } from '../../api/academique'
import { SimpleResourceTab } from '../../components/crud/SimpleResourceTab'
import { Badge } from '../../components/ui/Badge'
import { SALLE_TYPE_LABELS, SALLE_TYPE_OPTIONS } from '../../config/academiqueLabels'
import { rules } from '../../lib/validate'

const CREATE_FIELDS = [
  { name: 'numero', label: 'Numéro', type: 'text', placeholder: 'S-101', required: true },
  { name: 'capacite', label: 'Capacité', type: 'number', placeholder: '40', required: true },
  { name: 'type', label: 'Type de salle', type: 'select', options: SALLE_TYPE_OPTIONS, required: true },
]

const EDIT_FIELDS = [...CREATE_FIELDS, { name: 'actif', label: 'Active', type: 'checkbox' }]

const RULES = {
  numero: [rules.required('Le numéro est requis.')],
  capacite: [rules.required('La capacité est requise.')],
}

export function SallesTab({ etablissementId }) {
  return (
    <SimpleResourceTab
      queryKey={['academique', 'salles', etablissementId]}
      listFn={() => listSalles(etablissementId)}
      createFn={(data) => createSalle(etablissementId, data)}
      updateFn={(id, data) => updateSalle(etablissementId, id, data)}
      createFields={CREATE_FIELDS}
      editFields={EDIT_FIELDS}
      createRules={RULES}
      itemLabel="une salle"
      emptyMessage="Aucune salle configurée."
      emptyIcon={DoorOpen}
      columns={[
        {
          key: 'numero',
          label: 'Numéro',
          render: (item) => <span className="font-medium text-ink-900">{item.numero}</span>,
        },
        {
          key: 'type',
          label: 'Type',
          render: (item) => SALLE_TYPE_LABELS[item.type] ?? item.type ?? '—',
        },
        { key: 'capacite', label: 'Capacité' },
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
