import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  AlertTriangle,
  BookOpen,
  Cake,
  CalendarClock,
  ClipboardCheck,
  FileWarning,
  LayoutDashboard,
  Layers,
  TrendingUp,
  UserCheck,
  Users,
  UserX,
  Wallet,
} from 'lucide-react'
import { Inbox } from 'lucide-react'
import { getGeneralDashboard } from '../../api/dashboard'
import { listDemandes } from '../../api/demandes'
import { searchEtablissements } from '../../api/etablissements'
import { useAuth } from '../../auth/AuthContext'
import { Combobox } from '../../components/ui/Combobox'
import { StatTile } from '../../components/ui/StatTile'
import { AlertTile } from '../../components/ui/AlertTile'
import { WelcomeBanner } from '../../components/ui/WelcomeBanner'
import { DashboardListCard } from '../../components/ui/DashboardListCard'
import { Badge } from '../../components/ui/Badge'
import { BarChartCard } from '../../components/charts/BarChartCard'
import { DonutChartCard } from '../../components/charts/DonutChartCard'
import { CHART_COLORS } from '../../lib/chartColors'
import { NIVEAU_LABELS } from '../../config/academiqueLabels'
import { DEMANDE_STATUT_LABELS, demandeStatutBadgeVariant } from '../../config/demandesLabels'
import { formatDate } from '../../lib/formatDate'

/** Même tableau de bord général que le Directeur, avec un sélecteur d'établissement (l'Admin en gère plusieurs). */
export default function AdminDashboard() {
  const { user } = useAuth()
  const [etablissementId, setEtablissementId] = useState('')
  const navigate = useNavigate()

  // Chaque stat/alerte mène à l'onglet du module qui la détaille, avec
  // l'établissement déjà présélectionné (l'Admin en gère plusieurs) — repris
  // par la page cible via `location.state`.
  function goTo(path, tab) {
    navigate(path, { state: { tab, etablissementId } })
  }

  const { data: etablissementsData } = useQuery({
    queryKey: ['etablissements', 'options'],
    queryFn: () => searchEtablissements({ limit: 100 }),
  })
  const etablissementOptions = (etablissementsData?.items ?? []).map((e) => ({ value: e.id, label: e.nom }))

  const { data, isLoading, isError } = useQuery({
    queryKey: ['dashboard', 'general', etablissementId],
    queryFn: () => getGeneralDashboard(etablissementId),
    enabled: Boolean(etablissementId),
  })

  // Aperçu "Demandes en attente" — appel dédié (pas dans le payload du
  // tableau de bord général), même endpoint que la page Demandes.
  const { data: demandesData, isLoading: isLoadingDemandes } = useQuery({
    queryKey: ['demandes', etablissementId, 'EN_ATTENTE'],
    queryFn: () => listDemandes(etablissementId, 'EN_ATTENTE'),
    enabled: Boolean(etablissementId),
  })
  const demandesEnAttente = (Array.isArray(demandesData) ? demandesData : (demandesData?.items ?? []))
    .slice()
    .sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''))

  const stats = data?.statistiqueGenerale ?? {}
  const evolution = data?.evolutionInscriptions ?? {}
  const graphiques = data?.graphiques ?? {}
  const resultats = data?.resultats ?? {}
  const alertes = data?.alertes ?? {}
  const effectifParNiveau = graphiques.effectifParNiveau ?? []
  const meilleursEleves = resultats.meilleursEleves ?? []

  return (
    <div>
      <WelcomeBanner name={user?.prenom} />

      <div className="mb-6 max-w-sm">
        <Combobox
          id="etablissement-select"
          label="Établissement"
          options={etablissementOptions}
          value={etablissementId}
          onChange={setEtablissementId}
          placeholder="Sélectionner un établissement..."
          searchPlaceholder="Rechercher une école..."
        />
      </div>

      {!etablissementId ? (
        <div className="bg-white rounded-2xl border border-dashed border-ink-200 p-16 text-center text-ink-400">
          <LayoutDashboard className="h-8 w-8 mx-auto mb-3 opacity-50" />
          Sélectionne un établissement pour voir ses indicateurs.
        </div>
      ) : (
        <>
          {isLoading && (
            <div className="p-16 flex justify-center bg-white rounded-2xl border border-ink-100">
              <div className="h-8 w-8 rounded-full border-2 border-ink-200 border-t-primary-600 animate-spin" />
            </div>
          )}

          {isError && (
            <p className="p-8 text-center text-sm text-danger-600 bg-white rounded-2xl border border-ink-100">
              Impossible de charger le tableau de bord.
            </p>
          )}

          {!isLoading && !isError && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatTile icon={Users} label="Élèves" value={stats.nbEleves ?? 0} onClick={() => goTo('/admin/eleves', 'eleves')} />
                <StatTile icon={UserCheck} label="Enseignants" value={stats.nbEnseignants ?? 0} onClick={() => goTo('/admin/rh', 'employes')} />
                <StatTile icon={Layers} label="Classes" value={stats.nbClasses ?? 0} onClick={() => goTo('/admin/academique', 'classes')} />
                <StatTile icon={BookOpen} label="Matières" value={stats.nbMatieres ?? 0} onClick={() => goTo('/admin/academique', 'matieres')} />
                <StatTile
                  icon={Wallet}
                  label="Encaissé"
                  value={stats.montantEncaisses ?? 0}
                  suffix=" GNF"
                  onClick={() => goTo('/admin/finances', 'encaissements')}
                />
                <StatTile
                  icon={AlertTriangle}
                  label="Impayés"
                  value={stats.montantImpayes ?? 0}
                  suffix=" GNF"
                  onClick={() => goTo('/admin/finances', 'impayes')}
                />
                <StatTile
                  icon={ClipboardCheck}
                  label="Présence du jour"
                  value={stats.tauxPresenceJour ?? 0}
                  suffix="%"
                  onClick={() => goTo('/admin/presences', 'acces')}
                />
                <StatTile
                  icon={TrendingUp}
                  label="Taux de réussite"
                  value={stats.tauxReussite ?? 0}
                  suffix="%"
                  onClick={() => goTo('/admin/resultats', 'classements')}
                />
              </div>

              <div className="bg-white rounded-2xl border border-ink-100 p-5">
                <p className="font-heading font-semibold text-ink-900 mb-4">Alertes</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                  <AlertTile icon={AlertTriangle} label="Impayés" count={alertes.nbImpayes ?? 0} onClick={() => goTo('/admin/finances', 'impayes')} />
                  <AlertTile icon={UserX} label="Absences" count={alertes.nbAbsences ?? 0} onClick={() => goTo('/admin/presences', 'alertes')} />
                  <AlertTile
                    icon={CalendarClock}
                    label="Examens (semaine)"
                    count={alertes.examensSemaine ?? 0}
                    onClick={() => goTo('/admin/resultats', 'examens')}
                  />
                  <AlertTile
                    icon={FileWarning}
                    label="Documents manquants"
                    count={alertes.nbDocumentsManquants ?? 0}
                    onClick={() => goTo('/admin/documentation', 'documents')}
                  />
                  <AlertTile
                    icon={Cake}
                    label="Anniversaires du jour"
                    count={alertes.anniversairesJour ?? 0}
                    onClick={() => goTo('/admin/eleves', 'eleves')}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <BarChartCard
                  title="Effectifs par niveau"
                  data={effectifParNiveau.map((n) => ({ name: NIVEAU_LABELS[n.niveau] ?? n.niveau, value: n.effectif }))}
                  color={CHART_COLORS.primary}
                />
                <DonutChartCard
                  title="Filles / Garçons"
                  data={[
                    { name: 'Filles', value: graphiques.repartitionSexe?.filles ?? 0 },
                    { name: 'Garçons', value: graphiques.repartitionSexe?.garcons ?? 0 },
                  ]}
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <BarChartCard
                  title="Encaissé vs Impayés"
                  data={[
                    { name: 'Encaissé', value: stats.montantEncaisses ?? 0 },
                    { name: 'Impayés', value: stats.montantImpayes ?? 0 },
                  ]}
                  color={CHART_COLORS.success}
                  valueFormatter={(v) => `${Number(v).toLocaleString('fr-FR')} GNF`}
                />
                <DonutChartCard
                  title="Taux de présence du jour"
                  data={[
                    { name: 'Présents', value: stats.tauxPresenceJour ?? 0 },
                    { name: 'Absents', value: Math.max(0, 100 - (stats.tauxPresenceJour ?? 0)) },
                  ]}
                  colors={[CHART_COLORS.success, CHART_COLORS.ink200]}
                  centerLabel={`${stats.tauxPresenceJour ?? 0}%`}
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <BarChartCard
                  title="Évolution des inscriptions"
                  data={[
                    { name: 'Nouveaux', value: evolution.nouveaux ?? 0 },
                    { name: 'Anciens réinscrits', value: evolution.anciens ?? 0 },
                  ]}
                  color={CHART_COLORS.primaryLight}
                />

                <DashboardListCard
                  title="Meilleurs élèves"
                  total={meilleursEleves.length}
                  items={meilleursEleves.slice(0, 5)}
                  onSeeAll={() => goTo('/admin/resultats', 'classements')}
                  emptyMessage="Pas encore de classement disponible."
                  renderItem={(eleve, i) => (
                    <div key={eleve.id ?? i} className="flex items-center justify-between gap-3 px-5 py-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="h-6 w-6 rounded-full bg-primary-50 text-primary-700 text-xs font-bold flex items-center justify-center shrink-0">
                          {i + 1}
                        </span>
                        <span className="text-sm text-ink-800 truncate">
                          {eleve.nomComplet ?? `${eleve.prenom ?? ''} ${eleve.nom ?? ''}`.trim() ?? `Élève ${i + 1}`}
                        </span>
                      </div>
                      <span className="text-sm font-semibold text-ink-900 shrink-0">{eleve.moyenne ?? '—'}/20</span>
                    </div>
                  )}
                />
              </div>

              {/* Aperçu de liste — le détail complet est à un clic */}
              <DashboardListCard
                title="Demandes en attente"
                total={demandesEnAttente.length}
                items={demandesEnAttente.slice(0, 5)}
                isLoading={isLoadingDemandes}
                onSeeAll={() => goTo('/admin/demandes')}
                emptyMessage="Aucune demande en attente."
                renderItem={(d) => (
                  <div key={d.id} className="flex items-center justify-between gap-3 px-5 py-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Inbox className="h-4 w-4 text-ink-400 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-ink-900 truncate">{d.sujet}</p>
                        <p className="text-xs text-ink-400 truncate">
                          {d.eleve ? `${d.eleve.prenom ?? ''} ${d.eleve.nom ?? ''}`.trim() + ' · ' : ''}
                          {formatDate(d.createdAt)}
                        </p>
                      </div>
                    </div>
                    <Badge variant={demandeStatutBadgeVariant(d.statut)} className="shrink-0">
                      {DEMANDE_STATUT_LABELS[d.statut] ?? d.statut}
                    </Badge>
                  </div>
                )}
              />
            </div>
          )}
        </>
      )}
    </div>
  )
}
