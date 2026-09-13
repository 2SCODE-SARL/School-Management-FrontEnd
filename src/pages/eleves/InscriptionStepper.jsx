import { Check, X } from 'lucide-react'
import { INSCRIPTION_STATUT_LABELS } from '../../config/eleveLabels'

const STEPS = ['BROUILLON', 'SOUMISE', 'COMPLETE', 'VALIDEE']

/**
 * Repère visuel du parcours chronologique d'un dossier d'inscription — les
 * transitions étant à sens unique côté backend (impossible de reculer), ça
 * évite de croire qu'on peut "Compléter" avant d'avoir "Affecté" pendant
 * que c'est encore "Soumise".
 */
export function InscriptionStepper({ statut }) {
  if (statut === 'REFUSEE') {
    return (
      <div className="flex items-center gap-2 rounded-xl bg-danger-50 text-danger-600 text-sm font-medium px-4 py-3">
        <X className="h-4 w-4 shrink-0" />
        Dossier refusé
      </div>
    )
  }

  const currentIndex = STEPS.indexOf(statut)

  return (
    <div className="grid grid-cols-4">
      {STEPS.map((step, i) => {
        const done = currentIndex >= 0 && i < currentIndex
        const current = i === currentIndex
        return (
          <div key={step} className="relative flex flex-col items-center gap-1.5">
            {i > 0 && (
              <div
                className={[
                  'absolute right-1/2 top-4 h-0.5 w-full -z-10',
                  done || current ? 'bg-primary-600' : 'bg-ink-100',
                ].join(' ')}
              />
            )}
            <div
              className={[
                'h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 bg-white',
                done
                  ? 'bg-primary-600 text-white'
                  : current
                    ? 'bg-primary-50 text-primary-700 ring-2 ring-primary-600'
                    : 'bg-ink-100 text-ink-400',
              ].join(' ')}
            >
              {done ? <Check className="h-4 w-4" /> : i + 1}
            </div>
            <span
              className={[
                'text-xs text-center leading-tight',
                current ? 'text-primary-700 font-medium' : done ? 'text-ink-600' : 'text-ink-400',
              ].join(' ')}
            >
              {INSCRIPTION_STATUT_LABELS[step]}
            </span>
          </div>
        )
      })}
    </div>
  )
}
