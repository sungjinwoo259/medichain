import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

const baseLinkClasses =
  'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors'

function linkClasses({ isActive }) {
  return [
    baseLinkClasses,
    isActive
      ? 'bg-[#4A90E2] text-white'
      : 'text-[#6B7280] hover:bg-[#E8F2F8] hover:text-[#1A1A1A]',
  ].join(' ')
}

export function Sidebar() {
  const { user } = useAuth()

  if (!user) {
    return null
  }

  return (
    <aside className="hidden w-60 flex-shrink-0 border-r border-[#D1E5F0] bg-white px-4 py-4 text-sm md:block">
      <nav className="space-y-1">
        <NavLink to="/dashboard" className={linkClasses}>
          Dashboard
        </NavLink>

        {user.role === 'admin' && (
          <NavLink to="/admin" className={linkClasses}>
            Admin Panel
          </NavLink>
        )}

        {user.role === 'manufacturer' && (
          <NavLink to="/manufacturer" className={linkClasses}>
            Manufacturer Panel
          </NavLink>
        )}

        {user.role === 'distributor' && (
          <NavLink to="/distributor" className={linkClasses}>
            Distributor Panel
          </NavLink>
        )}

        {user.role === 'pharmacy' && (
          <NavLink to="/pharmacy" className={linkClasses}>
            Pharmacy Panel
          </NavLink>
        )}

        {user.role === 'consumer' && (
          <NavLink to="/consumer" className={linkClasses}>
            Consumer View
          </NavLink>
        )}

        <NavLink to="/verify" className={linkClasses}>
          Verify Drug
        </NavLink>
      </nav>
    </aside>
  )
}


