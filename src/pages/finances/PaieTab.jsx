import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Wallet } from 'lucide-react'
import { genererPaie, listPaiePeriode, payerPaie } from '../../api/finances'
import { searchEmployes } from '../../api/rh'
import { ApiErrorMessage } from '../../components/ui/ApiErrorMessage'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { Select } from '../../components/ui/Select'
import { Badge } from '../../components/ui/Badge'
import { MOIS_LABEL_BY_NUM, MOIS_OPTIONS, PAIE_STATUT_LABELS, paieStatutBadgeVariant } from '../../config/financesLabels'

// Filet de sécurité générique : ne jamais rendre un objet tel quel (React
// plante sinon) — au pire du JSON lisible plutôt qu'une page blanche.
function displayValue(value) {
  if (value === null || value === undefined || value === '') return '—'
  if (typeof value === 'object') return JSON.stringify(value)
  return value
}

// Confirmé en live : `primes` et `retenues` reviennent doublement imbriqués
// côté backend (`{"primes": 122222}` au lieu de `122222`) — bug signalé,
// on l'absorbe ici en attendant plutôt que d'afficher du JSON brut.
function unwrapAmount(value, key) {
  if (value && typeof value === 'object' && key in value) return value[key]
  return value
}
import { GenererPaieForm } from './GenererPaieForm'
import { PayerPaieForm } from './PayerPaieForm'

const now = new Date()

/**
 * Paie : générer le bulletin d'un employé pour un mois donné, puis le
 * marquer payé. Réservé à Admin/Directeur/Comptable côté backend (le
 * Secrétaire n'apparaît dans aucun des 3 tags Swagger de ce sous-module).
 */
export function PaieTab({ etablissementId }) {
  const [mois, setMois] = useState(now.getMonth() + 1)
  const [annee, setAnnee] = useState(now.getFullYear())
  const [isGenererOpen, setGenererOpen] = useState(false)
  const [payingBulletin, setPayingBulletin] = useState(null)
  const queryClient = useQueryClient()

  const { data: employesData } = useQuery({
    queryKey: ['rh', 'employes', 'options', etablissementId],
    queryFn: () => searchEmployes(etablissementId),
    enabled: Boolean(etablissementId),
  })
  const employes = employesData ?? []
  const employeOptions = employes.map((e) => ({ value: e.id, label: `${e.prenom ?? ''} ${e.nom ?? ''}`.trim() }))

  const periodeQueryKey = ['finances', 'paie', 'periode', etablissementId, mois, annee]
  const { data, isLoading, isError, error } = useQuery({
    queryKey: periodeQueryKey,
    queryFn: () => listPaiePeriode(etablissementId, mois, annee),
    enabled: Boolean(etablissementId && mois && annee),
  })
  const bulletins = Array.isArray(data) ? data : (data?.items ?? [])

  function invalidateAll() {
    queryClient.invalidateQueries({ queryKey: periodeQueryKey })
  }

  const genererMutation = useMutation({
    mutationFn: ({ employeId, payload }) => genererPaie(etablissementId, employeId, payload),
    onSuccess: () => {
      invalidateAll()
      setGenererOpen(false)
    },
  })

  const payerMutation = useMutation({
    mutationFn: ({ bulletinId, payload }) => payerPaie(etablissementId, bulletinId, payload),
    onSuccess: () => {
      invalidateAll()
      setPayingBulletin(null)
    },
  })

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
        <div className="flex flex-wrap gap-3">
          <div className="max-w-xs w-full">
            <Select
              id="mois-filter"
              label="Mois"
              options={MOIS_OPTIONS.map((m) => ({ value: String(m.value), label: m.label }))}
              value={String(mois)}
              onChange={(e) => setMois(Number(e.target.value))}
            />
          </div>
          <div className="max-w-[8rem] w-full">
            <Select
              id="annee-filter"
              label="Année"
              options={[annee - 1, annee, annee + 1].map((a) => ({ value: String(a), label: String(a) }))}
              value={String(annee)}
              onChange={(e) => setAnnee(Number(e.target.value))}
            />
          </div>
        </div>
        <Button onClick={() => setGenererOpen(true)}>
          <Plus className="h-4 w-4" />
          Générer un bulletin
        </Button>
      </div>

      <div className="bg-white rounded-2xl border border-ink-100 overflow-hidden">
        {isLoading && (
          <div className="p-12 flex justify-center">
            <div className="h-8 w-8 rounded-full border-2 border-ink-200 border-t-primary-600 animate-spin" />
          </div>
        )}
        {isError && <ApiErrorMessage error={error} fallback="Impossible de charger les bulletins de paie." />}
        {!isLoading && !isError && bulletins.length === 0 && (
          <div className="p-16 text-center text-ink-400">
            <Wallet className="h-8 w-8 mx-auto mb-3 opacity-50" />
            Aucun bulletin généré pour {MOIS_LABEL_BY_NUM[mois]} {annee}.
          </div>
        )}
        {!isLoading && !isError && bulletins.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-ink-50/80">
                <tr className="text-left text-xs text-ink-500 uppercase tracking-wide border-b border-ink-100">
                  <th className="px-4 py-3 font-medium">Employé</th>
                  <th className="px-4 py-3 font-medium">Primes</th>
                  <th className="px-4 py-3 font-medium">Heures sup.</th>
                  <th className="px-4 py-3 font-medium">Retenues</th>
                  <th className="px-4 py-3 font-medium">Net à payer</th>
                  <th className="px-4 py-3 font-medium">Statut</th>
                  <th className="px-4 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {bulletins.map((b) => {
                  // Champs confirmés par un vrai payload : `employe` est
                  // toujours inclus (pas besoin de le résoudre via
                  // employeLabelById), `netAPayer` (string) est le net,
                  // `primes`/`retenues` arrivent doublement imbriqués
                  // (bug backend, absorbé par `unwrapAmount`).
                  const employeNom = `${b.employe?.prenom ?? ''} ${b.employe?.nom ?? ''}`.trim() || '—'
                  const primes = unwrapAmount(b.primes, 'primes')
                  const retenues = unwrapAmount(b.retenues, 'retenues')
                  const statut = b.statut ?? 'GENERE'
                  const dejaPayee = statut === 'PAYE'
                  return (
                    <tr key={b.id} className="border-b border-ink-50 last:border-0">
                      <td className="px-4 py-3 font-medium text-ink-900">{employeNom}</td>
                      <td className="px-4 py-3 text-ink-600">{displayValue(primes)}</td>
                      <td className="px-4 py-3 text-ink-600">{displayValue(b.heuresSup)}</td>
                      <td className="px-4 py-3 text-ink-600">{displayValue(retenues)}</td>
                      <td className="px-4 py-3 font-medium text-ink-900">{displayValue(b.netAPayer)}</td>
                      <td className="px-4 py-3">
                        <Badge variant={paieStatutBadgeVariant(statut)}>
                          {PAIE_STATUT_LABELS[statut] ?? displayValue(statut)}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                        {b.pdfUrl && (
                          <a
                            href={b.pdfUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-primary-600 hover:underline"
                          >
                            PDF
                          </a>
                        )}
                        {!dejaPayee && (
                          <Button size="sm" variant="secondary" onClick={() => setPayingBulletin(b)}>
                            Marquer payé
                          </Button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={isGenererOpen} onClose={() => setGenererOpen(false)} title="Générer un bulletin de paie" maxWidth="max-w-lg">
        <GenererPaieForm
          employeOptions={employeOptions}
          isSubmitting={genererMutation.isPending}
          onCancel={() => setGenererOpen(false)}
          onSubmit={(employeId, payload) => genererMutation.mutateAsync({ employeId, payload })}
        />
      </Modal>

      <Modal open={Boolean(payingBulletin)} onClose={() => setPayingBulletin(null)} title="Marquer le bulletin payé" maxWidth="max-w-sm">
        {payingBulletin && (
          <PayerPaieForm
            isSubmitting={payerMutation.isPending}
            onCancel={() => setPayingBulletin(null)}
            onSubmit={(payload) => payerMutation.mutateAsync({ bulletinId: payingBulletin.id, payload })}
          />
        )}
      </Modal>
    </div>
  )
}
