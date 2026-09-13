/**
 * Petites règles de validation composables, réutilisables dans tous les
 * formulaires. Chaque règle retourne un message d'erreur (string) ou null.
 */
export const rules = {
  required:
    (message = 'Ce champ est requis.') =>
    (value) =>
      value === undefined || value === null || String(value).trim() === ''
        ? message
        : null,

  maxLength: (max, message) => (value) =>
    value && String(value).length > max
      ? (message ?? `${max} caractères maximum.`)
      : null,

  email:
    (message = 'Adresse e-mail invalide.') =>
    (value) =>
      value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? message : null,

  minLength: (min, message) => (value) =>
    value && String(value).length < min
      ? (message ?? `${min} caractères minimum.`)
      : null,

  integer:
    (message = 'Doit être un nombre entier.') =>
    (value) =>
      value !== '' && value !== undefined && value !== null && !Number.isInteger(Number(value))
        ? message
        : null,

  min: (min, message) => (value) =>
    value !== '' && value !== undefined && value !== null && Number(value) < min
      ? (message ?? `Doit être supérieur ou égal à ${min}.`)
      : null,
}

/**
 * Valide `values` selon `schema` ({ champ: [règle1, règle2, ...] }).
 * Retourne { champ: 'premier message d'erreur' } pour chaque champ invalide.
 */
export function validate(values, schema) {
  const errors = {}
  for (const [field, fieldRules] of Object.entries(schema)) {
    for (const rule of fieldRules) {
      const message = rule(values[field])
      if (message) {
        errors[field] = message
        break
      }
    }
  }
  return errors
}
