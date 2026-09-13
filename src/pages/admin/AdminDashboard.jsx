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
import { getGeneralDashboard } from '../../api/dashboard'
import { searchEtablissements } from '../../api/etablissements'
import { Combobox } from '../../components/ui/Combobox'
import { StatTile } from '../../components/ui/StatTile'
import { AlertTile } from '../../components/ui/AlertTile'
import { BarChartCard } from '../../components/charts/BarChartCard'
import { DonutChartCard } from '../../components/charts/DonutChartCard'
import { CHART_COLORS } from '../../lib/chartColors'
import { NIVEAU_LABELS } from '../../config/academiqueLabels'

/** Même tableau de bord général que le Directeur, avec un sélecteur d'établissement (l'Admin en gère plusieurs). */
export default function AdminDashboard() {
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

  const stats = data?.statistiqueGenerale ?? {}
  const evolution = data?.evolutionInscriptions ?? {}
  const graphiques = data?.graphiques ?? {}
  const resultats = data?.resultats ?? {}
  const alertes = data?.alertes ?? {}
  const effectifParNiveau = graphiques.effectifParNiveau ?? []
  const meilleursEleves = resultats.meilleursEleves ?? []

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-ink-900 mb-6">Tableau de bord</h1>

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

                <div className="bg-white rounded-2xl border border-ink-100 p-5">
                  <p className="font-heading font-semibold text-ink-900 mb-4">Résultats</p>

                  <div className="flex items-center justify-between text-sm mb-4">
                    <span className="text-ink-600">Moyenne générale de l'établissement</span>
                    <span className="font-heading font-bold text-ink-900">{resultats.moyenneGenerale ?? 0}/20</span>
                  </div>

                  <p className="text-xs font-medium text-ink-500 mb-2">Meilleurs élèves</p>
                  {meilleursEleves.length === 0 ? (
                    <p className="text-sm text-ink-400">Pas encore de classement disponible.</p>
                  ) : (
                    <BarChartCard
                      bare
                      data={meilleursEleves.map((eleve, i) => ({
                        name: eleve.nomComplet ?? `${eleve.prenom ?? ''} ${eleve.nom ?? ''}`.trim() ?? `Élève ${i + 1}`,
                        value: eleve.moyenne ?? 0,
                      }))}
                      color={CHART_COLORS.primary}
                      valueFormatter={(v) => `${v}/20`}
                      height={180}
                    />
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
