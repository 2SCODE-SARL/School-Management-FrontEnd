import { useEffect, useState } from 'react'

function getInitials(name) {
  return (
    name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || '?'
  )
}

/**
 * Avatar circulaire : image si `src` fourni et qu'elle charge, sinon
 * initiales déduites de `name`. Certains DTOs backend documentent
 * `photoUrl` comme `type: object` plutôt que `string` (probablement un
 * champ moins strictement typé côté API) — on ne fait donc confiance à
 * `src` que s'il s'agit bien d'une chaîne, et surtout on retombe sur les
 * initiales si l'image échoue à charger (URL invalide/expirée/protégée)
 * plutôt que de laisser le navigateur afficher une icône "image cassée" +
 * le texte alternatif qui déborde de la mise en page.
 */
export function Avatar({ name = '', src, size = 36, className = '' }) {
  const validSrc = typeof src === 'string' && src ? src : null
  const [failed, setFailed] = useState(false)

  // Réessaie l'image si `src` change (ex: la photo vient d'être mise à jour).
  useEffect(() => {
    setFailed(false)
  }, [validSrc])

  if (validSrc && !failed) {
    return (
      <img
        src={validSrc}
        alt={name}
        onError={() => setFailed(true)}
        className={`rounded-full object-cover shrink-0 ${className}`}
        style={{ height: size, width: size }}
      />
    )
  }

  return (
    <span
      className={`flex items-center justify-center rounded-full bg-primary-100 text-primary-700 font-heading font-semibold shrink-0 ${className}`}
      style={{ height: size, width: size, fontSize: size * 0.4 }}
    >
      {getInitials(name)}
    </span>
  )
}
