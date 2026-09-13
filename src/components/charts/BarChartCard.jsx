import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { CHART_COLORS } from '../../lib/chartColors'

/**
 * Carte "barres" générique pour les évolutions/répartitions du tableau de
 * bord (effectifs par niveau, encaissé vs impayés...). `data` : tableau de
 * `{ name, value }`. Couleurs reprises de `index.css` (SVG, pas de classes
 * Tailwind possibles ici).
 */
export function BarChartCard({ title, data, color = CHART_COLORS.primary, valueFormatter, emptyMessage = 'Aucune donnée pour le moment.', height = 220, bare = false }) {
  const hasData = data && data.length > 0 && data.some((d) => d.value > 0)

  const content = (
    <>
      {title && <p className="font-heading font-semibold text-ink-900 mb-4">{title}</p>}
      {!hasData ? (
        <p className="text-sm text-ink-400 text-center py-10">{emptyMessage}</p>
      ) : (
        <ResponsiveContainer width="100%" height={height}>
          <BarChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke={CHART_COLORS.ink200} />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 12, fill: CHART_COLORS.ink600 }}
              tickLine={false}
              axisLine={{ stroke: CHART_COLORS.ink200 }}
            />
            <YAxis tick={{ fontSize: 12, fill: CHART_COLORS.ink600 }} tickLine={false} axisLine={false} allowDecimals={false} />
            <Tooltip
              cursor={{ fill: CHART_COLORS.ink200, opacity: 0.35 }}
              contentStyle={{ borderRadius: 10, border: `1px solid ${CHART_COLORS.ink200}`, fontSize: 13 }}
              formatter={(value) => (valueFormatter ? valueFormatter(value) : value)}
            />
            <Bar dataKey="value" fill={color} radius={[6, 6, 0, 0]} maxBarSize={48} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </>
  )

  if (bare) return content
  return <div className="bg-white rounded-2xl border border-ink-100 p-5">{content}</div>
}
