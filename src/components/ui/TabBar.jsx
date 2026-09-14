/**
 * Barre d'onglets "pilule" — l'onglet actif ressort en blanc avec une
 * ombre légère sur un fond gris clair, les autres restent discrets. Rendu
 * léger et moderne, sans soulignement ; s'enroule proprement sur
 * plusieurs lignes quand il y a beaucoup d'onglets (Académique, Finances).
 *
 * `tabs` : `{ key, label, badge? }[]` — `badge` est un ReactNode déjà prêt
 * (ex: un compteur), affiché après le libellé.
 */
export function TabBar({ tabs, active, onChange, className = '' }) {
  return (
    <div className={`inline-flex flex-wrap gap-1 p-1 bg-ink-100/70 rounded-2xl mb-5 ${className}`}>
      {tabs.map((tab) => (
        <button
          key={tab.key}
          type="button"
          onClick={() => onChange(tab.key)}
          className={[
            'flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200',
            active === tab.key
              ? 'bg-white text-primary-700 shadow-sm'
              : 'text-ink-500 hover:text-ink-700',
          ].join(' ')}
        >
          {tab.label}
          {tab.badge}
        </button>
      ))}
    </div>
  )
}
