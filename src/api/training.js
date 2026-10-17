import { apiClient } from './client'

// Module Formation (marketplace de cours en ligne) — préfixe /training,
// rôles propres au module (00 Public / 01 Commun / 10 Administrateur /
// 90 Formateur / 100 Apprenant), distincts des rôles scolaires habituels.

export function listTrainingCountries() {
  return apiClient.get('/training/referentiels/countries')
}
export function createTrainingCountry(data) {
  return apiClient.post('/training/referentiels/countries', data)
}
export function updateTrainingCountry(id, data) {
  return apiClient.patch(`/training/referentiels/countries/${id}`, data)
}

export function listTrainingLanguages() {
  return apiClient.get('/training/referentiels/languages')
}
export function createTrainingLanguage(data) {
  return apiClient.post('/training/referentiels/languages', data)
}
export function updateTrainingLanguage(id, data) {
  return apiClient.patch(`/training/referentiels/languages/${id}`, data)
}

// Prestataires (profil "formateur") — n'importe quel compte connecté peut
// créer le sien, individuel ou organisme.
export function listMyTrainingProviders() {
  return apiClient.get('/training/providers/mine')
}
export function createIndividualTrainingProvider(data) {
  return apiClient.post('/training/providers/individual', data)
}
export function createOrganizationTrainingProvider(data) {
  return apiClient.post('/training/providers/organizations', data)
}
