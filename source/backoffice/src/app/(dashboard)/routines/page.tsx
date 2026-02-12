'use client';

import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

const TABS = ['Biblioteca', 'Asignar a Horario', 'Personalizadas'] as const;
type Tab = (typeof TABS)[number];

const TYPE_LABELS: Record<string, string> = { wod: 'WOD', strength: 'Fuerza', skill: 'Skill', cardio: 'Cardio' };
const DIFFICULTY_LABELS: Record<string, string> = { beginner: 'Principiante', intermediate: 'Intermedio', advanced: 'Avanzado', rx: 'Rx' };

const emptyForm = { name: '', type: 'wod', content: '', duration: '', difficulty: 'intermediate', description: '', instructor_id: '' };
const emptyCustomForm = { ...emptyForm, target_user_id: '', billable: false };

export default function RoutinesPage() {
  const [tab, setTab] = useState<Tab>('Biblioteca');

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Rutinas</h1>
      <div className="flex gap-1 mb-6 bg-zinc-800 rounded-lg p-1">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              tab === t ? 'bg-blue-600 text-white' : 'text-zinc-400 hover:text-white hover:bg-zinc-700'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'Biblioteca' && <BibliotecaTab />}
      {tab === 'Asignar a Horario' && <AsignarTab />}
      {tab === 'Personalizadas' && <PersonalizadasTab />}
    </div>
  );
}

/* ─── BIBLIOTECA TAB ─── */
function BibliotecaTab() {
  const [routines, setRoutines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [filterType, setFilterType] = useState('');
  const [instructors, setInstructors] = useState<any[]>([]);

  const load = useCallback(async () => {
    try {
      const params: { type?: string; custom?: boolean } = { custom: false };
      if (filterType) params.type = filterType;
      const data = await api.getRoutines(params);
      setRoutines(data.routines || []);
    } finally {
      setLoading(false);
    }
  }, [filterType]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    api.getInstructors().then((d: any) => setInstructors(d.instructors || d || [])).catch(() => {});
  }, []);

  const openEdit = (r: any) => {
    setEditingId(r.id);
    setForm({
      name: r.name,
      type: r.type,
      content: r.content || '',
      duration: r.duration ? String(r.duration) : '',
      difficulty: r.difficulty || 'intermediate',
      description: r.description || '',
      instructor_id: r.instructor_id ? String(r.instructor_id) : '',
    });
    setShowForm(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: form.name,
      type: form.type,
      content: form.content,
      duration: form.duration ? parseInt(form.duration) : 0,
      difficulty: form.difficulty,
      description: form.description,
      instructor_id: form.instructor_id ? parseInt(form.instructor_id) : undefined,
    };
    try {
      if (editingId) {
        await api.updateRoutine(editingId, payload);
        setEditingId(null);
      } else {
        await api.createRoutine(payload);
        setShowForm(false);
      }
      setForm(emptyForm);
      load();
    } catch {
      alert(editingId ? 'Error al actualizar rutina' : 'Error al crear rutina');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Eliminar esta rutina?')) return;
    setDeletingId(id);
    try {
      await api.deleteRoutine(id);
      load();
      if (editingId === id) setEditingId(null);
    } catch {
      alert('Error al eliminar');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) return <div className="animate-pulse">Cargando...</div>;

  const formUI = (
    <Card className="mb-6">
      <h3 className="font-semibold mb-4">{editingId ? 'Editar rutina' : 'Nueva rutina'}</h3>
      <form onSubmit={handleSave} className="space-y-4">
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
          <div>
            <label className="block text-sm text-zinc-400 mb-1">Instructor</label>
            <select className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg" value={form.instructor_id} onChange={(e) => setForm({ ...form, instructor_id: e.target.value })}>
              <option value="">Sin asignar</option>
              {instructors.map((i: any) => (
                <option key={i.id} value={i.id}>{i.name}</option>
              ))}
            </select>
          </div>
        </div>
        <Input label="Descripción" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
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
          <Button type="submit">{editingId ? 'Guardar' : 'Crear Rutina'}</Button>
          <Button type="button" variant="secondary" onClick={() => { setShowForm(false); setEditingId(null); setForm(emptyForm); }}>Cancelar</Button>
        </div>
      </form>
    </Card>
  );

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-2">
          <select
            className="px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="">Todos los tipos</option>
            <option value="wod">WOD</option>
            <option value="strength">Fuerza</option>
            <option value="skill">Skill</option>
            <option value="cardio">Cardio</option>
          </select>
        </div>
        {!showForm && !editingId && (
          <Button onClick={() => setShowForm(true)}>Nueva Rutina</Button>
        )}
      </div>

      {(showForm || editingId) && formUI}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {routines.map((routine) => (
          <Card key={routine.id}>
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-semibold">{routine.name}</h3>
              <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded">{TYPE_LABELS[routine.type] || routine.type}</span>
            </div>
            {routine.description && <p className="text-sm text-zinc-400 mb-2">{routine.description}</p>}
            <pre className="text-sm text-zinc-400 whitespace-pre-wrap mb-2 max-h-32 overflow-y-auto">{routine.content}</pre>
            <div className="flex gap-2 text-xs text-zinc-500 mb-3">
              {routine.duration > 0 && <span>{routine.duration} min</span>}
              {routine.difficulty && <span>{DIFFICULTY_LABELS[routine.difficulty] || routine.difficulty}</span>}
              {routine.instructor_name && <span>Instructor: {routine.instructor_name}</span>}
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button size="sm" variant="secondary" onClick={() => openEdit(routine)}>Editar</Button>
              <Button size="sm" variant="danger" onClick={() => handleDelete(routine.id)} loading={deletingId === routine.id}>Eliminar</Button>
            </div>
          </Card>
        ))}
        {routines.length === 0 && <p className="text-zinc-500 col-span-2">No hay rutinas en la biblioteca.</p>}
      </div>
    </>
  );
}

/* ─── ASIGNAR A HORARIO TAB ─── */
function AsignarTab() {
  const [schedules, setSchedules] = useState<any[]>([]);
  const [routines, setRoutines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [assignedRoutines, setAssignedRoutines] = useState<Record<number, any>>({});
  const [assigningId, setAssigningId] = useState<number | null>(null);
  const [selectedRoutineId, setSelectedRoutineId] = useState('');
  const [assignNotes, setAssignNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const from = new Date();
      const to = new Date();
      to.setDate(to.getDate() + 14);
      const [schedData, routineData] = await Promise.all([
        api.getSchedules(from.toISOString().slice(0, 10), to.toISOString().slice(0, 10)),
        api.getRoutines({ custom: false }),
      ]);
      const scheds = schedData.schedules || [];
      setSchedules(scheds);
      setRoutines(routineData.routines || []);

      // Load assigned routines for each schedule
      const assigned: Record<number, any> = {};
      await Promise.all(
        scheds.map(async (s: any) => {
          try {
            const data = await api.getScheduleRoutine(s.id);
            if (data.routine) assigned[s.id] = data.routine;
          } catch {
            // No routine assigned
          }
        })
      );
      setAssignedRoutines(assigned);
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async (scheduleId: number) => {
    if (!selectedRoutineId) return;
    setSaving(true);
    try {
      await api.assignRoutine(scheduleId, parseInt(selectedRoutineId), assignNotes || undefined);
      const data = await api.getScheduleRoutine(scheduleId);
      if (data.routine) {
        setAssignedRoutines((prev) => ({ ...prev, [scheduleId]: data.routine }));
      }
      setAssigningId(null);
      setSelectedRoutineId('');
      setAssignNotes('');
    } catch {
      alert('Error al asignar rutina');
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (scheduleId: number) => {
    if (!confirm('¿Quitar la rutina asignada?')) return;
    try {
      await api.removeScheduleRoutine(scheduleId);
      setAssignedRoutines((prev) => {
        const next = { ...prev };
        delete next[scheduleId];
        return next;
      });
    } catch {
      alert('Error al quitar rutina');
    }
  };

  if (loading) return <div className="animate-pulse">Cargando horarios...</div>;

  // Group schedules by date
  const grouped: Record<string, any[]> = {};
  schedules.forEach((s) => {
    const date = s.date?.slice(0, 10) || 'Sin fecha';
    if (!grouped[date]) grouped[date] = [];
    grouped[date].push(s);
  });

  const DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  return (
    <>
      {Object.entries(grouped).map(([date, scheds]) => {
        const d = new Date(date + 'T12:00:00');
        const dayName = DAYS[d.getDay()];
        return (
          <div key={date} className="mb-6">
            <h3 className="text-lg font-semibold mb-3 text-zinc-300">
              {dayName} {date}
            </h3>
            <div className="space-y-3">
              {scheds.map((s) => {
                const assigned = assignedRoutines[s.id];
                const isAssigning = assigningId === s.id;
                return (
                  <Card key={s.id}>
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-medium">{s.class_name}</span>
                        <span className="text-zinc-500 ml-2 text-sm">{s.start_time} - {s.end_time}</span>
                      </div>
                      {assigned ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">
                            {assigned.routine_name}
                          </span>
                          <Button size="sm" variant="secondary" onClick={() => { setAssigningId(s.id); setSelectedRoutineId(String(assigned.routine_id)); setAssignNotes(assigned.notes || ''); }}>
                            Cambiar
                          </Button>
                          <Button size="sm" variant="danger" onClick={() => handleRemove(s.id)}>
                            Quitar
                          </Button>
                        </div>
                      ) : (
                        <Button size="sm" onClick={() => { setAssigningId(s.id); setSelectedRoutineId(''); setAssignNotes(''); }}>
                          Asignar rutina
                        </Button>
                      )}
                    </div>

                    {isAssigning && (
                      <div className="mt-3 pt-3 border-t border-zinc-700 space-y-3">
                        <div>
                          <label className="block text-sm text-zinc-400 mb-1">Rutina</label>
                          <select
                            className="w-full px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-lg"
                            value={selectedRoutineId}
                            onChange={(e) => setSelectedRoutineId(e.target.value)}
                          >
                            <option value="">Seleccionar rutina...</option>
                            {routines.map((r) => (
                              <option key={r.id} value={r.id}>
                                {r.name} ({TYPE_LABELS[r.type] || r.type})
                              </option>
                            ))}
                          </select>
                        </div>
                        <Input label="Notas (opcional)" value={assignNotes} onChange={(e) => setAssignNotes(e.target.value)} />
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => handleAssign(s.id)} loading={saving} disabled={!selectedRoutineId}>
                            Guardar
                          </Button>
                          <Button size="sm" variant="secondary" onClick={() => setAssigningId(null)}>
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          </div>
        );
      })}
      {schedules.length === 0 && <p className="text-zinc-500">No hay horarios en los próximos 14 días.</p>}
    </>
  );
}

/* ─── PERSONALIZADAS TAB ─── */
function PersonalizadasTab() {
  const [routines, setRoutines] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyCustomForm);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [filterUserId, setFilterUserId] = useState('');
  const [instructors, setInstructors] = useState<any[]>([]);

  const load = useCallback(async () => {
    try {
      const uid = filterUserId ? parseInt(filterUserId) : undefined;
      const data = await api.getCustomRoutines(uid);
      setRoutines(data.routines || []);
    } finally {
      setLoading(false);
    }
  }, [filterUserId]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    api.getUsers(200).then((d: any) => setUsers(d.users || d || [])).catch(() => {});
    api.getInstructors().then((d: any) => setInstructors(d.instructors || d || [])).catch(() => {});
  }, []);

  const openEdit = (r: any) => {
    setEditingId(r.id);
    setForm({
      name: r.name,
      type: r.type,
      content: r.content || '',
      duration: r.duration ? String(r.duration) : '',
      difficulty: r.difficulty || 'intermediate',
      description: r.description || '',
      instructor_id: r.instructor_id ? String(r.instructor_id) : '',
      target_user_id: r.target_user_id ? String(r.target_user_id) : '',
      billable: r.billable || false,
    });
    setShowForm(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: form.name,
      type: form.type,
      content: form.content,
      duration: form.duration ? parseInt(form.duration) : 0,
      difficulty: form.difficulty,
      description: form.description,
      instructor_id: form.instructor_id ? parseInt(form.instructor_id) : undefined,
      target_user_id: form.target_user_id ? parseInt(form.target_user_id) : undefined,
      billable: form.billable,
      is_custom: true,
    };
    try {
      if (editingId) {
        await api.updateRoutine(editingId, payload);
        setEditingId(null);
      } else {
        await api.createRoutine(payload);
        setShowForm(false);
      }
      setForm(emptyCustomForm);
      load();
    } catch {
      alert(editingId ? 'Error al actualizar rutina' : 'Error al crear rutina');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Eliminar esta rutina personalizada?')) return;
    setDeletingId(id);
    try {
      await api.deleteRoutine(id);
      load();
      if (editingId === id) setEditingId(null);
    } catch {
      alert('Error al eliminar');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) return <div className="animate-pulse">Cargando...</div>;

  const formUI = (
    <Card className="mb-6">
      <h3 className="font-semibold mb-4">{editingId ? 'Editar rutina personalizada' : 'Nueva rutina personalizada'}</h3>
      <form onSubmit={handleSave} className="space-y-4">
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
          <div>
            <label className="block text-sm text-zinc-400 mb-1">Usuario objetivo</label>
            <select className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg" value={form.target_user_id} onChange={(e) => setForm({ ...form, target_user_id: e.target.value })} required>
              <option value="">Seleccionar usuario...</option>
              {users.map((u: any) => (
                <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-zinc-400 mb-1">Instructor</label>
            <select className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg" value={form.instructor_id} onChange={(e) => setForm({ ...form, instructor_id: e.target.value })}>
              <option value="">Sin asignar</option>
              {instructors.map((i: any) => (
                <option key={i.id} value={i.id}>{i.name}</option>
              ))}
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
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="billable"
            checked={form.billable}
            onChange={(e) => setForm({ ...form, billable: e.target.checked })}
            className="w-4 h-4 rounded border-zinc-600 bg-zinc-800 text-blue-600"
          />
          <label htmlFor="billable" className="text-sm text-zinc-400">Facturable</label>
        </div>
        <Input label="Descripción" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <div>
          <label className="block text-sm text-zinc-400 mb-1">Contenido</label>
          <textarea
            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg min-h-[150px]"
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            placeholder="Describe la rutina personalizada..."
            required
          />
        </div>
        <div className="flex gap-2">
          <Button type="submit">{editingId ? 'Guardar' : 'Crear Rutina'}</Button>
          <Button type="button" variant="secondary" onClick={() => { setShowForm(false); setEditingId(null); setForm(emptyCustomForm); }}>Cancelar</Button>
        </div>
      </form>
    </Card>
  );

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <div>
          <select
            className="px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm"
            value={filterUserId}
            onChange={(e) => setFilterUserId(e.target.value)}
          >
            <option value="">Todos los usuarios</option>
            {users.map((u: any) => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
        </div>
        {!showForm && !editingId && (
          <Button onClick={() => setShowForm(true)}>Nueva Personalizada</Button>
        )}
      </div>

      {(showForm || editingId) && formUI}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {routines.map((routine) => (
          <Card key={routine.id}>
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-semibold">{routine.name}</h3>
              <div className="flex gap-1">
                <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded">{TYPE_LABELS[routine.type] || routine.type}</span>
                {routine.billable && <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded">Facturable</span>}
              </div>
            </div>
            {routine.target_user_name && (
              <p className="text-sm text-purple-400 mb-1">Usuario: {routine.target_user_name}</p>
            )}
            {routine.description && <p className="text-sm text-zinc-400 mb-2">{routine.description}</p>}
            <pre className="text-sm text-zinc-400 whitespace-pre-wrap mb-2 max-h-32 overflow-y-auto">{routine.content}</pre>
            <div className="flex gap-2 text-xs text-zinc-500 mb-3">
              {routine.duration > 0 && <span>{routine.duration} min</span>}
              {routine.difficulty && <span>{DIFFICULTY_LABELS[routine.difficulty] || routine.difficulty}</span>}
              {routine.instructor_name && <span>Instructor: {routine.instructor_name}</span>}
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button size="sm" variant="secondary" onClick={() => openEdit(routine)}>Editar</Button>
              <Button size="sm" variant="danger" onClick={() => handleDelete(routine.id)} loading={deletingId === routine.id}>Eliminar</Button>
            </div>
          </Card>
        ))}
        {routines.length === 0 && <p className="text-zinc-500 col-span-2">No hay rutinas personalizadas.</p>}
      </div>
    </>
  );
}
