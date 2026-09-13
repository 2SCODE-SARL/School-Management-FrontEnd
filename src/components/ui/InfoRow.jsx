/** Ligne label/valeur avec icône, utilisée dans les modales de détail et le profil. */
export function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-ink-50 last:border-0">
      <div className="h-9 w-9 rounded-lg bg-ink-50 flex items-center justify-center shrink-0">
        <Icon className="h-4 w-4 text-ink-500" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-ink-400">{label}</p>
        <p className="text-sm text-ink-900 truncate">{value || '—'}</p>
      </div>
    </div>
  )
}
