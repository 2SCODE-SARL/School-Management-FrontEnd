import { ChevronRight } from 'lucide-react'
import { useCountUp } from '../../hooks/useCountUp'

/**
 * Tuile de statistique pour les tableaux de bord (icône + chiffre + libellé).
 * `value` numérique s'anime en douceur au chargement (compteur ease-out).
 * `onClick` la rend cliquable — mène vers le module/l'onglet lié à cette
 * statistique — avec un effet de survol discret (pas de scale/bounce).
 */
export function StatTile({ icon: Icon, label, value, hint, prefix = '', suffix = '', onClick }) {
  const animated = useCountUp(value)
  const displayValue = typeof value === 'number' && Number.isFinite(value) ? `${prefix}${animated.toLocaleString('fr-FR')}${suffix}` : value

  const Wrapper = onClick ? 'button' : 'div'

  return (
    <Wrapper
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={[
        'group bg-white rounded-2xl border border-ink-100 p-5 flex items-center gap-4 w-full text-left transition-colors',
        onClick ? 'cursor-pointer hover:border-primary-200 hover:bg-primary-50/30' : '',
      ].join(' ')}
    >
      <div className="h-11 w-11 rounded-xl bg-primary-50 flex items-center justify-center shrink-0">
        <Icon className="h-5 w-5 text-primary-600" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-2xl font-heading font-bold text-ink-900 leading-tight">
          {displayValue}
        </p>
        <p className="text-sm text-ink-500 truncate">{label}</p>
        {hint && <p className="text-xs text-ink-400 mt-0.5 truncate">{hint}</p>}
      </div>
      {onClick && (
        <ChevronRight className="h-4 w-4 text-ink-300 shrink-0 opacity-0 -translate-x-1 transition-all group-hover:opacity-100 group-hover:translate-x-0" />
      )}
    </Wrapper>
  )
}
