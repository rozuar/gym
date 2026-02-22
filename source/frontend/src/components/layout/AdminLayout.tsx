import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Users, Dumbbell, Calendar, ClipboardList,
  CreditCard, DollarSign, Tag, Trophy, UserPlus, Rocket,
  Star, Activity, ShoppingCart, GraduationCap,
  ChevronLeft, ChevronRight, Menu, X, Zap
} from 'lucide-react'

const navItems = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/users', label: 'Usuarios', icon: Users },
  { to: '/admin/classes', label: 'Clases', icon: Dumbbell },
  { to: '/admin/schedules', label: 'Horarios', icon: Calendar },
  { to: '/admin/routines', label: 'Rutinas', icon: ClipboardList },
  { to: '/admin/plans', label: 'Planes', icon: CreditCard },
  { to: '/admin/payments', label: 'Pagos', icon: DollarSign },
  { to: '/admin/discount-codes', label: 'Descuentos', icon: Tag },
  { to: '/admin/challenges', label: 'Challenges', icon: Trophy },
  { to: '/admin/leads', label: 'Leads', icon: UserPlus },
  { to: '/admin/onramp', label: 'On-ramp', icon: Rocket },
  { to: '/admin/events', label: 'Eventos', icon: Star },
  { to: '/admin/movements', label: 'Movimientos', icon: Activity },
  { to: '/admin/pos', label: 'POS', icon: ShoppingCart },
  { to: '/admin/instructors', label: 'Instructores', icon: GraduationCap },
]

export function AdminLayout() {
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={`flex items-center gap-3 px-4 h-16 border-b border-accent/10 shrink-0 ${collapsed ? 'justify-center' : ''}`}>
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-accent to-accent-2 flex items-center justify-center shrink-0">
          <Zap size={16} className="text-white" />
        </div>
        {!collapsed && (
          <div>
            <span className="font-bold text-white text-sm">Box Magic</span>
            <span className="block text-[10px] text-muted leading-none">Admin Panel</span>
          </div>
        )}
      </div>

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150 group relative ${
                isActive
                  ? 'bg-accent/15 text-accent border border-accent/20 shadow-sm shadow-accent/10'
                  : 'text-muted hover:text-white hover:bg-white/5'
              } ${collapsed ? 'justify-center' : ''}`
            }
            title={collapsed ? label : undefined}
          >
            {({ isActive }) => (
              <>
                <Icon size={18} className={`shrink-0 ${isActive ? 'text-accent' : ''}`} />
                {!collapsed && <span>{label}</span>}
                {collapsed && (
                  <div className="absolute left-full ml-2 px-2.5 py-1 bg-card border border-accent/20 rounded-lg text-xs text-white whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 shadow-xl">
                    {label}
                  </div>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="shrink-0 px-2 pb-3 border-t border-accent/10 pt-3">
        <button
          onClick={() => navigate('/schedule')}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-muted hover:text-white hover:bg-white/5 transition-all ${collapsed ? 'justify-center' : ''}`}
          title={collapsed ? 'Ir a App' : undefined}
        >
          <ChevronLeft size={18} className="shrink-0" />
          {!collapsed && <span>Volver al app</span>}
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen flex">
      {/* Desktop sidebar */}
      <aside
        className={`hidden lg:flex flex-col fixed top-0 left-0 h-full z-30 bg-surface/80 backdrop-blur-xl border-r border-accent/10 transition-all duration-300 ${
          collapsed ? 'w-16' : 'w-60'
        }`}
      >
        <SidebarContent />
        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-card border border-accent/20 flex items-center justify-center text-muted hover:text-white hover:border-accent/40 transition-colors shadow-lg"
        >
          {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>
      </aside>

      {/* Mobile drawer overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={`lg:hidden fixed top-0 left-0 h-full z-50 w-60 bg-surface/95 backdrop-blur-xl border-r border-accent/10 transition-transform duration-300 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-muted hover:text-white hover:bg-white/10 transition-colors"
        >
          <X size={16} />
        </button>
        <SidebarContent />
      </aside>

      {/* Main content */}
      <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${collapsed ? 'lg:ml-16' : 'lg:ml-60'}`}>
        {/* Top bar (mobile) */}
        <header className="lg:hidden sticky top-0 z-20 bg-surface/80 backdrop-blur-xl border-b border-accent/10 h-14 flex items-center px-4 gap-3">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-lg text-muted hover:text-white hover:bg-white/10 transition-colors"
          >
            <Menu size={18} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-accent to-accent-2 flex items-center justify-center">
              <Zap size={12} className="text-white" />
            </div>
            <span className="font-bold text-sm">Box Magic Admin</span>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 max-w-7xl w-full mx-auto animate-fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
