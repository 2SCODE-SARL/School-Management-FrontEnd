import { useCountUp } from '../../hooks/useCountUp'

/**
 * Petite tuile d'alerte (icône + compteur) du tableau de bord — variante
 * compacte de `StatTile`. `onClick` la rend cliquable vers le module
 * concerné quand le compteur est > 0.
 */
export function AlertTile({ icon: Icon, label, count, onClick }) {
  const animated = useCountUp(count)
  const active = count > 0
  const clickable = onClick && active
  const Wrapper = clickable ? 'button' : 'div'

  return (
    <Wrapper
      type={clickable ? 'button' : undefined}
      onClick={clickable ? onClick : undefined}
      className={[
        'flex items-center gap-3 rounded-xl p-3 w-full text-left transition-colors',
        active ? 'bg-warning-50' : 'bg-ink-50',
        clickable ? 'cursor-pointer hover:bg-warning-100' : '',
      ].join(' ')}
    >
      <div
        className={[
          'h-9 w-9 rounded-lg flex items-center justify-center shrink-0',
          active ? 'bg-warning-500/15 text-warning-600' : 'bg-white text-ink-400',
        ].join(' ')}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className={`text-lg font-heading font-bold leading-tight ${active ? 'text-ink-900' : 'text-ink-400'}`}>
          {animated}
        </p>
        <p className="text-xs text-ink-500 truncate">{label}</p>
      </div>
    </Wrapper>
  )
}
