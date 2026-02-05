'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

const menuItems = [
  { href: '/', label: 'Dashboard', icon: '📊' },
  { href: '/users', label: 'Usuarios', icon: '👥' },
  { href: '/plans', label: 'Planes', icon: '💳' },
  { href: '/classes', label: 'Clases', icon: '🏋️' },
  { href: '/schedules', label: 'Horarios', icon: '📅' },
  { href: '/routines', label: 'Rutinas', icon: '📝' },
  { href: '/payments', label: 'Pagos', icon: '💰' },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <aside className="w-64 bg-zinc-900 border-r border-zinc-800 min-h-screen flex flex-col">
      <div className="p-4 border-b border-zinc-800">
        <h1 className="text-xl font-bold">Box Magic</h1>
        <p className="text-sm text-zinc-500">Admin</p>
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
                  }`}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-zinc-800">
        <div className="text-sm text-zinc-400 mb-2">{user?.name}</div>
        <button
          onClick={logout}
          className="text-sm text-zinc-500 hover:text-white"
        >
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
