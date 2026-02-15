'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function PaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailPayment, setDetailPayment] = useState<any | null>(null);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [users, setUsers] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [formUserId, setFormUserId] = useState('');
  const [formPlanId, setFormPlanId] = useState('');
  const [formMethod, setFormMethod] = useState('efectivo');
  const [formProofUrl, setFormProofUrl] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [uploadingProof, setUploadingProof] = useState(false);
  const [userSearch, setUserSearch] = useState('');

  useEffect(() => {
    loadPayments();
  }, []);

  const loadPayments = () => {
    api.getPayments(100, 0)
      .then((data) => setPayments(data.payments || []))
      .finally(() => setLoading(false));
  };

  const openForm = async () => {
    setShowForm(true);
    setFormError('');
    try {
      const [usersData, plansData] = await Promise.all([
        api.getUsers(200, 0),
        api.getPlans(),
      ]);
      setUsers((usersData.users || []).filter((u: any) => u.role === 'user'));
      setPlans((plansData.plans || []).filter((p: any) => p.active));
    } catch {
      setFormError('Error al cargar datos');
    }
  };

  const handleSubmit = async () => {
    if (!formUserId || !formPlanId) {
      setFormError('Selecciona usuario y plan');
      return;
    }
    if (formMethod === 'transferencia' && !formProofUrl) {
      setFormError('Transferencia requiere comprobante (sube una imagen)');
      return;
    }
    setSubmitting(true);
    setFormError('');
    try {
      await api.createPayment({
        user_id: Number(formUserId),
        plan_id: Number(formPlanId),
        payment_method: formMethod,
        proof_image_url: formMethod === 'transferencia' ? formProofUrl : undefined,
      });
      setShowForm(false);
      setFormUserId('');
      setFormPlanId('');
      setFormMethod('efectivo');
      setFormProofUrl('');
      setLoading(true);
      loadPayments();
    } catch (err: any) {
      setFormError(err.message || 'Error al registrar pago');
    } finally {
      setSubmitting(false);
    }
  };

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

  const filteredUsers = userSearch
    ? users.filter((u) => u.name.toLowerCase().includes(userSearch.toLowerCase()) || u.email.toLowerCase().includes(userSearch.toLowerCase()))
    : users;

  if (loading) return <div className="animate-pulse">Cargando...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Pagos</h1>
        <Button onClick={openForm}>Registrar pago</Button>
      </div>

      <Card className="overflow-hidden p-0">
        <table className="w-full">
          <thead className="bg-zinc-800">
            <tr>
              <th className="text-left p-4">ID</th>
              <th className="text-left p-4">Usuario</th>
              <th className="text-left p-4">Plan</th>
              <th className="text-left p-4">Monto</th>
              <th className="text-left p-4">Metodo</th>
              <th className="text-left p-4">Estado</th>
              <th className="text-left p-4">Fecha</th>
              <th className="text-left p-4">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {payments.length === 0 && (
              <tr><td colSpan={8} className="p-4 text-center text-zinc-500">No hay pagos registrados</td></tr>
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
                <td className="p-4 text-zinc-400">{payment.payment_method || '-'}</td>
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
            <p><span className="text-zinc-500">Metodo:</span> {detailPayment.payment_method || '-'}</p>
            {detailPayment.proof_image_url && (
              <p><span className="text-zinc-500">Comprobante:</span> <a href={detailPayment.proof_image_url} target="_blank" rel="noopener noreferrer" className="text-blue-400 underline">Ver</a></p>
            )}
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

      {/* Modal crear pago */}
      {showForm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={() => setShowForm(false)}>
          <div className="bg-zinc-800 rounded-lg p-6 max-w-lg w-full shadow-xl space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-semibold text-lg">Registrar pago</h3>

            {formError && <p className="text-red-400 text-sm">{formError}</p>}

            <div>
              <label className="block text-sm text-zinc-400 mb-1">Usuario</label>
              <input
                type="text"
                placeholder="Buscar por nombre o email..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-700 rounded text-sm mb-2"
              />
              <select
                value={formUserId}
                onChange={(e) => setFormUserId(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-700 rounded text-sm"
              >
                <option value="">Seleccionar usuario</option>
                {filteredUsers.map((u) => (
                  <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-zinc-400 mb-1">Plan</label>
              <select
                value={formPlanId}
                onChange={(e) => setFormPlanId(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-700 rounded text-sm"
              >
                <option value="">Seleccionar plan</option>
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>{p.name} - {formatCurrency(p.price, p.currency)}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-zinc-400 mb-1">Metodo de pago</label>
              <select
                value={formMethod}
                onChange={(e) => setFormMethod(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-700 rounded text-sm"
              >
                <option value="efectivo">Efectivo</option>
                <option value="debito">Debito</option>
                <option value="transferencia">Transferencia</option>
              </select>
            </div>

            {formMethod === 'transferencia' && (
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Comprobante de transferencia</label>
                {formProofUrl && (
                  <img src={formProofUrl} alt="Comprobante" className="w-24 h-24 object-cover rounded mb-2" />
                )}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  disabled={uploadingProof}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setUploadingProof(true);
                    try {
                      const { url } = await api.uploadImage(file);
                      setFormProofUrl(url);
                    } catch {
                      setFormError('Error al subir comprobante');
                    } finally {
                      setUploadingProof(false);
                    }
                  }}
                  className="w-full text-sm text-zinc-400 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-zinc-700 file:text-white hover:file:bg-zinc-600"
                />
                {uploadingProof && <p className="text-xs text-zinc-500 mt-1">Subiendo...</p>}
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button onClick={handleSubmit} loading={submitting}>Registrar</Button>
              <Button variant="secondary" onClick={() => setShowForm(false)}>Cancelar</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
