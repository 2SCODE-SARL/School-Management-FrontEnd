import { useQuery } from '@tanstack/react-query'
import { AlertTriangle, ArrowDownCircle, ArrowUpCircle, Wallet } from 'lucide-react'
import { getComptableDashboard } from '../../api/dashboard'
import { useAuth } from '../../auth/AuthContext'
import { StatTile } from '../../components/ui/StatTile'
import { pick } from '../../lib/pick'

/**
 * Tableau de bord Comptable — réponse non typée dans la spec
 * (`GET .../tableaux-de-bord/etablissements/{id}/comptable`), affichée de
 * façon défensive avec plusieurs noms de champ plausibles. À ajuster une
 * fois la forme exacte confirmée en test live (comme les autres dashboards
 * de l'app).
 */
export default function ComptableDashboard() {
  const { user } = useAuth()

  const { data, isLoading, isError } = useQuery({
    queryKey: ['dashboard', 'comptable', user?.etablissementId],
    queryFn: () => getComptableDashboard(user.etablissementId),
    enabled: Boolean(user?.etablissementId),
  })

  const totalEncaisse = pick(data, ['totalEncaisse', 'encaissementsMois', 'totalEncaissements'], 0)
  const totalDepenses = pick(data, ['totalDepenses', 'depensesMois'], 0)
  const totalImpayes = pick(data, ['totalImpayes', 'impayesMontant', 'impayes'], 0)
  const bulletinsEnAttente = pick(data, ['bulletinsEnAttente', 'paieEnAttente'], 0)

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-ink-900 mb-6">Tableau de bord</h1>

      {isLoading && (
        <div className="p-16 flex justify-center bg-white rounded-2xl border border-ink-100">
          <div className="h-8 w-8 rounded-full border-2 border-ink-200 border-t-primary-600 animate-spin" />
        </div>
      )}

      {isError && (
        <p className="p-8 text-center text-sm text-danger-600 bg-white rounded-2xl border border-ink-100">
          Impossible de charger ton tableau de bord.
        </p>
      )}

      {!isLoading && !isError && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatTile icon={ArrowUpCircle} label="Encaissé ce mois" value={totalEncaisse} />
            <StatTile icon={ArrowDownCircle} label="Dépenses ce mois" value={totalDepenses} />
            <StatTile icon={AlertTriangle} label="Impayés" value={totalImpayes} />
            <StatTile icon={Wallet} label="Bulletins en attente" value={bulletinsEnAttente} />
          </div>

          <div className="bg-white rounded-2xl border border-dashed border-ink-200 p-10 text-center text-ink-400">
            Le suivi détaillé des échéances, encaissements, dépenses et
            budgets arrivera module par module — pour l'instant, seule la
            Paie est disponible dans le menu Finances.
          </div>
        </>
      )}
    </div>
  )
}
