'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/Card';

export default function PaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getPayments(100, 0)
      .then((data) => setPayments(data.payments || []))
      .finally(() => setLoading(false));
  }, []);

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: currency || 'CLP', minimumFractionDigits: 0 }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      completed: 'bg-green-500/20 text-green-400',
      pending: 'bg-yellow-500/20 text-yellow-400',
      failed: 'bg-red-500/20 text-red-400',
      refunded: 'bg-zinc-500/20 text-zinc-400',
    };
    return <span className={`px-2 py-1 rounded text-xs ${styles[status] || ''}`}>{status}</span>;
  };

  if (loading) return <div className="animate-pulse">Cargando...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Pagos</h1>

      <Card className="overflow-hidden p-0">
        <table className="w-full">
          <thead className="bg-zinc-800">
            <tr>
              <th className="text-left p-4">ID</th>
              <th className="text-left p-4">Usuario</th>
              <th className="text-left p-4">Plan</th>
              <th className="text-left p-4">Monto</th>
              <th className="text-left p-4">Estado</th>
              <th className="text-left p-4">Fecha</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((payment) => (
              <tr key={payment.id} className="border-t border-zinc-800">
                <td className="p-4 text-zinc-500">#{payment.id}</td>
                <td className="p-4">
                  <div>{payment.user_name}</div>
                  <div className="text-sm text-zinc-500">{payment.user_email}</div>
                </td>
                <td className="p-4">{payment.plan_name}</td>
                <td className="p-4 font-semibold">{formatCurrency(payment.amount, payment.currency)}</td>
                <td className="p-4">{getStatusBadge(payment.status)}</td>
                <td className="p-4 text-zinc-400">
                  {new Date(payment.created_at).toLocaleDateString('es-CL')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
