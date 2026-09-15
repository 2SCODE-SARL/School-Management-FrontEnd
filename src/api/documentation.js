import { apiClient } from './client'

const base = (etablissementId) => `/documentation/etablissements/${etablissementId}`

function withQuery(path, params = {}) {
  const qs = new URLSearchParams(
    Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== '')),
  ).toString()
  return qs ? `${path}?${qs}` : path
}

// Documents — module central (upload réel de fichiers), distinct des
// documents d'inscription (api/inscriptions.js) même s'ils partagent le
// même mécanisme d'upload sous le capot.
/**
 * Upload d'un vrai fichier (PDF/image/...) dans le module Documentation
 * central de l'établissement. Retourne un document dont on récupère
 * ensuite l'URL pour l'attacher ailleurs (ex: document d'inscription via
 * `InscriptionUploadDocumentDto.fichierUrl`).
 */
export function uploadDocument(etablissementId, formData) {
  return apiClient.post(`${base(etablissementId)}/documents/upload`, formData)
}

/** `DocumentationUploadDocumentDto` : categorieCode, type, titre, format (requis) + description/tags/confidentialite/cibleType/cibleId. */
export function listDocuments(etablissementId, { page, limit, categorieCode, statut, q } = {}) {
  return apiClient.get(withQuery(`${base(etablissementId)}/documents`, { page, limit, categorieCode, statut, q }))
}

export function getDocument(etablissementId, documentId) {
  return apiClient.get(`${base(etablissementId)}/documents/${documentId}`)
}

export function deleteDocument(etablissementId, documentId) {
  return apiClient.delete(`${base(etablissementId)}/documents/${documentId}`)
}

export function archiverDocument(etablissementId, documentId) {
  return apiClient.patch(`${base(etablissementId)}/documents/${documentId}/archiver`)
}

export function restaurerDocument(etablissementId, documentId) {
  return apiClient.patch(`${base(etablissementId)}/documents/${documentId}/restaurer`)
}

/**
 * Nouveau (ajouté par le backend suite à notre remontée -5) : renvoie une
 * URL signée temporaire `{ url, expirationSecondes }` — jusqu'ici l'API ne
 * renvoyait que le chemin de stockage brut (`s3://...`), pas ouvrable par
 * le staff.
 */
export function getDocumentTelechargement(etablissementId, documentId) {
  return apiClient.get(`${base(etablissementId)}/documents/${documentId}/telechargement`)
}

// Import / Export — transferts tenantisés avec traçabilité (`TransfertDto` :
// entite, format (CSV/XLSX/PDF/JSON), perimetre?).
export function importerFichier(etablissementId, formData) {
  return apiClient.post(`${base(etablissementId)}/import`, formData)
}

export function exporterDonnees(etablissementId, data) {
  return apiClient.post(`${base(etablissementId)}/export`, data)
}

export function listImports(etablissementId) {
  return apiClient.get(`${base(etablissementId)}/imports`)
}

export function listExports(etablissementId) {
  return apiClient.get(`${base(etablissementId)}/exports`)
}

// Modèles de documents — gabarits réutilisables (bulletin, certificat...)
// pour générer un PDF via Puppeteer avec des variables clé/valeur.
/** `CreateModeleDocumentDto` : code (enum fixe), libelle (requis) + logoUrl/signatureUrl/piedPage/numerotationAuto/formatNumero. */
export function createModele(etablissementId, data) {
  return apiClient.post(`${base(etablissementId)}/modeles`, data)
}

export function listModeles(etablissementId) {
  return apiClient.get(`${base(etablissementId)}/modeles`)
}

/** `GenererPdfDto` : { variables: { ... } } (max 50 clés). */
export function genererPdf(etablissementId, modeleId, variables) {
  return apiClient.post(`${base(etablissementId)}/modeles/${modeleId}/generer-pdf`, { variables })
}
