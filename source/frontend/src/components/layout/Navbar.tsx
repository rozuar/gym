'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

export function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="bg-zinc-900 border-b border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold text-white">
              Box Magic
            </Link>
            {user && (
              <div className="ml-10 flex items-center space-x-4">
                <Link href="/schedule" className="text-zinc-300 hover:text-white px-3 py-2">
                  Horarios
                </Link>
                <Link href="/bookings" className="text-zinc-300 hover:text-white px-3 py-2">
                  Mis Reservas
                </Link>
                <Link href="/results" className="text-zinc-300 hover:text-white px-3 py-2">
                  Mis Resultados
                </Link>
                <Link href="/plans" className="text-zinc-300 hover:text-white px-3 py-2">
                  Planes
                </Link>
              </div>
            )}
          </div>
          <div className="flex items-center">
            {user ? (
              <div className="flex items-center space-x-4">
                <Link href="/profile" className="text-zinc-300 hover:text-white">
                  {user.name}
                </Link>
                <button
                  onClick={logout}
                  className="bg-zinc-700 text-white px-4 py-2 rounded hover:bg-zinc-600"
                >
                  Salir
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link href="/login" className="text-zinc-300 hover:text-white">
                  Ingresar
                </Link>
                <Link
                  href="/register"
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  Registrarse
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
