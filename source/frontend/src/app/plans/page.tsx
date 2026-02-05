'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Plan } from '@/types';

export default function PlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<number | null>(null);

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      const data = await api.getPlans();
      setPlans((data.plans || []).filter((p: Plan) => p.active));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (planId: number) => {
    if (!confirm('¿Confirmar compra de este plan?')) return;

    setPurchasing(planId);
    try {
      await api.createPayment(planId);
      alert('Compra realizada con éxito');
      window.location.href = '/profile';
    } catch (err: any) {
      alert(err.message || 'Error al procesar el pago');
    } finally {
      setPurchasing(null);
    }
  };

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: currency || 'CLP',
      minimumFractionDigits: 0,
    }).format(price);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Planes</h1>

      {plans.length === 0 ? (
        <Card>
          <p className="text-zinc-400 text-center">No hay planes disponibles</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <Card key={plan.id} className="flex flex-col">
              <h2 className="text-xl font-bold mb-2">{plan.name}</h2>
              {plan.description && (
                <p className="text-zinc-400 text-sm mb-4">{plan.description}</p>
              )}

              <div className="text-3xl font-bold text-blue-500 mb-4">
                {formatPrice(plan.price, plan.currency)}
              </div>

              <ul className="space-y-2 text-sm text-zinc-300 mb-6 flex-grow">
                <li>• Duración: {plan.duration} días</li>
                <li>
                  • Clases: {plan.max_classes === 0 ? 'Ilimitadas' : `${plan.max_classes} clases`}
                </li>
              </ul>

              <Button
                className="w-full"
                loading={purchasing === plan.id}
                onClick={() => handlePurchase(plan.id)}
              >
                Comprar
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
