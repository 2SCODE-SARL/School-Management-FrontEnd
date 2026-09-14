import { useId } from 'react'

/**
 * Silhouette d'onglet "dossier papier" en SVG (coins hauts arrondis, bord
 * droit qui se creuse en courbe douce pour laisser le dossier suivant
 * s'emboîter dessous) — `preserveAspectRatio="none"` pour épouser la
 * largeur réelle du bouton (texte variable) sans déformer les coins.
 * `filter: drop-shadow` est posé ici (pas sur le bouton) pour que l'ombre
 * suive la vraie silhouette courbe plutôt qu'un rectangle.
 */
function TabShape({ gradientId, active }) {
  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      style={{
        filter: active
          ? 'drop-shadow(0 3px 8px rgba(15,23,42,0.10))'
          : 'drop-shadow(0 1px 2px rgba(15,23,42,0.04))',
      }}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#eef1f5" />
          <stop offset="100%" stopColor="#dde2e9" />
        </linearGradient>
      </defs>
      <path
        d="M0,100 L0,26 C0,11 11,0 26,0 L74,0 C86,0 95,8 100,22 L100,100 Z"
        fill={active ? '#ffffff' : `url(#${gradientId})`}
      />
    </svg>
  )
}

/**
 * Barre d'onglets façon "dossiers classés" (chevauchement en éventail,
 * coins hauts arrondis, l'actif ressort en blanc devant) — voir
 * `TabShape` pour la silhouette. Défile horizontalement plutôt que de
 * passer à la ligne (le chevauchement casserait sur plusieurs rangées),
 * donc utilisable même avec beaucoup d'onglets (Académique, Finances...).
 *
 * `tabs` : `{ key, label, badge? }[]` — `badge` est un ReactNode déjà prêt
 * (ex: un compteur), affiché après le libellé.
 */
export function TabBar({ tabs, active, onChange, className = '' }) {
  const uid = useId()

  return (
    <div className={`flex overflow-x-auto mb-5 pt-1 ${className}`}>
      {tabs.map((tab, i) => {
        const isActive = active === tab.key
        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => onChange(tab.key)}
            style={{
              zIndex: isActive ? tabs.length + 10 : tabs.length - i,
              marginLeft: i === 0 ? 0 : -16,
            }}
            className={[
              'relative flex items-center justify-center gap-1.5 h-11 pl-5 pr-8 shrink-0 text-sm font-medium whitespace-nowrap transition-colors duration-200',
              isActive ? 'text-ink-900' : 'text-ink-500 hover:text-ink-700',
            ].join(' ')}
          >
            <TabShape gradientId={`${uid}-${tab.key}`} active={isActive} />
            <span className="relative z-10">{tab.label}</span>
            {tab.badge && <span className="relative z-10">{tab.badge}</span>}
          </button>
        )
      })}
    </div>
  )
}
