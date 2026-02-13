'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface Plan {
  id: number;
  name: string;
  description: string;
  price: number;
  currency: string;
  duration: number;
  max_classes: number;
  active: boolean;
}

export default function PlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', price: '', duration: '', max_classes: '0' });
  const [detailPlan, setDetailPlan] = useState<any | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [editingPlan, setEditingPlan] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', description: '', price: '', duration: '', max_classes: '' });
  const [editSaving, setEditSaving] = useState(false);

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      const data = await api.getPlans();
      setPlans(data.plans || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openDetail = async (id: number) => {
    setDetailPlan(null);
    setEditingPlan(false);
    setDetailLoading(true);
    try {
      const data = await api.getPlan(id);
      const p = data.plan || data;
      setDetailPlan(p);
      setEditForm({
        name: p.name || '',
        description: p.description || '',
        price: String(p.price ?? ''),
        duration: String(p.duration ?? ''),
        max_classes: String(p.max_classes ?? '0'),
      });
    } catch (err) {
      alert('Error al cargar plan');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleEditSave = async () => {
    if (!detailPlan) return;
    setEditSaving(true);
    try {
      await api.updatePlan(detailPlan.id, {
        name: editForm.name,
        description: editForm.description,
        price: parseInt(editForm.price),
        duration: parseInt(editForm.duration),
        max_classes: parseInt(editForm.max_classes),
      });
      setEditingPlan(false);
      setDetailPlan(null);
      loadPlans();
    } catch (err) {
      alert('Error al actualizar plan');
    } finally {
      setEditSaving(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createPlan({
        name: form.name,
        description: form.description,
        price: parseInt(form.price),
        currency: 'CLP',
        duration: parseInt(form.duration),
        max_classes: parseInt(form.max_classes),
      });
      setShowForm(false);
      setForm({ name: '', description: '', price: '', duration: '', max_classes: '0' });
      loadPlans();
    } catch (err) {
      alert('Error al crear plan');
    }
  };

  const toggleActive = async (plan: Plan) => {
    try {
      await api.updatePlan(plan.id, { active: !plan.active });
      loadPlans();
      if (detailPlan?.id === plan.id) setDetailPlan((p: any) => p ? { ...p, active: !p.active } : null);
    } catch (err) {
      alert('Error al actualizar plan');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Eliminar este plan?')) return;
    setDeletingId(id);
    try {
      await api.deletePlan(id);
      setDetailPlan(null);
      loadPlans();
    } catch (err) {
      alert('Error al eliminar plan');
    } finally {
      setDeletingId(null);
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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Planes</h1>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancelar' : 'Nuevo Plan'}
        </Button>
      </div>

      {showForm && (
        <Card className="mb-6">
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
            <Input label="Nombre" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <Input label="Precio (CLP)" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
            <Input label="Duración (días)" type="number" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} required />
            <Input label="Máx. clases (0=ilimitado)" type="number" value={form.max_classes} onChange={(e) => setForm({ ...form, max_classes: e.target.value })} />
            <div className="col-span-2">
              <Input label="Descripción" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="col-span-2">
              <Button type="submit">Crear Plan</Button>
            </div>
          </form>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {plans.map((plan) => (
          <Card key={plan.id}>
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-semibold">{plan.name}</h3>
              <span className={`px-2 py-1 rounded text-xs ${plan.active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                {plan.active ? 'Activo' : 'Inactivo'}
              </span>
            </div>
            <p className="text-2xl font-bold text-blue-500 mb-2">{formatCurrency(plan.price)}</p>
            <p className="text-sm text-zinc-400 mb-4">
              {plan.duration} días • {plan.max_classes === 0 ? 'Clases ilimitadas' : `${plan.max_classes} clases`}
            </p>
            <div className="flex gap-2 flex-wrap">
              <Button size="sm" variant="secondary" onClick={() => openDetail(plan.id)}>Ver</Button>
              <Button size="sm" variant="secondary" onClick={() => toggleActive(plan)}>
                {plan.active ? 'Desactivar' : 'Activar'}
              </Button>
              <Button size="sm" variant="danger" onClick={() => handleDelete(plan.id)} loading={deletingId === plan.id}>Eliminar</Button>
            </div>
          </Card>
        ))}
      </div>

      {detailLoading && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-zinc-800 rounded-lg p-6">Cargando...</div>
        </div>
      )}
      {detailPlan && !detailLoading && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={() => setDetailPlan(null)}>
          <div className="bg-zinc-800 rounded-lg p-6 max-w-md w-full shadow-xl space-y-3" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-semibold text-lg">{editingPlan ? 'Editar plan' : 'Detalle del plan'}</h3>
            {editingPlan ? (
              <div className="space-y-3">
                <Input label="Nombre" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
                <Input label="Precio (CLP)" type="number" value={editForm.price} onChange={(e) => setEditForm({ ...editForm, price: e.target.value })} />
                <Input label="Duracion (dias)" type="number" value={editForm.duration} onChange={(e) => setEditForm({ ...editForm, duration: e.target.value })} />
                <Input label="Max. clases (0=ilimitado)" type="number" value={editForm.max_classes} onChange={(e) => setEditForm({ ...editForm, max_classes: e.target.value })} />
                <Input label="Descripcion" value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} />
                <div className="flex gap-2 pt-2">
                  <Button onClick={handleEditSave} loading={editSaving}>Guardar</Button>
                  <Button variant="secondary" onClick={() => setEditingPlan(false)}>Cancelar</Button>
                </div>
              </div>
            ) : (
              <>
                <p><span className="text-zinc-500">Nombre:</span> {detailPlan.name}</p>
                <p><span className="text-zinc-500">Precio:</span> {formatCurrency(detailPlan.price ?? 0)}</p>
                <p><span className="text-zinc-500">Duracion:</span> {detailPlan.duration} dias</p>
                <p><span className="text-zinc-500">Max. clases:</span> {detailPlan.max_classes === 0 ? 'Ilimitadas' : detailPlan.max_classes}</p>
                <p><span className="text-zinc-500">Descripcion:</span> {detailPlan.description || '-'}</p>
                <p><span className="text-zinc-500">Estado:</span> {detailPlan.active ? 'Activo' : 'Inactivo'}</p>
                <div className="flex gap-2 pt-4 flex-wrap">
                  <Button size="sm" variant="secondary" onClick={() => setEditingPlan(true)}>Editar</Button>
                  <Button size="sm" variant="secondary" onClick={() => toggleActive(detailPlan)}>{detailPlan.active ? 'Desactivar' : 'Activar'}</Button>
                  <Button size="sm" variant="danger" onClick={() => handleDelete(detailPlan.id)} loading={deletingId === detailPlan.id}>Eliminar</Button>
                  <Button size="sm" variant="secondary" onClick={() => setDetailPlan(null)}>Cerrar</Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
