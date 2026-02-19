import { NavLink, Outlet, useNavigate } from 'react-router-dom'

const tabs = [
  { to: '/admin', label: 'Dashboard', end: true },
  { to: '/admin/users', label: 'Usuarios' },
  { to: '/admin/classes', label: 'Clases' },
  { to: '/admin/schedules', label: 'Horarios' },
  { to: '/admin/routines', label: 'Rutinas' },
  { to: '/admin/plans', label: 'Planes' },
  { to: '/admin/payments', label: 'Pagos' },
  { to: '/admin/discount-codes', label: 'Descuentos' },
  { to: '/admin/challenges', label: 'Challenges' },
  { to: '/admin/leads', label: 'Leads' },
  { to: '/admin/onramp', label: 'On-ramp' },
  { to: '/admin/instructors', label: 'Instructores' },
]

export function AdminLayout() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 bg-card/80 backdrop-blur border-b border-border">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-3">
            <h1 className="font-bold text-lg">Box Magic</h1>
            <span className="text-xs text-muted bg-border px-2 py-0.5 rounded">Admin</span>
          </div>
          <button onClick={() => navigate('/schedule')} className="text-xs text-accent hover:text-accent-hover">
            Volver al app
          </button>
        </div>
        <div className="max-w-6xl mx-auto overflow-x-auto">
          <div className="flex gap-1 px-4 pb-2">
            {tabs.map(t => (
              <NavLink
                key={t.to}
                to={t.to}
                end={t.end}
                className={({ isActive }) =>
                  `px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition-colors ${isActive ? 'bg-accent text-white' : 'text-muted hover:text-white hover:bg-border'}`
                }
              >
                {t.label}
              </NavLink>
            ))}
          </div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-4">
        <Outlet />
      </main>
    </div>
  )
}
