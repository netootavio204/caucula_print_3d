import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { useToast } from '../ui/Toast'
import { useAuth } from '../../hooks/useAuth'
import { Header } from './Header'
import { Sidebar } from './Sidebar'

export function AppLayout() {
  const [menuOpen, setMenuOpen] = useState(false)
  const { signOut } = useAuth()
  const { showToast } = useToast()
  const logout = async () => {
    try {
      await signOut()
    } catch {
      showToast('Não foi possível sair da conta.', 'error')
    }
  }
  return <div className="min-h-screen bg-surface"><Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} onLogout={logout} /><div className="lg:pl-72"><Header onMenu={() => setMenuOpen(true)} /><main className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8"><Outlet /></main></div></div>
}
