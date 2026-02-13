'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Plan } from '@/types';

export default function PlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      const data = await api.getPlans();
      setPlans((data.plans || []).filter((p: Plan) => p.active));
      setLoadError('');
    } catch (err) {
      console.error(err);
      setLoadError('No se pudieron cargar los planes. ¿Está el backend en marcha?');
    } finally {
      setLoading(false);
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

      {loadError ? (
        <Card>
          <p className="text-red-400 text-center">{loadError}</p>
          <p className="text-zinc-500 text-center text-sm mt-2">Backend: {process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1'}</p>
        </Card>
      ) : plans.length === 0 ? (
        <Card>
          <p className="text-zinc-400 text-center">No hay planes disponibles</p>
          <p className="text-zinc-500 text-center text-sm mt-2">Crea datos de prueba desde la página de login (modo dev)</p>
        </Card>
      ) : (
        <>
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

                <ul className="space-y-2 text-sm text-zinc-300 flex-grow">
                  <li>Duracion: {plan.duration} dias</li>
                  <li>
                    Clases: {plan.max_classes === 0 ? 'Ilimitadas' : `${plan.max_classes} clases`}
                  </li>
                </ul>
              </Card>
            ))}
          </div>
          <div className="mt-6 text-center">
            <p className="text-zinc-400">Para contratar un plan, consulta en recepcion o habla con tu coach.</p>
          </div>
        </>
      )}
    </div>
  );
}
