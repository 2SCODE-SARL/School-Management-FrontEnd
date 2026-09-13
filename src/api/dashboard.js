import { apiClient } from './client'

/**
 * GET .../tableaux-de-bord/etablissements/{id}/enseignant/me
 * "Emploi du temps, classes, absences" — la forme exacte de `data` n'est pas
 * typée dans la spec (réponse générique), on affiche donc ce qu'on reçoit de
 * façon défensive et on ajustera une fois la vraie forme confirmée en test.
 */
export function getEnseignantDashboard(etablissementId) {
  return apiClient.get(`/tableaux-de-bord/etablissements/${etablissementId}/enseignant/me`)
}

/**
 * GET .../tableaux-de-bord/etablissements/{id}/general
 * "Statistiques, évolution, graphiques, résultats, alertes" — n'a besoin que
 * de l'établissement (contrairement à .../directeur qui exige un trimestreId
 * qu'on ne peut pas encore récupérer). Même remarque sur la forme non typée.
 */
export function getGeneralDashboard(etablissementId) {
  return apiClient.get(`/tableaux-de-bord/etablissements/${etablissementId}/general`)
}

/**
 * GET .../tableaux-de-bord/etablissements/{id}/comptable
 * Réponse générique elle aussi (non typée dans la spec).
 */
export function getComptableDashboard(etablissementId) {
  return apiClient.get(`/tableaux-de-bord/etablissements/${etablissementId}/comptable`)
}
