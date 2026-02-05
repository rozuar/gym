'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

const DAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

export default function ClassesPage() {
  const [classes, setClasses] = useState<any[]>([]);
  const [disciplines, setDisciplines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    discipline_id: '', name: '', day_of_week: '1', start_time: '07:00', end_time: '08:00', capacity: '20'
  });

  useEffect(() => {
    Promise.all([api.getClasses(), api.getDisciplines()])
      .then(([c, d]) => {
        setClasses(c.classes || []);
        setDisciplines(d.disciplines || []);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createClass({
        discipline_id: parseInt(form.discipline_id),
        name: form.name,
        day_of_week: parseInt(form.day_of_week),
        start_time: form.start_time,
        end_time: form.end_time,
        capacity: parseInt(form.capacity),
      });
      setShowForm(false);
      const data = await api.getClasses();
      setClasses(data.classes || []);
    } catch (err) {
      alert('Error al crear clase');
    }
  };

  const toggleActive = async (cls: any) => {
    try {
      await api.updateClass(cls.id, { active: !cls.active });
      const data = await api.getClasses();
      setClasses(data.classes || []);
    } catch (err) {
      alert('Error');
    }
  };

  if (loading) return <div className="animate-pulse">Cargando...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Clases</h1>
        <Button onClick={() => setShowForm(!showForm)}>{showForm ? 'Cancelar' : 'Nueva Clase'}</Button>
      </div>

      {showForm && (
        <Card className="mb-6">
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Disciplina</label>
              <select
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg"
                value={form.discipline_id}
                onChange={(e) => setForm({ ...form, discipline_id: e.target.value })}
                required
              >
                <option value="">Seleccionar...</option>
                {disciplines.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <Input label="Nombre" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Día</label>
              <select
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg"
                value={form.day_of_week}
                onChange={(e) => setForm({ ...form, day_of_week: e.target.value })}
              >
                {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
              </select>
            </div>
            <Input label="Capacidad" type="number" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} required />
            <Input label="Hora inicio" type="time" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} required />
            <Input label="Hora fin" type="time" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} required />
            <div className="col-span-2"><Button type="submit">Crear Clase</Button></div>
          </form>
        </Card>
      )}

      <Card className="overflow-hidden p-0">
        <table className="w-full">
          <thead className="bg-zinc-800">
            <tr>
              <th className="text-left p-4">Clase</th>
              <th className="text-left p-4">Disciplina</th>
              <th className="text-left p-4">Día</th>
              <th className="text-left p-4">Horario</th>
              <th className="text-left p-4">Capacidad</th>
              <th className="text-left p-4">Estado</th>
              <th className="text-left p-4">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {classes.map((cls) => (
              <tr key={cls.id} className="border-t border-zinc-800">
                <td className="p-4">{cls.name}</td>
                <td className="p-4 text-zinc-400">{cls.discipline_name}</td>
                <td className="p-4">{DAYS[cls.day_of_week]}</td>
                <td className="p-4">{cls.start_time} - {cls.end_time}</td>
                <td className="p-4">{cls.capacity}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-xs ${cls.active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                    {cls.active ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="p-4">
                  <Button size="sm" variant="secondary" onClick={() => toggleActive(cls)}>
                    {cls.active ? 'Desactivar' : 'Activar'}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
