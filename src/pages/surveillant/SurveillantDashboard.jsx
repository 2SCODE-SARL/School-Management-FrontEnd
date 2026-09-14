import { useAuth } from '../../auth/AuthContext'
import { WelcomeBanner } from '../../components/ui/WelcomeBanner'

export default function SurveillantDashboard() {
  const { user } = useAuth()

  return (
    <div>
      <WelcomeBanner name={user?.prenom} subtitle="Entrées/sorties et alertes du jour." />
      <div className="bg-white rounded-2xl border border-dashed border-ink-200 p-16 text-center text-ink-400">
        Entrées/sorties et alertes du jour arriveront ici.
      </div>
    </div>
  )
}
