import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { AlertTriangle, ArrowDownCircle, ArrowUpCircle, Wallet } from 'lucide-react'
import { getComptableDashboard } from '../../api/dashboard'
import { listImpayes } from '../../api/finances'
import { useAuth } from '../../auth/AuthContext'
import { ApiErrorMessage } from '../../components/ui/ApiErrorMessage'
import { StatTile } from '../../components/ui/StatTile'
import { WelcomeBanner } from '../../components/ui/WelcomeBanner'
import { DashboardListCard } from '../../components/ui/DashboardListCard'
import { ECHEANCE_STATUT_LABELS, echeanceStatutBadgeVariant } from '../../config/financesLabels'
import { Badge } from '../../components/ui/Badge'
import { formatDate } from '../../lib/formatDate'
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
  const navigate = useNavigate()
  const etablissementId = user?.etablissementId

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['dashboard', 'comptable', etablissementId],
    queryFn: () => getComptableDashboard(etablissementId),
    enabled: Boolean(etablissementId),
  })

  // Aperçu "Échéances impayées" — même endpoint que l'onglet Impayés.
  const { data: impayesData, isLoading: isLoadingImpayes } = useQuery({
    queryKey: ['finances', 'impayes', etablissementId],
    queryFn: () => listImpayes(etablissementId),
    enabled: Boolean(etablissementId),
  })
  const impayes = Array.isArray(impayesData) ? impayesData : (impayesData?.items ?? [])

  const totalEncaisse = pick(data, ['totalEncaisse', 'encaissementsMois', 'totalEncaissements'], 0)
  const totalDepenses = pick(data, ['totalDepenses', 'depensesMois'], 0)
  const totalImpayes = pick(data, ['totalImpayes', 'impayesMontant', 'impayes'], 0)
  const bulletinsEnAttente = pick(data, ['bulletinsEnAttente', 'paieEnAttente'], 0)

  function goTo(tab) {
    navigate('/comptable/finances', { state: { tab } })
  }

  return (
    <div>
      <WelcomeBanner name={user?.prenom} subtitle="Suis les encaissements, dépenses et bulletins de paie de ton établissement." />

      {isLoading && (
        <div className="p-16 flex justify-center bg-white rounded-2xl border border-ink-100">
          <div className="h-8 w-8 rounded-full border-2 border-ink-200 border-t-primary-600 animate-spin" />
        </div>
      )}

      {isError && (
        <ApiErrorMessage
          error={error}
          fallback="Impossible de charger ton tableau de bord."
          className="p-8 text-center text-sm text-danger-600 bg-white rounded-2xl border border-ink-100"
        />
      )}

      {!isLoading && !isError && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatTile icon={ArrowUpCircle} label="Encaissé ce mois" value={Number(totalEncaisse) || 0} suffix=" GNF" onClick={() => goTo('encaissements')} />
            <StatTile icon={ArrowDownCircle} label="Dépenses ce mois" value={Number(totalDepenses) || 0} suffix=" GNF" onClick={() => goTo('depenses')} />
            <StatTile icon={AlertTriangle} label="Impayés" value={Number(totalImpayes) || 0} suffix=" GNF" onClick={() => goTo('impayes')} />
            <StatTile icon={Wallet} label="Bulletins en attente" value={Number(bulletinsEnAttente) || 0} onClick={() => goTo('paie')} />
          </div>

          {/* Aperçu de liste — le détail complet est à un clic */}
          <DashboardListCard
            title="Échéances impayées"
            total={impayes.length}
            items={impayes.slice(0, 5)}
            isLoading={isLoadingImpayes}
            onSeeAll={() => goTo('impayes')}
            emptyMessage="Aucun impayé pour l'instant."
            renderItem={(it, i) => {
              const statut = pick(it, ['statut'], null)
              const libelle = it.typeFrais?.libelle ?? 'Échéance'
              const eleve = it.inscription?.eleve
              const eleveNom = eleve ? `${eleve.prenom ?? ''} ${eleve.nom ?? ''}`.trim() : null
              return (
                <div key={pick(it, ['id'], i)} className="flex items-center justify-between gap-3 px-5 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink-900 truncate">
                      {libelle}
                      {eleveNom ? ` — ${eleveNom}` : ''}
                    </p>
                    <p className="text-xs text-ink-400">
                      {pick(it, ['montantRestant', 'montantNet'])} GNF restant · échéance {formatDate(pick(it, ['echeanceDate'], null)) ?? '—'}
                    </p>
                  </div>
                  <Badge variant={echeanceStatutBadgeVariant(statut)} className="shrink-0">
                    {ECHEANCE_STATUT_LABELS[statut] ?? statut ?? 'À payer'}
                  </Badge>
                </div>
              )
            }}
          />
        </>
      )}
    </div>
  )
}
