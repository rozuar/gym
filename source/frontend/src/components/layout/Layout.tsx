import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

const tabs = [
  { to: '/schedule', label: 'Horario', icon: '📅' },
  { to: '/bookings', label: 'Reservas', icon: '🎫' },
  { to: '/results', label: 'Resultados', icon: '💪' },
  { to: '/feed', label: 'Feed', icon: '📢' },
  { to: '/profile', label: 'Perfil', icon: '👤' },
]

export function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="min-h-screen pb-16">
      <header className="sticky top-0 z-40 bg-card/80 backdrop-blur border-b border-border">
        <div className="max-w-lg mx-auto flex items-center justify-between px-4 h-14">
          <h1 className="font-bold text-lg">Box Magic</h1>
          <div className="flex items-center gap-2">
            {user?.role === 'admin' && (
              <button onClick={() => navigate('/admin')} className="text-xs text-accent hover:text-accent-hover">
                Admin
              </button>
            )}
            <button onClick={logout} className="text-xs text-muted hover:text-white">
              Salir
            </button>
          </div>
        </div>
      </header>
      <main className="max-w-lg mx-auto px-4 py-4">
        <Outlet />
      </main>
      <nav className="fixed bottom-0 left-0 right-0 bg-card/90 backdrop-blur border-t border-border z-40">
        <div className="max-w-lg mx-auto flex">
          {tabs.map(t => (
            <NavLink
              key={t.to}
              to={t.to}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center py-2 text-xs transition-colors ${isActive ? 'text-accent' : 'text-muted hover:text-white'}`
              }
            >
              <span className="text-lg">{t.icon}</span>
              {t.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
