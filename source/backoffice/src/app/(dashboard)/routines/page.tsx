'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function RoutinesPage() {
  const [routines, setRoutines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', type: 'wod', content: '', duration: '', difficulty: 'intermediate' });

  useEffect(() => {
    loadRoutines();
  }, []);

  const loadRoutines = async () => {
    try {
      const data = await api.getRoutines();
      setRoutines(data.routines || []);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createRoutine({
        name: form.name,
        type: form.type,
        content: form.content,
        duration: form.duration ? parseInt(form.duration) : 0,
        difficulty: form.difficulty,
      });
      setShowForm(false);
      setForm({ name: '', type: 'wod', content: '', duration: '', difficulty: 'intermediate' });
      loadRoutines();
    } catch (err) {
      alert('Error al crear rutina');
    }
  };

  if (loading) return <div className="animate-pulse">Cargando...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Rutinas</h1>
        <Button onClick={() => setShowForm(!showForm)}>{showForm ? 'Cancelar' : 'Nueva Rutina'}</Button>
      </div>

      {showForm && (
        <Card className="mb-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input label="Nombre" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Tipo</label>
                <select className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                  <option value="wod">WOD</option>
                  <option value="strength">Fuerza</option>
                  <option value="skill">Skill</option>
                  <option value="cardio">Cardio</option>
                </select>
              </div>
              <Input label="Duración (min)" type="number" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} />
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Dificultad</label>
                <select className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg" value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value })}>
                  <option value="beginner">Principiante</option>
                  <option value="intermediate">Intermedio</option>
                  <option value="advanced">Avanzado</option>
                  <option value="rx">Rx</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Contenido</label>
              <textarea
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg min-h-[150px]"
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                placeholder="Describe la rutina..."
                required
              />
            </div>
            <Button type="submit">Crear Rutina</Button>
          </form>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {routines.map((routine) => (
          <Card key={routine.id}>
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-semibold">{routine.name}</h3>
              <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded">{routine.type}</span>
            </div>
            <pre className="text-sm text-zinc-400 whitespace-pre-wrap mb-2">{routine.content}</pre>
            <div className="flex gap-2 text-xs text-zinc-500">
              {routine.duration > 0 && <span>{routine.duration} min</span>}
              <span>{routine.difficulty}</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
