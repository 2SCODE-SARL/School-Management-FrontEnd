export const CATEGORIE_DOCUMENT_LABELS = {
  ADMINISTRATIF: 'Administratif',
  ELEVE: 'Élève',
  PERSONNEL: 'Personnel',
  PEDAGOGIQUE: 'Pédagogique',
  FINANCIER: 'Financier',
}
export const CATEGORIE_DOCUMENT_OPTIONS = Object.entries(CATEGORIE_DOCUMENT_LABELS).map(([value, label]) => ({ value, label }))

export const FORMAT_DOCUMENT_LABELS = {
  PDF: 'PDF',
  WORD: 'Word',
  EXCEL: 'Excel',
  IMAGE: 'Image',
  ZIP: 'ZIP',
}
export const FORMAT_DOCUMENT_OPTIONS = Object.entries(FORMAT_DOCUMENT_LABELS).map(([value, label]) => ({ value, label }))

export const CONFIDENTIALITE_LABELS = {
  PUBLIC: 'Public',
  INTERNE: 'Interne',
  CONFIDENTIEL: 'Confidentiel',
}
export const CONFIDENTIALITE_OPTIONS = Object.entries(CONFIDENTIALITE_LABELS).map(([value, label]) => ({ value, label }))

export const STATUT_DOCUMENT_LABELS = {
  ACTIF: 'Actif',
  ARCHIVE: 'Archivé',
}
export function statutDocumentBadgeVariant(statut) {
  return statut === 'ARCHIVE' ? 'neutral' : 'success'
}

// Extension à l'usage : mêmes extensions que celles reconnues côté
// InscriptionDocuments (voir eleves/InscriptionDocuments.jsx).
const EXTENSION_TO_FORMAT = {
  pdf: 'PDF',
  doc: 'WORD',
  docx: 'WORD',
  xls: 'EXCEL',
  xlsx: 'EXCEL',
  jpg: 'IMAGE',
  jpeg: 'IMAGE',
  png: 'IMAGE',
  gif: 'IMAGE',
  webp: 'IMAGE',
  zip: 'ZIP',
}
export function guessFormatFromFileName(fileName) {
  const ext = fileName.split('.').pop()?.toLowerCase()
  return EXTENSION_TO_FORMAT[ext] ?? 'PDF'
}

export const TRANSFERT_FORMAT_OPTIONS = [
  { value: 'CSV', label: 'CSV' },
  { value: 'XLSX', label: 'Excel (XLSX)' },
  { value: 'PDF', label: 'PDF' },
  { value: 'JSON', label: 'JSON' },
]

export const MODELE_CODE_LABELS = {
  BULLETIN: 'Bulletin',
  RELEVE_NOTES: 'Relevé de notes',
  PV_DELIBERATION: 'PV de délibération',
  PALMARES: 'Palmarès',
  CERTIFICAT_SCOLARITE: 'Certificat de scolarité',
  CERTIFICAT_REUSSITE: 'Certificat de réussite',
  ATTESTATION: 'Attestation',
  DIPLOME: 'Diplôme',
}
export const MODELE_CODE_OPTIONS = Object.entries(MODELE_CODE_LABELS).map(([value, label]) => ({ value, label }))
