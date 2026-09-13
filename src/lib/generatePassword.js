// Alphabets sans caractères ambigus (0/O, 1/l/I...) pour rester lisible si
// le mot de passe doit être retapé à la main.
const UPPER = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
const LOWER = 'abcdefghijkmnpqrstuvwxyz'
const DIGITS = '23456789'
const SYMBOLS = '!@#$%*?'

function pick(chars) {
  return chars[Math.floor(Math.random() * chars.length)]
}

function shuffle(chars) {
  return chars
    .map((c) => [Math.random(), c])
    .sort((a, b) => a[0] - b[0])
    .map(([, c]) => c)
    .join('')
}

/** Génère un mot de passe robuste (par défaut 12 caractères) pour un nouveau compte. */
export function generatePassword(length = 12) {
  const all = UPPER + LOWER + DIGITS + SYMBOLS
  const required = [pick(UPPER), pick(LOWER), pick(DIGITS), pick(SYMBOLS)]
  const rest = Array.from({ length: Math.max(0, length - required.length) }, () =>
    pick(all),
  )
  return shuffle([...required, ...rest])
}
