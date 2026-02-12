'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface Instructor {
  id: number;
  name: string;
  email: string;
  phone: string;
  specialty: string;
  bio: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

const emptyForm = { name: '', email: '', phone: '', specialty: '', bio: '' };

export default function InstructorsPage() {
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [detailInstructor, setDetailInstructor] = useState<Instructor | null>(null);

  useEffect(() => {
    loadInstructors();
  }, []);

  const loadInstructors = async () => {
    try {
      const data = await api.getInstructors();
      setInstructors(data.instructors || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (instructor: Instructor) => {
    setEditingId(instructor.id);
    setForm({
      name: instructor.name,
      email: instructor.email || '',
      phone: instructor.phone || '',
      specialty: instructor.specialty || '',
      bio: instructor.bio || '',
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        await api.updateInstructor(editingId, form);
      } else {
        await api.createInstructor(form);
      }
      setShowForm(false);
      setEditingId(null);
      setForm(emptyForm);
      loadInstructors();
    } catch (err) {
      alert('Error al guardar instructor');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (instructor: Instructor) => {
    try {
      await api.updateInstructor(instructor.id, { active: !instructor.active });
      loadInstructors();
      if (detailInstructor?.id === instructor.id) {
        setDetailInstructor({ ...detailInstructor, active: !detailInstructor.active });
      }
    } catch (err) {
      alert('Error al actualizar instructor');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Eliminar este instructor? Se desvinculará de las clases asignadas.')) return;
    setDeletingId(id);
    try {
      await api.deleteInstructor(id);
      setDetailInstructor(null);
      loadInstructors();
    } catch (err) {
      alert('Error al eliminar instructor');
    } finally {
      setDeletingId(null);
    }
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  if (loading) {
    return <div className="animate-pulse">Cargando...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Instructores</h1>
        <Button onClick={() => (showForm ? cancelForm() : openCreate())}>
          {showForm ? 'Cancelar' : 'Nuevo Instructor'}
        </Button>
      </div>

      {showForm && (
        <Card className="mb-6">
          <h2 className="font-semibold mb-4">{editingId ? 'Editar Instructor' : 'Nuevo Instructor'}</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
            <Input
              label="Nombre *"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
            <Input
              label="Email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            <Input
              label="Teléfono"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
            <Input
              label="Especialidad"
              value={form.specialty}
              onChange={(e) => setForm({ ...form, specialty: e.target.value })}
              placeholder="CrossFit, Halterofilia..."
            />
            <div className="col-span-2">
              <label className="block text-sm text-zinc-400 mb-1">Bio</label>
              <textarea
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white resize-none"
                rows={3}
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                placeholder="Breve descripción del instructor..."
              />
            </div>
            <div className="col-span-2">
              <Button type="submit" loading={saving}>
                {editingId ? 'Guardar Cambios' : 'Crear Instructor'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      <Card className="overflow-hidden p-0">
        <table className="w-full">
          <thead className="bg-zinc-800">
            <tr>
              <th className="text-left p-4">Nombre</th>
              <th className="text-left p-4">Email</th>
              <th className="text-left p-4">Teléfono</th>
              <th className="text-left p-4">Especialidad</th>
              <th className="text-left p-4">Estado</th>
              <th className="text-left p-4">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {instructors.length === 0 && (
              <tr>
                <td colSpan={6} className="p-4 text-center text-zinc-500">
                  No hay instructores registrados
                </td>
              </tr>
            )}
            {instructors.map((inst) => (
              <tr key={inst.id} className="border-t border-zinc-800">
                <td className="p-4">{inst.name}</td>
                <td className="p-4 text-zinc-400">{inst.email || '-'}</td>
                <td className="p-4 text-zinc-400">{inst.phone || '-'}</td>
                <td className="p-4">
                  {inst.specialty ? (
                    <span className="px-2 py-1 rounded text-xs bg-blue-500/20 text-blue-400">
                      {inst.specialty}
                    </span>
                  ) : (
                    <span className="text-zinc-500">-</span>
                  )}
                </td>
                <td className="p-4">
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      inst.active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                    }`}
                  >
                    {inst.active ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="p-4 flex gap-2 flex-wrap">
                  <Button size="sm" variant="secondary" onClick={() => setDetailInstructor(inst)}>
                    Ver
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => openEdit(inst)}>
                    Editar
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => toggleActive(inst)}
                  >
                    {inst.active ? 'Desactivar' : 'Activar'}
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => handleDelete(inst.id)}
                    loading={deletingId === inst.id}
                  >
                    Eliminar
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* Modal de detalle */}
      {detailInstructor && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
          onClick={() => setDetailInstructor(null)}
        >
          <div
            className="bg-zinc-800 rounded-lg p-6 max-w-md w-full shadow-xl space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-semibold text-lg">Detalle del Instructor</h3>
            <p><span className="text-zinc-500">Nombre:</span> {detailInstructor.name}</p>
            <p><span className="text-zinc-500">Email:</span> {detailInstructor.email || '-'}</p>
            <p><span className="text-zinc-500">Teléfono:</span> {detailInstructor.phone || '-'}</p>
            <p><span className="text-zinc-500">Especialidad:</span> {detailInstructor.specialty || '-'}</p>
            <p><span className="text-zinc-500">Bio:</span> {detailInstructor.bio || '-'}</p>
            <p><span className="text-zinc-500">Estado:</span> {detailInstructor.active ? 'Activo' : 'Inactivo'}</p>
            <p className="text-sm text-zinc-500">
              Creado: {detailInstructor.created_at ? new Date(detailInstructor.created_at).toLocaleString() : '-'}
            </p>
            <div className="flex gap-2 pt-4">
              <Button variant="secondary" onClick={() => { openEdit(detailInstructor); setDetailInstructor(null); }}>
                Editar
              </Button>
              <Button variant="secondary" onClick={() => toggleActive(detailInstructor)}>
                {detailInstructor.active ? 'Desactivar' : 'Activar'}
              </Button>
              <Button
                variant="danger"
                onClick={() => handleDelete(detailInstructor.id)}
                loading={deletingId === detailInstructor.id}
              >
                Eliminar
              </Button>
              <Button variant="secondary" onClick={() => setDetailInstructor(null)}>
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
