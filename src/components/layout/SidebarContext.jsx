import { createContext, useContext, useEffect, useState } from 'react'

const SidebarContext = createContext(null)
const STORAGE_KEY = 'ge_sidebar_collapsed'

function readStoredCollapsed() {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'true'
  } catch {
    return false
  }
}

/**
 * État partagé de la sidebar :
 * - `collapsed` : mode réduit (icônes seules) sur desktop, mémorisé
 * - `mobileOpen` : tiroir ouvert/fermé sur mobile/tablette (< lg)
 */
export function SidebarProvider({ children }) {
  const [collapsed, setCollapsed] = useState(readStoredCollapsed)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, String(collapsed))
    } catch {
      // stockage indisponible (navigation privée...) : on ignore simplement
    }
  }, [collapsed])

  return (
    <SidebarContext.Provider
      value={{ collapsed, setCollapsed, mobileOpen, setMobileOpen }}
    >
      {children}
    </SidebarContext.Provider>
  )
}

export function useSidebar() {
  const ctx = useContext(SidebarContext)
  if (!ctx) throw new Error('useSidebar doit être utilisé dans un <SidebarProvider>')
  return ctx
}
