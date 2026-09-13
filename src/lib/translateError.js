/**
 * Traduit un message de validation brut du backend (class-validator, en
 * anglais) en français. Les noms de champs restent tels quels (déjà en
 * français dans nos DTOs : coefficient, salaireBase...), seule la
 * formulation autour est reconnue et reformulée.
 *
 * Best-effort : un message non reconnu est renvoyé inchangé plutôt que de
 * planter — on préfère un message anglais occasionnel à rien du tout.
 */
const PATTERNS = [
  [/^(.+?) must not be less than (.+)$/, (f, n) => `${f} doit être supérieur ou égal à ${n}`],
  [/^(.+?) must not be greater than (.+)$/, (f, n) => `${f} doit être inférieur ou égal à ${n}`],
  [/^(.+?) must be a number conforming to the specified constraints$/, (f) => `${f} doit être un nombre valide`],
  [/^(.+?) must be a positive number$/, (f) => `${f} doit être un nombre positif`],
  [/^(.+?) must be an integer number$/, (f) => `${f} doit être un nombre entier`],
  [/^(.+?) should not be empty$/, (f) => `${f} est requis`],
  [/^(.+?) must be a string$/, (f) => `${f} doit être une chaîne de caractères`],
  [/^(.+?) must be an? email$/i, (f) => `${f} doit être une adresse email valide`],
  [/^(.+?) must be a boolean value$/, (f) => `${f} doit être vrai ou faux`],
  [/^(.+?) must be a Date instance$/, (f) => `${f} doit être une date valide`],
  [/^(.+?) must be a valid ISO 8601 date string$/, (f) => `${f} doit être une date valide`],
  [/^(.+?) must be one of the following values: (.+)$/, (f, values) => `${f} doit être l'une des valeurs suivantes : ${values}`],
  [/^(.+?) must be longer than or equal to (\d+) characters?$/, (f, n) => `${f} doit contenir au moins ${n} caractères`],
  [/^(.+?) must be shorter than or equal to (\d+) characters?$/, (f, n) => `${f} doit contenir au maximum ${n} caractères`],
  [/^(.+?) must be a UUID$/, (f) => `${f} doit être un identifiant valide`],
  [/^(.+?) should not exist$/, (f) => `${f} ne devrait pas être envoyé`],
]

export function translateValidationMessage(message) {
  if (typeof message !== 'string') return message
  for (const [regex, format] of PATTERNS) {
    const match = message.match(regex)
    if (match) return format(...match.slice(1))
  }
  return message
}
