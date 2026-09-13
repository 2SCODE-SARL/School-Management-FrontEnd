/** Date seule, format français (ex: "11 nov. 1995"). */
export function formatDate(value, options = { dateStyle: 'medium' }) {
  if (!value) return null
  return new Date(value).toLocaleDateString('fr-FR', options)
}

/** Date + heure, format français (ex: "11 nov. 1995 à 14:30"). */
export function formatDateTime(value) {
  if (!value) return null
  return new Date(value).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' })
}
