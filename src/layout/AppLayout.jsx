import { useLocation } from 'react-router-dom'
import { Navbar } from '../components/Navbar.jsx'
import { Sidebar } from '../components/Sidebar.jsx'

export function AppLayout({ children }) {
  const location = useLocation()
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register'

  if (isAuthPage) {
    return <div className="min-h-screen bg-slate-950">{children}</div>
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex flex-col">
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto px-6 py-4 bg-slate-900/40 border-l border-slate-800">
          {children}
        </main>
      </div>
    </div>
  )
}


