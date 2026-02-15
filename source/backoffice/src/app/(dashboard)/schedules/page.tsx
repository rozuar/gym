'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

const DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

export default function SchedulesPage() {
  const [schedules, setSchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [attendanceForId, setAttendanceForId] = useState<number | null>(null);
  const [attendanceData, setAttendanceData] = useState<{ schedule: any; bookings: any[] } | null>(null);
  const [checkingIn, setCheckingIn] = useState<number | null>(null);
  const [cancellingSchedule, setCancellingSchedule] = useState<number | null>(null);

  useEffect(() => {
    loadSchedules();
  }, []);

  const loadSchedules = async () => {
    try {
      const from = new Date();
      const to = new Date();
      to.setDate(to.getDate() + 14);
      const fromStr = from.toISOString().slice(0, 10);
      const toStr = to.toISOString().slice(0, 10);
      const data = await api.getSchedules(fromStr, toStr, true);
      setSchedules(data.schedules || []);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      await api.generateSchedules();
      await loadSchedules();
      alert('Horarios generados');
    } catch (err) {
      alert('Error al generar horarios');
    } finally {
      setGenerating(false);
    }
  };

  const openAttendance = async (scheduleId: number) => {
    if (attendanceForId === scheduleId) {
      setAttendanceForId(null);
      setAttendanceData(null);
      return;
    }
    setAttendanceForId(scheduleId);
    try {
      const data = await api.getScheduleAttendance(scheduleId);
      setAttendanceData({ schedule: data.schedule, bookings: data.bookings || [] });
    } catch (err) {
      alert('Error al cargar asistencia');
      setAttendanceForId(null);
    }
  };

  const handleCancelSchedule = async (scheduleId: number, booked: number) => {
    const msg = booked > 0
      ? `¿Cancelar esta clase? Se cancelarán ${booked} reserva(s) y se devolverán créditos.`
      : '¿Cancelar esta clase?';
    if (!confirm(msg)) return;

    setCancellingSchedule(scheduleId);
    try {
      const result = await api.cancelSchedule(scheduleId);
      alert(`Clase cancelada. ${result.cancelled_bookings} reserva(s) cancelada(s).`);
      await loadSchedules();
    } catch (err: any) {
      alert(err.message || 'Error al cancelar clase');
    } finally {
      setCancellingSchedule(null);
    }
  };

  const handleCheckIn = async (bookingId: number) => {
    setCheckingIn(bookingId);
    try {
      await api.checkIn(bookingId);
      if (attendanceForId != null) {
        const data = await api.getScheduleAttendance(attendanceForId);
        setAttendanceData({ schedule: data.schedule, bookings: data.bookings || [] });
      }
    } catch (err) {
      alert('Error al hacer check-in');
    } finally {
      setCheckingIn(null);
    }
  };

  const groupByDate = (items: any[]) => {
    const groups: Record<string, any[]> = {};
    items.forEach((item) => {
      const dateKey = item.date?.slice(0, 10) || item.date;
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(item);
    });
    return groups;
  };

  if (loading) return <div className="animate-pulse">Cargando...</div>;

  const grouped = groupByDate(schedules);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Horarios</h1>
        <Button onClick={handleGenerate} loading={generating}>
          Generar Semana
        </Button>
      </div>

      {Object.keys(grouped).length === 0 ? (
        <Card><p className="text-zinc-400 text-center">No hay horarios. Genera la semana.</p></Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([date, items]) => {
            const d = new Date(date + 'T12:00:00');
            const dayName = DAYS[d.getDay()];
            const formatted = d.toLocaleDateString('es-CL', { day: 'numeric', month: 'short' });

            return (
              <div key={date}>
                <h2 className="text-lg font-semibold mb-3">{dayName} {formatted}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {items.map((schedule: any) => (
                    <Card key={schedule.id} className={schedule.cancelled ? 'opacity-60' : ''}>
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{schedule.class_name}</h3>
                            {schedule.cancelled && (
                              <span className="text-xs px-2 py-0.5 rounded bg-red-500/20 text-red-400">Cancelada</span>
                            )}
                          </div>
                          <p className="text-sm text-zinc-400">{schedule.discipline_name}</p>
                        </div>
                        <span className="text-sm bg-zinc-700 px-2 py-1 rounded">
                          {schedule.start_time} - {schedule.end_time}
                        </span>
                      </div>
                      <div className="flex justify-between items-center flex-wrap gap-2">
                        <span className="text-sm text-zinc-400">
                          {schedule.booked} / {schedule.capacity} reservados
                        </span>
                        <span className={`text-sm ${schedule.available > 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {schedule.available} disponibles
                        </span>
                        <div className="flex gap-2">
                          {!schedule.cancelled && (
                            <>
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => openAttendance(schedule.id)}
                              >
                                {attendanceForId === schedule.id ? 'Cerrar' : 'Asistencia'}
                              </Button>
                              <Button
                                size="sm"
                                variant="danger"
                                loading={cancellingSchedule === schedule.id}
                                onClick={() => handleCancelSchedule(schedule.id, schedule.booked)}
                              >
                                Cancelar clase
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                      {attendanceForId === schedule.id && attendanceData && (
                        <div className="mt-3 pt-3 border-t border-zinc-700">
                          <p className="text-xs text-zinc-500 mb-2">Reservas:</p>
                          {attendanceData.bookings.length === 0 ? (
                            <p className="text-sm text-zinc-500">Sin reservas</p>
                          ) : (
                            <ul className="space-y-2">
                              {attendanceData.bookings.map((b: any) => (
                                <li key={b.id} className="flex justify-between items-center text-sm gap-2">
                                  <div className="flex items-center gap-2 min-w-0">
                                    {b.before_photo_url ? (
                                      <img src={b.before_photo_url} alt="" className="w-8 h-8 rounded object-cover shrink-0" title="Foto antes de clase" />
                                    ) : null}
                                    <span className="text-zinc-400 truncate">{b.user_name || b.user_id}</span>
                                  </div>
                                  <div className="flex items-center gap-2 shrink-0">
                                    {b.before_photo_url && <span className="text-xs text-amber-400" title="Costo adicional">📷</span>}
                                    <span className={`text-xs px-2 py-0.5 rounded ${b.status === 'attended' ? 'bg-green-500/20 text-green-400' : 'bg-zinc-700'}`}>
                                      {b.status === 'attended' ? 'Asistió' : b.status}
                                    </span>
                                    {b.status === 'booked' && (
                                      <Button
                                        size="sm"
                                        loading={checkingIn === b.id}
                                        onClick={() => handleCheckIn(b.id)}
                                      >
                                        Check-in
                                      </Button>
                                    )}
                                  </div>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
