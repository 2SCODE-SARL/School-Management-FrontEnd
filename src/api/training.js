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

export function listTrainingCurrencies() {
  return apiClient.get('/training/referentiels/currencies')
}
export function createTrainingCurrency(data) {
  return apiClient.post('/training/referentiels/currencies', data)
}
export function updateTrainingCurrency(id, data) {
  return apiClient.patch(`/training/referentiels/currencies/${id}`, data)
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

// Vérification/KYC d'un prestataire — côté Formateur (son propre dossier).
export function getMyProviderVerification(providerId) {
  return apiClient.get(`/training/provider-verifications/providers/${providerId}`)
}
export function uploadProviderVerificationDocument(providerId, type, fichier) {
  const formData = new FormData()
  formData.append('type', type)
  formData.append('fichier', fichier)
  return apiClient.post(`/training/provider-verifications/providers/${providerId}/documents`, formData)
}
export function deleteProviderVerificationDocument(providerId, documentId) {
  return apiClient.delete(`/training/provider-verifications/providers/${providerId}/documents/${documentId}`)
}
export function getProviderVerificationDocumentDownload(providerId, documentId) {
  return apiClient.get(`/training/provider-verifications/providers/${providerId}/documents/${documentId}/download`)
}
export function submitProviderVerification(providerId) {
  return apiClient.post(`/training/provider-verifications/providers/${providerId}/submit`)
}

// Vérification/KYC — côté Administrateur (revue des dossiers soumis).
export function listProviderVerificationsAdmin({ status, providerType, page = 1, limit = 20 } = {}) {
  const params = new URLSearchParams()
  if (status) params.set('status', status)
  if (providerType) params.set('providerType', providerType)
  params.set('page', page)
  params.set('limit', limit)
  return apiClient.get(`/training/provider-verifications/admin?${params.toString()}`)
}
export function getProviderVerificationAdmin(verificationId) {
  return apiClient.get(`/training/provider-verifications/admin/${verificationId}`)
}
export function getProviderVerificationDocumentDownloadAdmin(verificationId, documentId) {
  return apiClient.get(
    `/training/provider-verifications/admin/${verificationId}/documents/${documentId}/download`,
  )
}
export function startReviewProviderVerification(verificationId) {
  return apiClient.patch(`/training/provider-verifications/admin/${verificationId}/start-review`)
}
export function approveProviderVerification(verificationId) {
  return apiClient.patch(`/training/provider-verifications/admin/${verificationId}/approve`)
}
export function rejectProviderVerification(verificationId, reason) {
  return apiClient.patch(`/training/provider-verifications/admin/${verificationId}/reject`, { reason })
}

// Produits (cours) — Formateur, pour un prestataire déjà vérifié.
export function listMyTrainingProducts({ providerId, status, page = 1, limit = 20 } = {}) {
  const params = new URLSearchParams()
  if (providerId) params.set('providerId', providerId)
  if (status) params.set('status', status)
  params.set('page', page)
  params.set('limit', limit)
  return apiClient.get(`/training/products/mine?${params.toString()}`)
}
export function createTrainingProduct(data) {
  return apiClient.post('/training/products', data)
}
export function getMyTrainingProduct(id) {
  return apiClient.get(`/training/products/${id}`)
}
export function updateTrainingProduct(id, data) {
  return apiClient.patch(`/training/products/${id}`, data)
}
