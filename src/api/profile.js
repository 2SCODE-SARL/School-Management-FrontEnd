import { apiClient } from './client'

/** GET /api/users/me -> mon profil (tous rôles confondus) */
export function getMyProfile() {
  return apiClient.get('/users/me')
}

/** POST /api/users/me/change-password -> ancien mot de passe requis */
export function changeMyPassword(ancienMotDePasse, nouveauMotDePasse) {
  return apiClient.post('/users/me/change-password', {
    ancienMotDePasse,
    nouveauMotDePasse,
  })
}

/**
 * PATCH /api/users/me/profile -> self-service limité à téléphone, adresse
 * et photo (`UpdateOwnProfileDto` + champ `photo` binaire) — tout le reste
 * (nom, rôle, établissement...) reste modifiable uniquement par la
 * Direction via `PATCH /users/{id}`. Une chaîne vide efface la valeur côté
 * backend, donc on n'envoie que les champs réellement changés par l'appelant.
 */
export function updateMyProfile({ telephone, adresse, photo } = {}) {
  const formData = new FormData()
  if (telephone !== undefined) formData.append('telephone', telephone)
  if (adresse !== undefined) formData.append('adresse', adresse)
  if (photo) formData.append('photo', photo)
  return apiClient.patch('/users/me/profile', formData)
}
