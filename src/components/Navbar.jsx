import { useAuth } from '../context/AuthContext.jsx'

export function Navbar() {
  const { user, logout } = useAuth()

  return (
    <header className="w-full border-b border-slate-800 bg-slate-900/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600 text-sm font-semibold">
            MC
          </span>
          <div>
            <p className="text-sm font-semibold text-slate-50">MediChain</p>
            <p className="text-xs text-slate-400">
              Prescription Drug Traceability on Blockchain
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {user && (
            <>
              <div className="text-right">
                <p className="text-xs font-medium text-slate-200">{user.name}</p>
                <p className="text-[11px] text-slate-400 capitalize">
                  {user.role}
                </p>
              </div>
              <button
                type="button"
                onClick={logout}
                className="rounded-md bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-100 hover:bg-slate-700 border border-slate-700"
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


