import { apiClient } from './client'

const base = (etablissementId) => `/finances/etablissements/${etablissementId}`

function withQuery(path, params = {}) {
  const qs = new URLSearchParams(
    Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== '')),
  ).toString()
  return qs ? `${path}?${qs}` : path
}

/**
 * Module Finances. Les réponses ne sont pas typées dans la spec
 * (ApiSuccessResponse générique) — on affiche donc les données de façon
 * défensive et on ajustera une fois la forme exacte confirmée en test live.
 */

// Paie
/** `GenererPaieDto` : mois*, annee*, primes?, heuresSup?, retenues?. */
export function genererPaie(etablissementId, employeId, data) {
  return apiClient.post(`${base(etablissementId)}/employes/${employeId}/paie`, data)
}

/**
 * `PayerPaieDto` : { tresorerieId }. Aucun endpoint documenté pour lister/
 * créer une trésorerie — champ texte libre en attendant une clarification
 * du backend (même limitation que `CreateDepenseDto.tresorerieId`).
 */
export function payerPaie(etablissementId, bulletinId, data) {
  return apiClient.patch(`${base(etablissementId)}/paie/${bulletinId}/payer`, data)
}

export function listPaiePeriode(etablissementId, mois, annee) {
  return apiClient.get(`${base(etablissementId)}/paie/periode?mois=${mois}&annee=${annee}`)
}

// Types de frais — `CreateTypeFraisDto` : code (enum), libelle, montant, periodicite, anneeScolaireId (requis).
export function listTypesFrais(etablissementId, anneeId) {
  return apiClient.get(`${base(etablissementId)}/annees/${anneeId}/types-frais`)
}
export function createTypeFrais(etablissementId, data) {
  return apiClient.post(`${base(etablissementId)}/types-frais`, data)
}
export function setTypeFraisActif(etablissementId, id, actif) {
  return apiClient.patch(`${base(etablissementId)}/types-frais/${id}/actif`, { actif })
}

/**
 * Réductions/bourses — `CreateReductionDto` : type (enum), libelle, +
 * pourcentage OU montant. AUCUN endpoint de liste n'existe (seulement
 * créer/modifier) — signalé au backend. On ne peut donc afficher/proposer
 * que les réductions créées PENDANT la session en cours (accumulées
 * côté client), pas l'historique complet.
 */
export function createReduction(etablissementId, data) {
  return apiClient.post(`${base(etablissementId)}/reductions`, data)
}
export function updateReduction(etablissementId, id, data) {
  return apiClient.patch(`${base(etablissementId)}/reductions/${id}`, data)
}

// Échéances
export function genererEcheances(etablissementId, inscriptionId) {
  return apiClient.post(`${base(etablissementId)}/inscriptions/${inscriptionId}/echeances`)
}
export function listEcheances(etablissementId, { page, limit, inscriptionId, statut } = {}) {
  return apiClient.get(withQuery(`${base(etablissementId)}/echeances`, { page, limit, inscriptionId, statut }))
}
/** `AppliquerReductionDto` : { reductionId }. */
export function appliquerReduction(etablissementId, echeanceId, reductionId) {
  return apiClient.patch(`${base(etablissementId)}/echeances/${echeanceId}/reduction`, { reductionId })
}
export function listImpayes(etablissementId) {
  return apiClient.get(`${base(etablissementId)}/impayes`)
}
/** `EncaisserDto` : montant*, mode* (enum), reference?, idempotencyKey?. */
export function encaisser(etablissementId, echeanceId, data) {
  return apiClient.post(`${base(etablissementId)}/echeances/${echeanceId}/encaisser`, data)
}
export function listEncaissements(etablissementId) {
  return apiClient.get(`${base(etablissementId)}/encaissements`)
}
/** `InitierMobileMoneyDto` : echeanceId*, telephone*, fournisseur* (ORANGE/MTN/WAVE), idempotencyKey?. */
export function initierMobileMoney(etablissementId, data) {
  return apiClient.post(`${base(etablissementId)}/mobile-money/initier`, data)
}

/**
 * Dépenses — `CreateDepenseDto` : categorieId*, tresorerieId*, montant*,
 * date*, mode* + sousCategorie/budgetId/justificatifUrl optionnels. Ni
 * `categorieId` ni `tresorerieId` n'ont d'endpoint de liste/création —
 * champs texte libre en attendant, comme pour la Paie.
 */
export function createDepense(etablissementId, data) {
  return apiClient.post(`${base(etablissementId)}/depenses`, data)
}
export function listDepenses(etablissementId, { page, limit, categorieId } = {}) {
  return apiClient.get(withQuery(`${base(etablissementId)}/depenses`, { page, limit, categorieId }))
}
export function validerDepense(etablissementId, depenseId) {
  return apiClient.patch(`${base(etablissementId)}/depenses/${depenseId}/valider`)
}

// Budgets — `CreateBudgetDto` : anneeScolaireId*, montantPrevu* + service/departement/seuilAlerte optionnels.
export function createBudget(etablissementId, data) {
  return apiClient.post(`${base(etablissementId)}/budgets`, data)
}
export function listBudgets(etablissementId, { page, limit, anneeScolaireId } = {}) {
  return apiClient.get(withQuery(`${base(etablissementId)}/budgets`, { page, limit, anneeScolaireId }))
}
export function listBudgetsAlertes(etablissementId) {
  return apiClient.get(`${base(etablissementId)}/budgets/alertes`)
}
