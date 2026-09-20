import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { CHART_PALETTE } from '../../lib/chartColors'

/**
 * Carte "camembert" (disque plein, pas de trou au centre) générique —
 * répartitions (filles/garçons, modes de paiement...) ou indicateur à
 * valeur unique (`centerLabel`, ex: taux de présence, affiché dans une
 * pastille blanche par-dessus le disque). `data` : `{ name, value }[]`.
 */
export function DonutChartCard({ title, data, colors = CHART_PALETTE, centerLabel, emptyMessage = 'Aucune donnée pour le moment.', height = 220, bare = false }) {
  const hasData = data && data.length > 0 && data.some((d) => d.value > 0)

  const content = (
    <>
      {title && <p className="font-heading font-semibold text-ink-900 mb-4">{title}</p>}
      {!hasData ? (
        <p className="text-sm text-ink-400 text-center py-10">{emptyMessage}</p>
      ) : (
        <div className="relative" style={{ height }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} dataKey="value" nameKey="name" innerRadius={0} outerRadius="90%" paddingAngle={2} stroke="none">
                {data.map((entry, i) => (
                  <Cell key={entry.name ?? i} fill={colors[i % colors.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #dde2e9', fontSize: 13 }} />
            </PieChart>
          </ResponsiveContainer>
          {centerLabel && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="rounded-full bg-white/90 px-3 py-1 font-heading text-xl font-bold text-ink-900 shadow-sm">
                {centerLabel}
              </span>
            </div>
          )}
        </div>
      )}
      {hasData && (
        <div className="flex flex-wrap gap-x-4 gap-y-1.5 justify-center mt-3">
          {data.map((d, i) => (
            <div key={d.name ?? i} className="flex items-center gap-1.5 text-xs text-ink-600">
              <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: colors[i % colors.length] }} />
              {d.name} <span className="font-medium text-ink-900">{d.value}</span>
            </div>
          ))}
        </div>
      )}
    </>
  )

  if (bare) return content
  return <div className="bg-white rounded-2xl border border-ink-100 p-5">{content}</div>
}
