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
