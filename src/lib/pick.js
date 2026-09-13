/**
 * Lit `data[key]` en essayant plusieurs noms de champs plausibles — utile
 * quand la forme exacte d'une réponse API n'est pas typée dans la doc
 * (ApiSuccessResponse générique). Retourne `fallback` si aucun ne correspond.
 */
export function pick(data, keys, fallback = '—') {
  for (const key of keys) {
    if (data?.[key] !== undefined && data?.[key] !== null) return data[key]
  }
  return fallback
}

/** Variante pour un champ dont on attend un tableau. */
export function pickArray(data, keys) {
  for (const key of keys) {
    if (Array.isArray(data?.[key])) return data[key]
  }
  return []
}
