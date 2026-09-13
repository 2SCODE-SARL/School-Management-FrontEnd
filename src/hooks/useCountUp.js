import { useEffect, useRef, useState } from 'react'

/**
 * Anime un nombre de sa valeur précédente vers `target`, en douceur
 * (ease-out, ~700ms) — pensé pour rester discret et professionnel, pas un
 * effet "compteur qui s'emballe". Si `target` n'est pas un nombre fini
 * (ex: '—', '…' pendant un chargement en cascade), retombe tel quel sans
 * animer.
 */
export function useCountUp(target, duration = 700) {
  const [display, setDisplay] = useState(typeof target === 'number' ? target : 0)
  const fromRef = useRef(0)
  const frameRef = useRef(null)

  useEffect(() => {
    if (typeof target !== 'number' || !Number.isFinite(target)) {
      setDisplay(target)
      return
    }
    const from = fromRef.current
    const start = performance.now()

    function tick(now) {
      const progress = Math.min(1, (now - start) / duration)
      // ease-out cubic — démarre vite, ralentit en douceur vers la valeur finale.
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(Math.round(from + (target - from) * eased))
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick)
      } else {
        fromRef.current = target
      }
    }

    frameRef.current = requestAnimationFrame(tick)
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target])

  return display
}
