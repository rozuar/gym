import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { Calendar, BarChart2, Rss, Trophy, User, Zap, Settings } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

const tabs = [
  { to: '/schedule', label: 'Horario', icon: Calendar },
  { to: '/results', label: 'Results', icon: BarChart2 },
  { to: '/feed', label: 'Feed', icon: Rss },
  { to: '/events', label: 'Eventos', icon: Trophy },
  { to: '/profile', label: 'Perfil', icon: User },
]

export function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="min-h-screen pb-16">
      <header className="sticky top-0 z-40 bg-surface/70 backdrop-blur-xl border-b border-accent/10">
        <div className="max-w-lg mx-auto flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-accent to-accent-2 flex items-center justify-center">
              <Zap size={14} className="text-white" />
            </div>
            <h1 className="font-bold text-base">Box Magic</h1>
          </div>
          <div className="flex items-center gap-1">
            {user?.role === 'admin' && (
              <button
                onClick={() => navigate('/admin')}
                className="p-2 rounded-lg text-muted hover:text-accent hover:bg-accent/10 transition-colors"
                title="Panel Admin"
              >
                <Settings size={16} />
              </button>
            )}
            <button
              onClick={logout}
              className="px-3 py-1.5 rounded-lg text-xs text-muted hover:text-white hover:bg-white/5 transition-colors"
            >
              Salir
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-4 animate-fade-in">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-surface/80 backdrop-blur-xl border-t border-accent/10">
        <div className="max-w-lg mx-auto flex">
          {tabs.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center py-2.5 gap-1 text-[10px] transition-all duration-150 ${
                  isActive
                    ? 'text-accent'
                    : 'text-muted hover:text-white'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span className={`relative flex items-center justify-center w-8 h-8 rounded-xl transition-all duration-150 ${isActive ? 'bg-accent/15' : ''}`}>
                    <Icon size={18} className={isActive ? 'text-accent' : ''} />
                    {isActive && (
                      <span className="absolute inset-0 rounded-xl ring-1 ring-accent/30" />
                    )}
                  </span>
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
