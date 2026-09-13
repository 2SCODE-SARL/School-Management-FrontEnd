import { apiClient } from './client'

const base = (etablissementId) => `/parametrage/etablissements/${etablissementId}/parametres`

function withQuery(path, params = {}) {
  const qs = new URLSearchParams(
    Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== '')),
  ).toString()
  return qs ? `${path}?${qs}` : path
}

/**
 * Paramétrage — magasin clé/valeur générique par établissement, catégorisé.
 * `SetParametreDto` : categorie (enum), cle, valeur (JSON libre), description?.
 */
export const listParametres = (etablissementId, categorie) => apiClient.get(withQuery(base(etablissementId), { categorie }))
export const getParametre = (etablissementId, cle) => apiClient.get(`${base(etablissementId)}/${encodeURIComponent(cle)}`)
export const setParametre = (etablissementId, data) => apiClient.post(base(etablissementId), data)
export const deleteParametre = (etablissementId, cle) => apiClient.delete(`${base(etablissementId)}/${encodeURIComponent(cle)}`)
