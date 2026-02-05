'use client';

import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

export default function Home() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-20">
        <h1 className="text-4xl font-bold mb-4">Bienvenido a Box Magic</h1>
        <p className="text-zinc-400 text-lg mb-8">
          Tu plataforma para gestionar clases, reservas y más
        </p>
        <div className="flex justify-center gap-4">
          <Link href="/register">
            <Button size="lg">Comenzar</Button>
          </Link>
          <Link href="/login">
            <Button variant="secondary" size="lg">Ingresar</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Hola, {user.name}</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link href="/schedule">
          <Card className="hover:border-blue-500 transition-colors cursor-pointer">
            <h2 className="text-lg font-semibold mb-2">Horarios</h2>
            <p className="text-zinc-400">Ver clases disponibles y reservar</p>
          </Card>
        </Link>

        <Link href="/bookings">
          <Card className="hover:border-blue-500 transition-colors cursor-pointer">
            <h2 className="text-lg font-semibold mb-2">Mis Reservas</h2>
            <p className="text-zinc-400">Ver y gestionar tus reservas</p>
          </Card>
        </Link>

        <Link href="/profile">
          <Card className="hover:border-blue-500 transition-colors cursor-pointer">
            <h2 className="text-lg font-semibold mb-2">Mi Perfil</h2>
            <p className="text-zinc-400">Ver suscripción y datos personales</p>
          </Card>
        </Link>
      </div>
    </div>
  );
}
