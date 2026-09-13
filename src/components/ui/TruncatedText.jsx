/** Texte tronqué avec "..." et infobulle native affichant le texte complet. */
export function TruncatedText({ text, maxWidth = 220, className = '' }) {
  return (
    <p className={`truncate ${className}`} style={{ maxWidth }} title={text || undefined}>
      {text || '—'}
    </p>
  )
}
