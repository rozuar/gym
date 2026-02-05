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

  useEffect(() => {
    loadSchedules();
  }, []);

  const loadSchedules = async () => {
    try {
      const data = await api.getSchedules();
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

  const groupByDate = (items: any[]) => {
    const groups: Record<string, any[]> = {};
    items.forEach((item) => {
      if (!groups[item.date]) groups[item.date] = [];
      groups[item.date].push(item);
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
                    <Card key={schedule.id}>
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-semibold">{schedule.class_name}</h3>
                          <p className="text-sm text-zinc-400">{schedule.discipline_name}</p>
                        </div>
                        <span className="text-sm bg-zinc-700 px-2 py-1 rounded">
                          {schedule.start_time} - {schedule.end_time}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-zinc-400">
                          {schedule.booked} / {schedule.capacity} reservados
                        </span>
                        <span className={`text-sm ${schedule.available > 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {schedule.available} disponibles
                        </span>
                      </div>
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
