'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

const emptyForm = { name: '', type: 'wod', content: '', duration: '', difficulty: 'intermediate' };

export default function RoutinesPage() {
  const [routines, setRoutines] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [assignModal, setAssignModal] = useState<{ routineId: number; routineName: string } | null>(null);
  const [assignScheduleId, setAssignScheduleId] = useState('');
  const [assignNotes, setAssignNotes] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

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

  const loadSchedules = async () => {
    const from = new Date();
    const to = new Date();
    to.setDate(to.getDate() + 14);
    const data = await api.getSchedules(from.toISOString().slice(0, 10), to.toISOString().slice(0, 10));
    setSchedules(data.schedules || []);
  };

  const openEdit = (routine: any) => {
    setEditingId(routine.id);
    setForm({
      name: routine.name,
      type: routine.type,
      content: routine.content || '',
      duration: routine.duration ? String(routine.duration) : '',
      difficulty: routine.difficulty || 'intermediate',
    });
  };

  const handleCreate = async (e: React.FormEvent) => {
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
      setForm(emptyForm);
      loadRoutines();
    } catch (err) {
      alert('Error al crear rutina');
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    try {
      await api.updateRoutine(editingId, {
        name: form.name,
        type: form.type,
        content: form.content,
        duration: form.duration ? parseInt(form.duration) : 0,
        difficulty: form.difficulty,
      });
      setEditingId(null);
      setForm(emptyForm);
      loadRoutines();
    } catch (err) {
      alert('Error al actualizar rutina');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Eliminar esta rutina?')) return;
    setDeletingId(id);
    try {
      await api.deleteRoutine(id);
      loadRoutines();
      if (editingId === id) setEditingId(null);
    } catch (err) {
      alert('Error al eliminar');
    } finally {
      setDeletingId(null);
    }
  };

  const openAssign = (routine: any) => {
    setAssignModal({ routineId: routine.id, routineName: routine.name });
    setAssignScheduleId('');
    setAssignNotes('');
    loadSchedules();
  };

  const handleAssign = async () => {
    if (!assignModal || !assignScheduleId) return;
    setAssigning(true);
    try {
      await api.assignRoutine(parseInt(assignScheduleId), assignModal.routineId, assignNotes || undefined);
      setAssignModal(null);
    } catch (err) {
      alert('Error al asignar rutina');
    } finally {
      setAssigning(false);
    }
  };

  if (loading) return <div className="animate-pulse">Cargando...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Rutinas</h1>
        <Button onClick={() => { setShowForm(!showForm); setEditingId(null); }}>{showForm ? 'Cancelar' : 'Nueva Rutina'}</Button>
      </div>

      {showForm && !editingId && (
        <Card className="mb-6">
          <form onSubmit={handleCreate} className="space-y-4">
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

      {(editingId !== null) && (
        <Card className="mb-6">
          <h3 className="font-semibold mb-4">Editar rutina</h3>
          <form onSubmit={handleUpdate} className="space-y-4">
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
            <div className="flex gap-2">
              <Button type="submit">Guardar</Button>
              <Button type="button" variant="secondary" onClick={() => { setEditingId(null); setForm(emptyForm); }}>Cancelar</Button>
            </div>
          </form>
        </Card>
      )}

      {assignModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={() => setAssignModal(null)}>
          <div className="bg-zinc-800 rounded-lg p-6 max-w-md w-full shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-semibold mb-4">Asignar &quot;{assignModal.routineName}&quot; a horario</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Horario</label>
                <select
                  className="w-full px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-lg"
                  value={assignScheduleId}
                  onChange={(e) => setAssignScheduleId(e.target.value)}
                  required
                >
                  <option value="">Seleccionar...</option>
                  {schedules.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.date?.slice(0, 10)} {s.start_time} - {s.class_name}
                    </option>
                  ))}
                </select>
              </div>
              <Input label="Notas (opcional)" value={assignNotes} onChange={(e) => setAssignNotes(e.target.value)} />
            </div>
            <div className="flex gap-2 mt-4">
              <Button onClick={handleAssign} loading={assigning} disabled={!assignScheduleId}>Asignar</Button>
              <Button variant="secondary" onClick={() => setAssignModal(null)}>Cancelar</Button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {routines.map((routine) => (
          <Card key={routine.id}>
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-semibold">{routine.name}</h3>
              <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded">{routine.type}</span>
            </div>
            <pre className="text-sm text-zinc-400 whitespace-pre-wrap mb-2">{routine.content}</pre>
            <div className="flex gap-2 text-xs text-zinc-500 mb-3">
              {routine.duration > 0 && <span>{routine.duration} min</span>}
              <span>{routine.difficulty}</span>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button size="sm" variant="secondary" onClick={() => openEdit(routine)}>Editar</Button>
              <Button size="sm" variant="secondary" onClick={() => openAssign(routine)}>Asignar a horario</Button>
              <Button size="sm" variant="danger" onClick={() => handleDelete(routine.id)} loading={deletingId === routine.id}>Eliminar</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
