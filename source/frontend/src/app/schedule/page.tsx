'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Schedule } from '@/types';

const DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

export default function SchedulePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [routinesByScheduleId, setRoutinesByScheduleId] = useState<Record<number, { name: string; type?: string; content?: string } | null>>({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [booking, setBooking] = useState<number | null>(null);

  const toYMD = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const loadRoutinesForSchedules = useCallback((scheduleIds: number[]) => {
    scheduleIds.slice(0, 20).forEach((id) => {
      api
        .getScheduleRoutine(id)
        .then((res) => setRoutinesByScheduleId((prev) => ({ ...prev, [id]: res.routine || null })))
        .catch(() => setRoutinesByScheduleId((prev) => ({ ...prev, [id]: null })));
    });
  }, []);

  const loadSchedules = useCallback(async () => {
    try {
      const from = new Date();
      const to = new Date();
      to.setDate(to.getDate() + 14);
      const data = await api.getSchedules(toYMD(from), toYMD(to));
      const list = data.schedules || [];
      setSchedules(list);
      setLoadError('');
      setRoutinesByScheduleId({});
      if (list.length > 0) {
        loadRoutinesForSchedules(list.map((s: Schedule) => s.id));
      }
    } catch (err) {
      console.error(err);
      setLoadError('No se pudieron cargar los horarios. ¿Está el backend en marcha?');
    } finally {
      setLoading(false);
    }
  }, [loadRoutinesForSchedules]);

  useEffect(() => {
    loadSchedules();
  }, [loadSchedules]);

  const handleBook = async (scheduleId: number) => {
    if (!user) {
      router.push('/login');
      return;
    }
    setBooking(scheduleId);
    try {
      await api.createBooking(scheduleId);
      await loadSchedules();
      alert('Reserva realizada');
    } catch (err: any) {
      alert(err.message || 'Error al reservar');
    } finally {
      setBooking(null);
    }
  };

  const groupByDate = (items: Schedule[]) => {
    const groups: Record<string, Schedule[]> = {};
    items.forEach((item) => {
      if (!groups[item.date]) groups[item.date] = [];
      groups[item.date].push(item);
    });
    return groups;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  const grouped = groupByDate(schedules);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Horarios</h1>

      {loadError ? (
        <Card>
          <p className="text-red-400 text-center">{loadError}</p>
          <p className="text-zinc-500 text-center text-sm mt-2">Backend: {process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1'}</p>
        </Card>
      ) : Object.keys(grouped).length === 0 ? (
        <Card>
          <p className="text-zinc-400 text-center">No hay clases programadas</p>
          <p className="text-zinc-500 text-center text-sm mt-2">Crea datos de prueba desde la página de login (modo dev)</p>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([date, items]) => {
            const d = new Date(date.slice(0, 10) + 'T12:00:00');
            const dayName = DAYS[d.getDay()];
            const formatted = d.toLocaleDateString('es-CL', { day: 'numeric', month: 'short' });

            return (
              <div key={date}>
                <h2 className="text-lg font-semibold mb-3">
                  {dayName} {formatted}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {items.map((schedule) => {
                    const routine = routinesByScheduleId[schedule.id];
                    return (
                      <Card key={schedule.id} className="flex flex-col">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="font-semibold">{schedule.class_name}</h3>
                            <p className="text-sm text-zinc-400">{schedule.discipline_name}</p>
                          </div>
                          <span className="text-sm bg-zinc-700 px-2 py-1 rounded">
                            {schedule.start_time} - {schedule.end_time}
                          </span>
                        </div>
                        {routine && (
                          <div className="mb-3 p-2 bg-zinc-800/50 rounded text-sm">
                            <p className="font-medium text-zinc-300">WOD: {routine.name}</p>
                            {routine.content && <p className="text-zinc-400 mt-0.5">{routine.content}</p>}
                          </div>
                        )}
                        <div className="flex justify-between items-center mt-auto pt-4">
                          <span className="text-sm text-zinc-400">
                            {schedule.available} / {schedule.capacity} disponibles
                          </span>
                          <Button
                            size="sm"
                            disabled={schedule.available === 0 || booking === schedule.id}
                            loading={booking === schedule.id}
                            onClick={() => handleBook(schedule.id)}
                          >
                            {schedule.available === 0 ? 'Lleno' : user ? 'Reservar' : 'Ingresar para reservar'}
                          </Button>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
