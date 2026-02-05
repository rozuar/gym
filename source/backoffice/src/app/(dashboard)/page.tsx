'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/Card';

interface DashboardStats {
  total_users: number;
  active_users: number;
  inactive_users: number;
  new_users_month: number;
  total_revenue: number;
  revenue_month: number;
  active_subscriptions: number;
  classes_today: number;
  bookings_today: number;
  attendance_today: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getDashboard()
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 }).format(amount);
  };

  if (loading) {
    return <div className="animate-pulse">Cargando...</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <p className="text-zinc-500 text-sm">Usuarios Totales</p>
          <p className="text-3xl font-bold">{stats?.total_users || 0}</p>
        </Card>
        <Card>
          <p className="text-zinc-500 text-sm">Usuarios Activos</p>
          <p className="text-3xl font-bold text-green-500">{stats?.active_users || 0}</p>
        </Card>
        <Card>
          <p className="text-zinc-500 text-sm">Nuevos este mes</p>
          <p className="text-3xl font-bold text-blue-500">{stats?.new_users_month || 0}</p>
        </Card>
        <Card>
          <p className="text-zinc-500 text-sm">Suscripciones Activas</p>
          <p className="text-3xl font-bold">{stats?.active_subscriptions || 0}</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <Card>
          <p className="text-zinc-500 text-sm">Ingresos Totales</p>
          <p className="text-2xl font-bold">{formatCurrency(stats?.total_revenue || 0)}</p>
        </Card>
        <Card>
          <p className="text-zinc-500 text-sm">Ingresos este mes</p>
          <p className="text-2xl font-bold text-green-500">{formatCurrency(stats?.revenue_month || 0)}</p>
        </Card>
        <Card>
          <p className="text-zinc-500 text-sm">Usuarios Inactivos</p>
          <p className="text-2xl font-bold text-yellow-500">{stats?.inactive_users || 0}</p>
        </Card>
      </div>

      <h2 className="text-xl font-semibold mb-4">Hoy</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <p className="text-zinc-500 text-sm">Clases Programadas</p>
          <p className="text-2xl font-bold">{stats?.classes_today || 0}</p>
        </Card>
        <Card>
          <p className="text-zinc-500 text-sm">Reservas</p>
          <p className="text-2xl font-bold">{stats?.bookings_today || 0}</p>
        </Card>
        <Card>
          <p className="text-zinc-500 text-sm">Asistencias</p>
          <p className="text-2xl font-bold text-green-500">{stats?.attendance_today || 0}</p>
        </Card>
      </div>
    </div>
  );
}
