/**
 * Barre d'onglets "menu plein" : coins hauts arrondis, couleurs pleines et
 * contrastées (pas de tons pâles) — l'onglet actif est en bleu (couleur de
 * marque), en texte blanc gras, et se prolonge directement dans la barre
 * pleine en dessous (même couleur, aucune coupure visible) ; les onglets
 * inactifs sont sombres (encre foncée) et "posés" légèrement au-dessus de
 * cette barre plutôt que d'y plonger. Défile horizontalement plutôt que de
 * passer à la ligne, pour rester propre même avec beaucoup d'onglets.
 *
 * `tabs` : `{ key, label, badge? }[]` — `badge` est un ReactNode déjà prêt
 * (ex: un compteur), affiché après le libellé.
 */
export function TabBar({ tabs, active, onChange, className = '' }) {
  return (
    <div className={`relative mb-6 ${className}`}>
      {/* Barre pleine sur laquelle "reposent" tous les onglets — dans la
          couleur de l'onglet actif, qui s'y prolonge sans coupure. */}
      <div className="absolute inset-x-0 bottom-0 h-1.5 rounded-full bg-primary-600" aria-hidden="true" />

      <div className="relative flex items-end gap-1.5 overflow-x-auto pt-1">
        {tabs.map((tab) => {
          const isActive = active === tab.key
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => onChange(tab.key)}
              className={[
                'relative flex items-center gap-1.5 px-5 shrink-0 text-sm font-semibold whitespace-nowrap transition-all duration-200 rounded-t-2xl',
                isActive
                  ? 'h-11 z-10 bg-primary-600 text-white shadow-lg shadow-primary-900/20'
                  : 'h-10 mb-0.5 bg-ink-800 text-white/85 hover:bg-ink-700 hover:text-white',
              ].join(' ')}
            >
              {tab.label}
              {tab.badge}
            </button>
          )
        })}
      </div>
    </div>
  )
}
