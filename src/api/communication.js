import { apiClient } from './client'

const base = (etablissementId) => `/communication/etablissements/${etablissementId}`

function withQuery(path, params = {}) {
  const qs = new URLSearchParams(
    Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== '')),
  ).toString()
  return qs ? `${path}?${qs}` : path
}

// Templates (Admin/Directeur) — modèles de message réutilisables par code+canal.
/** `CreateTemplateDto` : code (enum fixe), canal (SMS/EMAIL/WHATSAPP/IN_APP), sujet?, contenu. */
export const createTemplate = (etablissementId, data) => apiClient.post(`${base(etablissementId)}/templates`, data)
export const listTemplates = (etablissementId, canal) =>
  apiClient.get(withQuery(`${base(etablissementId)}/templates`, { canal }))
/** `UpdateTemplateDto` : sujet?, contenu?. */
export const updateTemplate = (etablissementId, templateId, data) =>
  apiClient.patch(`${base(etablissementId)}/templates/${templateId}`, data)

// Notifications — envoyées par Admin/Directeur/Secrétaire à un destinataire précis.
/** `EnvoyerNotificationDto` : destinataireId, type (même enum que les templates), canal, sujet?, contenu, cibleType?/cibleId?. */
export const envoyerNotification = (etablissementId, data) =>
  apiClient.post(`${base(etablissementId)}/notifications`, data)

// "Mes notifications" — accessible à tout utilisateur connecté, quel que soit son rôle.
export const listMesNotifications = ({ page, limit, statut } = {}) =>
  apiClient.get(withQuery('/communication/me/notifications', { page, limit, statut }))
export const listMesNotificationsNonLues = () => apiClient.get('/communication/me/notifications/non-lues')
export const marquerNotificationLue = (notificationId) =>
  apiClient.patch(`/communication/me/notifications/${notificationId}/lue`)
