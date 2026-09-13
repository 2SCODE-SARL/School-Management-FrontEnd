/**
 * Recharts dessine du SVG et a besoin de vraies valeurs de couleur (pas de
 * classes Tailwind) — on reprend ici exactement les tokens définis dans
 * `src/index.css` pour que les graphiques restent cohérents avec le reste
 * de l'interface.
 */
export const CHART_COLORS = {
  primary: '#3566f0',
  primaryLight: '#8bb0ff',
  primaryDark: '#1c3ea8',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  ink400: '#94a1b3',
  ink200: '#dde2e9',
  ink600: '#4f5b6d',
}

/** Palette pour un camembert/donut à plusieurs parts (ordre stable). */
export const CHART_PALETTE = [
  CHART_COLORS.primary,
  CHART_COLORS.success,
  CHART_COLORS.warning,
  CHART_COLORS.danger,
  CHART_COLORS.primaryLight,
  CHART_COLORS.ink400,
]
