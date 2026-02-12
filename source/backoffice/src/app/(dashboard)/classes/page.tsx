'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

const DAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

const emptyForm = {
  discipline_id: '', name: '', description: '', day_of_week: '1', start_time: '07:00', end_time: '08:00', capacity: '15', instructor_ids: [] as string[],
};

export default function ClassesPage() {
  const [classes, setClasses] = useState<any[]>([]);
  const [disciplines, setDisciplines] = useState<any[]>([]);
  const [instructors, setInstructors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [detailClass, setDetailClass] = useState<any | null>(null);

  useEffect(() => {
    Promise.all([api.getClasses(), api.getDisciplines(), api.getInstructors(true)])
      .then(([c, d, i]) => {
        setClasses(c.classes || []);
        setDisciplines(d.disciplines || []);
        setInstructors(i.instructors || []);
      })
      .finally(() => setLoading(false));
  }, []);

  const reload = async () => {
    const data = await api.getClasses();
    setClasses(data.classes || []);
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (cls: any) => {
    setEditingId(cls.id);
    setForm({
      discipline_id: String(cls.discipline_id),
      name: cls.name,
      description: cls.description || '',
      day_of_week: String(cls.day_of_week),
      start_time: cls.start_time,
      end_time: cls.end_time,
      capacity: String(cls.capacity),
      instructor_ids: [],
    });
    setShowForm(true);
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: any = {
        discipline_id: parseInt(form.discipline_id),
        name: form.name,
        description: form.description,
        day_of_week: parseInt(form.day_of_week),
        start_time: form.start_time,
        end_time: form.end_time,
        capacity: parseInt(form.capacity),
      };
      if (form.instructor_ids.length > 0) {
        payload.instructor_ids = form.instructor_ids.map(Number);
      }
      if (editingId) {
        await api.updateClass(editingId, payload);
      } else {
        await api.createClass(payload);
      }
      cancelForm();
      reload();
    } catch (err) {
      alert('Error al guardar clase');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (cls: any) => {
    try {
      await api.updateClass(cls.id, { active: !cls.active });
      reload();
      if (detailClass?.id === cls.id) setDetailClass((p: any) => p ? { ...p, active: !p.active } : null);
    } catch (err) {
      alert('Error al actualizar clase');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Eliminar esta clase? Se eliminarán también los horarios asociados.')) return;
    setDeletingId(id);
    try {
      await api.deleteClass(id);
      setDetailClass(null);
      reload();
    } catch (err) {
      alert('Error al eliminar clase');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) return <div className="animate-pulse">Cargando...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Clases</h1>
        <Button onClick={() => (showForm ? cancelForm() : openCreate())}>
          {showForm ? 'Cancelar' : 'Nueva Clase'}
        </Button>
      </div>

      {showForm && (
        <Card className="mb-6">
          <h2 className="font-semibold mb-4">{editingId ? 'Editar Clase' : 'Nueva Clase'}</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Disciplina *</label>
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
            <Input label="Nombre *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Día *</label>
              <select
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg"
                value={form.day_of_week}
                onChange={(e) => setForm({ ...form, day_of_week: e.target.value })}
              >
                {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
              </select>
            </div>
            <Input label="Capacidad *" type="number" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} required />
            <Input label="Hora inicio *" type="time" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} required />
            <Input label="Hora fin *" type="time" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} required />
            {instructors.length > 0 && (
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Instructor</label>
                <select
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg"
                  value={form.instructor_ids[0] || ''}
                  onChange={(e) => setForm({ ...form, instructor_ids: e.target.value ? [e.target.value] : [] })}
                >
                  <option value="">Sin asignar</option>
                  {instructors.map((i) => <option key={i.id} value={i.id}>{i.name} ({i.specialty})</option>)}
                </select>
              </div>
            )}
            <div className="col-span-2">
              <Input label="Descripción" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="col-span-2 flex gap-2">
              <Button type="submit" loading={saving}>{editingId ? 'Guardar Cambios' : 'Crear Clase'}</Button>
              {editingId && <Button type="button" variant="secondary" onClick={cancelForm}>Cancelar</Button>}
            </div>
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
              <th className="text-left p-4">Cap.</th>
              <th className="text-left p-4">Instructor</th>
              <th className="text-left p-4">Estado</th>
              <th className="text-left p-4">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {classes.length === 0 && (
              <tr><td colSpan={8} className="p-4 text-center text-zinc-500">No hay clases registradas</td></tr>
            )}
            {classes.map((cls) => (
              <tr key={cls.id} className="border-t border-zinc-800">
                <td className="p-4">{cls.name}</td>
                <td className="p-4 text-zinc-400">{cls.discipline_name}</td>
                <td className="p-4">{DAYS[cls.day_of_week]}</td>
                <td className="p-4">{cls.start_time} - {cls.end_time}</td>
                <td className="p-4">{cls.capacity}</td>
                <td className="p-4 text-zinc-400">
                  {cls.instructors && cls.instructors.length > 0 ? cls.instructors.join(', ') : '-'}
                </td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-xs ${cls.active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                    {cls.active ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="p-4 flex gap-2 flex-wrap">
                  <Button size="sm" variant="secondary" onClick={() => setDetailClass(cls)}>Ver</Button>
                  <Button size="sm" variant="secondary" onClick={() => openEdit(cls)}>Editar</Button>
                  <Button size="sm" variant="secondary" onClick={() => toggleActive(cls)}>
                    {cls.active ? 'Desactivar' : 'Activar'}
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => handleDelete(cls.id)} loading={deletingId === cls.id}>Eliminar</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* Modal detalle */}
      {detailClass && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={() => setDetailClass(null)}>
          <div className="bg-zinc-800 rounded-lg p-6 max-w-md w-full shadow-xl space-y-3" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-semibold text-lg">Detalle de Clase</h3>
            <p><span className="text-zinc-500">Nombre:</span> {detailClass.name}</p>
            <p><span className="text-zinc-500">Disciplina:</span> {detailClass.discipline_name}</p>
            <p><span className="text-zinc-500">Día:</span> {DAYS[detailClass.day_of_week]}</p>
            <p><span className="text-zinc-500">Horario:</span> {detailClass.start_time} - {detailClass.end_time}</p>
            <p><span className="text-zinc-500">Capacidad:</span> {detailClass.capacity}</p>
            <p><span className="text-zinc-500">Instructor:</span> {detailClass.instructors?.join(', ') || '-'}</p>
            <p><span className="text-zinc-500">Descripción:</span> {detailClass.description || '-'}</p>
            <p><span className="text-zinc-500">Estado:</span> {detailClass.active ? 'Activo' : 'Inactivo'}</p>
            <div className="flex gap-2 pt-4">
              <Button variant="secondary" onClick={() => { openEdit(detailClass); setDetailClass(null); }}>Editar</Button>
              <Button variant="secondary" onClick={() => toggleActive(detailClass)}>
                {detailClass.active ? 'Desactivar' : 'Activar'}
              </Button>
              <Button variant="danger" onClick={() => handleDelete(detailClass.id)} loading={deletingId === detailClass.id}>Eliminar</Button>
              <Button variant="secondary" onClick={() => setDetailClass(null)}>Cerrar</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
