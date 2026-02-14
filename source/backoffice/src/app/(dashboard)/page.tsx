'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

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
  const [exporting, setExporting] = useState<'users' | 'revenue' | null>(null);
  const [attendanceStats, setAttendanceStats] = useState<any>(null);
  const [revenueStats, setRevenueStats] = useState<any>(null);

  useEffect(() => {
    api.getDashboard()
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const loadExtraStats = async () => {
    try {
      const from = new Date();
      from.setDate(from.getDate() - 30);
      const to = new Date();
      const fromStr = from.toISOString().slice(0, 10);
      const toStr = to.toISOString().slice(0, 10);
      const [att, rev] = await Promise.all([
        api.getAttendanceStats(fromStr, toStr),
        api.getRevenueStats('monthly'),
      ]);
      setAttendanceStats(att);
      setRevenueStats(rev);
    } catch (e) {
      console.error(e);
    }
  };

  const handleExportUsers = async () => {
    setExporting('users');
    try {
      await api.exportUsers();
    } catch (e) {
      alert('Error al exportar usuarios');
    } finally {
      setExporting(null);
    }
  };

  const handleExportRevenue = async () => {
    setExporting('revenue');
    try {
      await api.exportRevenue();
    } catch (e) {
      alert('Error al exportar ingresos');
    } finally {
      setExporting(null);
    }
  };

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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
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

      <h2 className="text-xl font-semibold mb-4">Exportar</h2>
      <div className="flex gap-2 mb-8">
        <Button onClick={handleExportUsers} loading={exporting === 'users'} variant="secondary">
          Exportar usuarios (CSV)
        </Button>
        <Button onClick={handleExportRevenue} loading={exporting === 'revenue'} variant="secondary">
          Exportar ingresos (CSV)
        </Button>
      </div>

      <h2 className="text-xl font-semibold mb-4">Estadísticas adicionales</h2>
      <Button variant="secondary" className="mb-4" onClick={loadExtraStats}>
        Cargar asistencia e ingresos (últimos 30 días)
      </Button>
      {attendanceStats?.stats?.length > 0 && (
        <Card className="mb-4 overflow-hidden p-0">
          <p className="text-zinc-500 text-sm p-4 pb-2">Asistencia por día</p>
          <table className="w-full text-sm">
            <thead className="bg-zinc-800">
              <tr>
                <th className="text-left p-3">Fecha</th>
                <th className="text-right p-3">Cupos</th>
                <th className="text-right p-3">Reservas</th>
                <th className="text-right p-3">Asistencia</th>
                <th className="text-right p-3">No show</th>
                <th className="text-right p-3">Tasa</th>
              </tr>
            </thead>
            <tbody>
              {attendanceStats.stats.map((s: any) => (
                <tr key={s.date} className="border-t border-zinc-800">
                  <td className="p-3">{new Date(s.date.slice(0, 10) + 'T12:00:00').toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })}</td>
                  <td className="p-3 text-right">{s.total_slots}</td>
                  <td className="p-3 text-right">{s.booked}</td>
                  <td className="p-3 text-right text-green-400">{s.attended}</td>
                  <td className="p-3 text-right text-red-400">{s.no_show}</td>
                  <td className="p-3 text-right">{(s.rate * 100).toFixed(0)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
      {revenueStats?.stats?.length > 0 && (
        <Card className="overflow-hidden p-0">
          <p className="text-zinc-500 text-sm p-4 pb-2">Ingresos por mes</p>
          <table className="w-full text-sm">
            <thead className="bg-zinc-800">
              <tr>
                <th className="text-left p-3">Período</th>
                <th className="text-right p-3">Pagos</th>
                <th className="text-right p-3">Monto</th>
              </tr>
            </thead>
            <tbody>
              {revenueStats.stats.map((s: any) => (
                <tr key={s.period} className="border-t border-zinc-800">
                  <td className="p-3">{s.period}</td>
                  <td className="p-3 text-right">{s.count}</td>
                  <td className="p-3 text-right font-semibold">{formatCurrency(s.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
