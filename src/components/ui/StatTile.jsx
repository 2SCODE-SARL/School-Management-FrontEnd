/** Petite tuile de statistique pour les tableaux de bord (icône + chiffre + libellé). */
export function StatTile({ icon: Icon, label, value, hint }) {
  return (
    <div className="bg-white rounded-2xl border border-ink-100 p-5 flex items-center gap-4">
      <div className="h-11 w-11 rounded-xl bg-primary-50 flex items-center justify-center shrink-0">
        <Icon className="h-5 w-5 text-primary-600" />
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-heading font-bold text-ink-900 leading-tight">
          {value}
        </p>
        <p className="text-sm text-ink-500 truncate">{label}</p>
        {hint && <p className="text-xs text-ink-400 mt-0.5 truncate">{hint}</p>}
      </div>
    </div>
  )
}
