/**
 * Message d'erreur d'une requête ratée — affiche le vrai code/message
 * renvoyé par l'API (`ApiError`) au lieu d'un texte générique. Utile pour
 * diagnostiquer un problème (ex: le 500 de `GET /rbac/roles?q=...`, trouvé
 * grâce à ça) sans avoir besoin des DevTools.
 */
export function ApiErrorMessage({ error, fallback = 'Une erreur est survenue.', className = 'p-8 text-center text-sm text-danger-600' }) {
  return (
    <p className={className}>
      {error?.statusCode ? `Erreur ${error.statusCode} : ` : ''}
      {error?.message || fallback}
    </p>
  )
}
