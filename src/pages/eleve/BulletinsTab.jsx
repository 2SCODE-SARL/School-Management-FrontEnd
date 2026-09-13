import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { FileText, GraduationCap } from 'lucide-react'
import { getBulletinPdf, listBulletins } from '../../api/portailEleve'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Alert } from '../../components/ui/Alert'
import { BULLETIN_STATUT_LABELS, bulletinStatutBadgeVariant } from '../../config/portailEleveLabels'

// `moyenneGenerale`/`rang`/`appreciation` sont typés "object" dans la spec
// (probablement une génération Swagger imprécise pour un nombre/string
// nullable) — on ne rend jamais un vrai objet tel quel par sécurité.
function displayValue(value) {
  if (value === null || value === undefined || value === '') return '—'
  if (typeof value === 'object') return JSON.stringify(value)
  return value
}

export function BulletinsTab() {
  const [openingId, setOpeningId] = useState(null)
  const [pdfError, setPdfError] = useState('')

  const { data, isLoading, isError } = useQuery({
    queryKey: ['portail-eleve', 'bulletins'],
    queryFn: listBulletins,
  })
  const bulletins = (Array.isArray(data) ? data : [])
    .slice()
    .sort((a, b) => (b.trimestre?.numero ?? 0) - (a.trimestre?.numero ?? 0))

  async function handleVoirPdf(bulletinId) {
    setPdfError('')
    setOpeningId(bulletinId)
    try {
      const result = await getBulletinPdf(bulletinId)
      if (result?.url) {
        window.open(result.url, '_blank', 'noopener,noreferrer')
      } else {
        setPdfError("Le lien du PDF n'a pas pu être récupéré.")
      }
    } catch {
      setPdfError('Impossible de récupérer le PDF pour le moment.')
    } finally {
      setOpeningId(null)
    }
  }

  return (
    <div>
      {isLoading && (
        <div className="p-12 flex justify-center bg-white rounded-2xl border border-ink-100">
          <div className="h-8 w-8 rounded-full border-2 border-ink-200 border-t-primary-600 animate-spin" />
        </div>
      )}
      {isError && (
        <p className="p-8 text-center text-sm text-danger-600 bg-white rounded-2xl border border-ink-100">
          Impossible de charger tes bulletins.
        </p>
      )}
      {!isLoading && !isError && bulletins.length === 0 && (
        <div className="p-16 text-center text-ink-400 bg-white rounded-2xl border border-dashed border-ink-200">
          <GraduationCap className="h-8 w-8 mx-auto mb-3 opacity-50" />
          Aucun bulletin publié pour l'instant.
        </div>
      )}
      {!isLoading && !isError && bulletins.length > 0 && (
        <div className="space-y-2">
          {bulletins.map((b) => (
            <div key={b.id} className="flex items-center justify-between gap-3 bg-white rounded-2xl border border-ink-100 px-4 py-3">
              <div className="flex items-center gap-3 min-w-0">
                <FileText className="h-5 w-5 text-ink-400 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink-900 truncate">
                    Trimestre {b.trimestre?.numero} {b.classe ? `— ${b.classe.nom}` : ''}
                  </p>
                  <p className="text-xs text-ink-400 truncate">
                    Moyenne : {displayValue(b.moyenneGenerale)} · Rang : {displayValue(b.rang)}
                  </p>
                  {b.appreciation && (
                    <p className="text-xs text-ink-500 mt-1">{displayValue(b.appreciation)}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge variant={bulletinStatutBadgeVariant(b.statut)}>
                  {BULLETIN_STATUT_LABELS[b.statut] ?? b.statut}
                </Badge>
                {b.pdfDisponible && (
                  <Button size="sm" variant="secondary" isLoading={openingId === b.id} onClick={() => handleVoirPdf(b.id)}>
                    Voir le PDF
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {pdfError && (
        <Alert variant="danger" className="mt-3">
          {pdfError}
        </Alert>
      )}
    </div>
  )
}
