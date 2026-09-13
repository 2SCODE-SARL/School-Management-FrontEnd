import { useEffect, useState } from 'react'

/** Retourne `value` mais mis à jour seulement après `delay` ms d'inactivité. */
export function useDebouncedValue(value, delay = 350) {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timeout = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timeout)
  }, [value, delay])

  return debounced
}
