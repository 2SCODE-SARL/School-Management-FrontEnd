import { apiClient } from './client'

const base = (etablissementId) => `/portail-parents/direction/${etablissementId}/demandes`

/** Demandes des parents (certificat, correction de note, congé...) — Admin/Directeur/Secrétaire. */
export const listDemandes = (etablissementId, statut) =>
  apiClient.get(statut ? `${base(etablissementId)}?statut=${statut}` : base(etablissementId))
/** `RepondreDemandeDto` : { reponse }. */
export const repondreDemande = (etablissementId, demandeId, reponse) =>
  apiClient.patch(`${base(etablissementId)}/${demandeId}/repondre`, { reponse })
export const cloturerDemande = (etablissementId, demandeId) =>
  apiClient.patch(`${base(etablissementId)}/${demandeId}/cloturer`)
