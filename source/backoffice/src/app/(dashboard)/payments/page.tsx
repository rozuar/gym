'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function PaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailPayment, setDetailPayment] = useState<any | null>(null);

  useEffect(() => {
    api.getPayments(100, 0)
      .then((data) => setPayments(data.payments || []))
      .finally(() => setLoading(false));
  }, []);

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: currency || 'CLP', minimumFractionDigits: 0 }).format(amount);
  };

  const statusLabel: Record<string, string> = {
    completed: 'Completado',
    pending: 'Pendiente',
    failed: 'Fallido',
    refunded: 'Reembolsado',
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      completed: 'bg-green-500/20 text-green-400',
      pending: 'bg-yellow-500/20 text-yellow-400',
      failed: 'bg-red-500/20 text-red-400',
      refunded: 'bg-zinc-500/20 text-zinc-400',
    };
    return <span className={`px-2 py-1 rounded text-xs ${styles[status] || ''}`}>{statusLabel[status] || status}</span>;
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
              <th className="text-left p-4">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {payments.length === 0 && (
              <tr><td colSpan={7} className="p-4 text-center text-zinc-500">No hay pagos registrados</td></tr>
            )}
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
                <td className="p-4">
                  <Button size="sm" variant="secondary" onClick={() => setDetailPayment(payment)}>Ver</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* Modal detalle */}
      {detailPayment && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={() => setDetailPayment(null)}>
          <div className="bg-zinc-800 rounded-lg p-6 max-w-md w-full shadow-xl space-y-3" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-semibold text-lg">Detalle del Pago #{detailPayment.id}</h3>
            <p><span className="text-zinc-500">Usuario:</span> {detailPayment.user_name}</p>
            <p><span className="text-zinc-500">Email:</span> {detailPayment.user_email}</p>
            <p><span className="text-zinc-500">Plan:</span> {detailPayment.plan_name}</p>
            <p><span className="text-zinc-500">Monto:</span> {formatCurrency(detailPayment.amount, detailPayment.currency)}</p>
            <p><span className="text-zinc-500">Moneda:</span> {detailPayment.currency || 'CLP'}</p>
            <p><span className="text-zinc-500">Estado:</span> {getStatusBadge(detailPayment.status)}</p>
            <p><span className="text-zinc-500">Método:</span> {detailPayment.payment_method || '-'}</p>
            <p><span className="text-zinc-500">ID externo:</span> {detailPayment.external_id || '-'}</p>
            <p className="text-sm text-zinc-500">
              Fecha: {detailPayment.created_at ? new Date(detailPayment.created_at).toLocaleString('es-CL') : '-'}
            </p>
            <div className="flex gap-2 pt-4">
              <Button variant="secondary" onClick={() => setDetailPayment(null)}>Cerrar</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
