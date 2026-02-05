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
    } catch (err) {
      alert('Error al actualizar plan');
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
            <Button size="sm" variant="secondary" onClick={() => toggleActive(plan)}>
              {plan.active ? 'Desactivar' : 'Activar'}
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}
