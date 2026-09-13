import { FileCheck } from 'lucide-react'
import { createTypeDocument, listTypesDocuments } from '../../api/inscriptions'
import { SimpleResourceTab } from '../../components/crud/SimpleResourceTab'
import { Badge } from '../../components/ui/Badge'
import { rules } from '../../lib/validate'

const CREATE_FIELDS = [
  { name: 'code', label: 'Code', type: 'text', placeholder: 'ACTE_NAISSANCE', required: true },
  { name: 'libelle', label: 'Libellé', type: 'text', placeholder: 'Acte de naissance', required: true },
  { name: 'obligatoire', label: 'Obligatoire pour valider une inscription', type: 'checkbox' },
]
const CREATE_RULES = {
  code: [rules.required('Le code est requis.')],
  libelle: [rules.required('Le libellé est requis.')],
}

/**
 * Types de documents demandés à l'inscription (acte de naissance, certificat
 * médical...) — établissement-wide, création + liste seulement (pas
 * d'édition côté API). Utilisés ensuite dans le détail d'une inscription
 * pour suivre les documents reçus/vérifiés/manquants.
 */
export function TypesDocumentsTab({ etablissementId }) {
  return (
    <SimpleResourceTab
      queryKey={['inscriptions', 'types-documents', etablissementId]}
      listFn={() => listTypesDocuments(etablissementId)}
      createFn={(data) => createTypeDocument(etablissementId, data)}
      createFields={CREATE_FIELDS}
      createRules={CREATE_RULES}
      itemLabel="un type de document"
      emptyMessage="Aucun type de document configuré."
      emptyIcon={FileCheck}
      columns={[
        {
          key: 'libelle',
          label: 'Libellé',
          render: (item) => <span className="font-medium text-ink-900">{item.libelle}</span>,
        },
        { key: 'code', label: 'Code' },
        {
          key: 'obligatoire',
          label: 'Obligatoire',
          render: (item) => (
            <Badge variant={item.obligatoire ? 'warning' : 'neutral'}>
              {item.obligatoire ? 'Oui' : 'Non'}
            </Badge>
          ),
        },
      ]}
    />
  )
}
