/**
 * Barre d'onglets "menu plein" : coins hauts arrondis, couleurs pleines et
 * contrastées (pas de tons pâles) — l'onglet actif est en bleu (couleur de
 * marque), en texte blanc gras, et se prolonge directement dans la barre
 * pleine en dessous (même couleur, aucune coupure visible) ; les onglets
 * inactifs sont sombres (encre foncée) et "posés" légèrement au-dessus de
 * cette barre plutôt que d'y plonger. Défile horizontalement plutôt que de
 * passer à la ligne, pour rester propre même avec beaucoup d'onglets.
 *
 * Collée sous l'en-tête (`sticky top-16` — 64px, la hauteur réelle du
 * Topbar) plutôt que de défiler avec le contenu : sur une longue liste en
 * dessous, on garde toujours ses onglets sous la main. `top-16` doit
 * rester synchronisé avec la hauteur du Topbar si celle-ci change un jour.
 *
 * `tabs` : `{ key, label, badge? }[]` — `badge` est un ReactNode déjà prêt
 * (ex: un compteur), affiché après le libellé.
 */
export function TabBar({ tabs, active, onChange, className = '' }) {
  return (
    <div className={`sticky top-16 z-10 -mx-4 sm:-mx-6 px-4 sm:px-6 bg-ink-50 pt-2 pb-4 ${className}`}>
      <div className="relative">
        {/* Ligne fine par-dessus tous les onglets — ils semblent glissés
            derrière elle plutôt que posés dessus (z-index au-dessus de
            l'onglet actif, dont le z-10 sert seulement à passer devant les
            autres onglets, pas devant cette ligne). */}
        <div className="absolute inset-x-0 bottom-0 h-1 rounded-full bg-primary-600 z-20" aria-hidden="true" />

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
                    : 'h-10 mb-0.5 bg-[#979797] text-white/85 hover:bg-[#868686] hover:text-white',
                ].join(' ')}
              >
                {tab.label}
                {tab.badge}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
