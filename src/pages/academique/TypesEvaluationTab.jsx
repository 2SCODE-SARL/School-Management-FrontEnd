import { ClipboardList } from 'lucide-react'
import { createTypeEvaluation, listTypesEvaluation } from '../../api/academique'
import { SimpleResourceTab } from '../../components/crud/SimpleResourceTab'
import {
  BAREME_LABELS,
  BAREME_OPTIONS,
  TYPE_EVALUATION_CODE_LABELS,
  TYPE_EVALUATION_CODE_OPTIONS,
} from '../../config/academiqueLabels'
import { rules } from '../../lib/validate'

const CREATE_FIELDS = [
  { name: 'code', label: 'Type', type: 'select', options: TYPE_EVALUATION_CODE_OPTIONS, required: true },
  { name: 'libelle', label: 'Libellé', type: 'text', placeholder: 'Devoir surveillé', required: true },
  { name: 'bareme', label: 'Barème', type: 'select', options: BAREME_OPTIONS, required: true },
]

const RULES = {
  code: [rules.required('Le type est requis.')],
  libelle: [rules.required('Le libellé est requis.')],
  bareme: [rules.required('Le barème est requis.')],
}

export function TypesEvaluationTab({ etablissementId }) {
  return (
    <SimpleResourceTab
      queryKey={['academique', 'types-evaluation', etablissementId]}
      listFn={() => listTypesEvaluation(etablissementId)}
      createFn={(data) => createTypeEvaluation(etablissementId, data)}
      createFields={CREATE_FIELDS}
      createRules={RULES}
      itemLabel="un type d'évaluation"
      emptyMessage="Aucun type d'évaluation configuré."
      emptyIcon={ClipboardList}
      columns={[
        {
          key: 'libelle',
          label: 'Libellé',
          render: (item) => <span className="font-medium text-ink-900">{item.libelle}</span>,
        },
        {
          key: 'code',
          label: 'Type',
          render: (item) => TYPE_EVALUATION_CODE_LABELS[item.code] ?? item.code ?? '—',
        },
        {
          key: 'bareme',
          label: 'Barème',
          render: (item) => BAREME_LABELS[item.bareme] ?? item.bareme ?? '—',
        },
      ]}
    />
  )
}
