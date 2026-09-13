export default function PlaceholderPage({ title }) {
  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-ink-900 mb-6">{title}</h1>
      <div className="bg-white rounded-2xl border border-dashed border-ink-200 p-16 text-center text-ink-400">
        Module « {title} » à construire — on y arrive étape par étape.
      </div>
    </div>
  )
}
