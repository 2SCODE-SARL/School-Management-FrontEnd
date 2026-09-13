import { Building2, Globe, Hash, Mail, MapPin, Pencil, Phone, Power, ShieldCheck } from 'lucide-react'
import { Modal } from '../../../components/ui/Modal'
import { InfoRow } from '../../../components/ui/InfoRow'
import { Badge } from '../../../components/ui/Badge'
import { Button } from '../../../components/ui/Button'

/** Vue détaillée d'un établissement, avec les actions à portée de main en bas. */
export function EtablissementDetailModal({
  etablissement,
  onClose,
  onEdit,
  onToggleActive,
  isToggling,
}) {
  return (
    <Modal
      open={Boolean(etablissement)}
      onClose={onClose}
      title="Détail de l'établissement"
    >
      {etablissement && (
        <>
          <div className="flex items-center gap-3 mb-4">
            <div className="h-12 w-12 rounded-xl bg-primary-50 flex items-center justify-center shrink-0">
              <Building2 className="h-5 w-5 text-primary-600" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-heading font-bold text-ink-900 truncate">
                {etablissement.nom}
              </p>
              {etablissement.slogan && (
                <p className="text-xs text-ink-400 truncate">{etablissement.slogan}</p>
              )}
            </div>
            <Badge variant={etablissement.actif ? 'success' : 'danger'} className="shrink-0">
              {etablissement.actif ? 'Actif' : 'Inactif'}
            </Badge>
          </div>

          <div>
            <InfoRow icon={Hash} label="Code" value={etablissement.code} />
            <InfoRow icon={MapPin} label="Adresse" value={etablissement.adresse} />
            <InfoRow
              icon={MapPin}
              label="Région / Préfecture"
              value={[etablissement.region, etablissement.prefecture]
                .filter(Boolean)
                .join(' / ')}
            />
            <InfoRow icon={Phone} label="Téléphone" value={etablissement.telephone} />
            <InfoRow icon={Mail} label="Email" value={etablissement.email} />
            <InfoRow icon={Globe} label="Site web" value={etablissement.siteWeb} />
            <InfoRow
              icon={ShieldCheck}
              label="Numéro d'agrément"
              value={etablissement.numeroAgrement}
            />
          </div>

          <div className="flex flex-wrap justify-end gap-2 pt-5 mt-2 border-t border-ink-100">
            <Button
              variant="secondary"
              size="sm"
              isLoading={isToggling}
              onClick={() => onToggleActive(etablissement)}
            >
              <Power className="h-3.5 w-3.5" />
              {etablissement.actif ? 'Désactiver' : 'Activer'}
            </Button>
            <Button size="sm" onClick={() => onEdit(etablissement)}>
              <Pencil className="h-3.5 w-3.5" />
              Modifier
            </Button>
          </div>
        </>
      )}
    </Modal>
  )
}
