import { useAuth } from '../context/AuthContext.jsx'

export function Navbar() {
  const { user, logout } = useAuth()

  return (
    <header className="w-full border-b border-[#D1E5F0] bg-white backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#4A90E2] text-sm font-semibold text-white">
            MC
          </span>
          <div>
            <p className="text-sm font-semibold text-[#1A1A1A]">MediChain</p>
            <p className="text-xs text-[#6B7280]">
              Prescription Drug Traceability on Blockchain
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {user && (
            <>
              <div className="text-right">
                <p className="text-xs font-medium text-[#1A1A1A]">{user.name}</p>
                <p className="text-[11px] text-[#6B7280] capitalize">
                  {user.role}
                </p>
              </div>
              <button
                type="button"
                onClick={logout}
                className="rounded-md bg-[#F7FBFF] px-3 py-1.5 text-xs font-medium text-[#1A1A1A] hover:bg-[#E8F2F8] border border-[#D1E5F0]"
              >
                Logout
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}


