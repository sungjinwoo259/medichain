import { useLocation } from 'react-router-dom'
import { Navbar } from '../components/Navbar.jsx'
import { Sidebar } from '../components/Sidebar.jsx'

export function AppLayout({ children }) {
  const location = useLocation()
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register'

  if (isAuthPage) {
    return <div className="min-h-screen bg-[#F7FBFF] text-[#1A1A1A]">{children}</div>
  }

  return (
    <div className="min-h-screen bg-[#F7FBFF] text-[#1A1A1A] flex flex-col">
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto px-6 py-4 bg-[#F7FBFF] border-l border-[#D1E5F0]">
          {children}
        </main>
      </div>
    </div>
  )
}


