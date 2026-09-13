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

/** Avatar circulaire : image si `src` fourni, sinon initiales déduites de `name`. */
export function Avatar({ name = '', src, size = 36, className = '' }) {
  if (src) {
    return (
      <img
        src={src}
        alt={name}
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
