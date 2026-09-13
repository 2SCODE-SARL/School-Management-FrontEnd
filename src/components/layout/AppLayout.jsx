import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { SidebarProvider } from './SidebarContext'

/** Coquille commune (sidebar + entête) réutilisée par chaque espace de rôle. */
export function AppLayout({ navigation, subtitle }) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex bg-ink-50">
        <Sidebar navigation={navigation} subtitle={subtitle} />
        <div className="flex-1 flex flex-col min-w-0">
          <Topbar />
          <main className="flex-1 p-4 sm:p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}
