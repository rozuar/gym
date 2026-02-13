'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Subscription } from '@/types';

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({ name: '', phone: '', avatar_url: '' });

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/');
      return;
    }
    if (user) {
      setFormData({ name: user.name, phone: user.phone || '', avatar_url: user.avatar_url || '' });
    }
    loadSubscription();
    loadPayments();
  }, [user, authLoading, router]);

  const loadSubscription = async () => {
    try {
      const data = await api.getMySubscription();
      setSubscription(data.subscription);
      setLoadError('');
    } catch (err) {
      console.error(err);
      setLoadError('No se pudo cargar la suscripcion.');
    } finally {
      setLoading(false);
    }
  };

  const loadPayments = async () => {
    try {
      const data = await api.getMyPayments();
      setPayments(data.payments || []);
    } catch (err) {
      console.error(err);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 }).format(amount);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.updateMe({
        name: formData.name,
        phone: formData.phone,
        avatar_url: formData.avatar_url,
      });
      setEditing(false);
      window.location.reload();
    } catch (err: any) {
      alert(err.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || (!user && loading)) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[50vh] gap-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white" />
        <p className="text-zinc-400">Redirigiendo...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Mi Perfil</h1>

      <div className="space-y-6">
        <Card>
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-4">
              {user.avatar_url ? (
                <img src={user.avatar_url} alt="" className="w-16 h-16 rounded-full object-cover shrink-0" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-zinc-700 flex items-center justify-center text-xl text-zinc-500 font-medium shrink-0">
                  {user.name?.charAt(0)?.toUpperCase() || '?'}
                </div>
              )}
              <h2 className="text-lg font-semibold">Datos Personales</h2>
            </div>
            {!editing && (
              <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>
                Editar
              </Button>
            )}
          </div>

          {editing ? (
            <div className="space-y-4">
              <Input
                label="Nombre"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
              <Input
                label="Telefono"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
              <Input
                label="Foto de perfil (URL)"
                value={formData.avatar_url}
                onChange={(e) => setFormData({ ...formData, avatar_url: e.target.value })}
                placeholder="https://..."
              />
              <div className="flex gap-2">
                <Button onClick={handleSave} loading={saving}>
                  Guardar
                </Button>
                <Button variant="secondary" onClick={() => setEditing(false)}>
                  Cancelar
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-2 text-zinc-300">
              {user?.avatar_url && <p><span className="text-zinc-500">Foto:</span> <a href={user.avatar_url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Ver</a></p>}
              <p><span className="text-zinc-500">Nombre:</span> {user?.name}</p>
              <p><span className="text-zinc-500">Email:</span> {user?.email}</p>
              <p><span className="text-zinc-500">Telefono:</span> {user?.phone || '-'}</p>
              {user?.birth_date && (
                <p><span className="text-zinc-500">Fecha de nacimiento:</span> {new Date(user.birth_date).toLocaleDateString('es-CL')}</p>
              )}
              {user?.sex && (
                <p><span className="text-zinc-500">Sexo:</span> {user.sex === 'M' ? 'Masculino' : 'Femenino'}</p>
              )}
              {(user?.weight_kg ?? 0) > 0 && (
                <p><span className="text-zinc-500">Peso:</span> {user.weight_kg} kg</p>
              )}
              {(user?.height_cm ?? 0) > 0 && (
                <p><span className="text-zinc-500">Estatura:</span> {user.height_cm} cm</p>
              )}
            </div>
          )}
        </Card>

        <Card>
          <h2 className="text-lg font-semibold mb-4">Suscripción</h2>

          {loadError ? (
            <p className="text-red-400 text-sm">{loadError}</p>
          ) : subscription ? (
            <div className="space-y-2 text-zinc-300">
              <p><span className="text-zinc-500">Plan:</span> {subscription.plan_name}</p>
              <p>
                <span className="text-zinc-500">Vigencia:</span>{' '}
                {new Date(subscription.start_date).toLocaleDateString('es-CL')} -{' '}
                {new Date(subscription.end_date).toLocaleDateString('es-CL')}
              </p>
              {subscription.classes_allowed > 0 && (
                <p>
                  <span className="text-zinc-500">Clases:</span>{' '}
                  {subscription.classes_used} / {subscription.classes_allowed} usadas
                </p>
              )}
              <div className="pt-2">
                <span className={`text-sm px-2 py-1 rounded ${subscription.active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                  {subscription.active ? 'Activa' : 'Inactiva'}
                </span>
              </div>
            </div>
          ) : !loadError ? (
            <div className="text-center py-4">
              <p className="text-zinc-400 mb-4">No tienes suscripcion activa</p>
              <Button onClick={() => window.location.href = '/plans'}>
                Ver Planes
              </Button>
            </div>
          ) : null}
        </Card>

        <Card>
          <h2 className="text-lg font-semibold mb-4">Historial de pagos</h2>
          {payments.length === 0 ? (
            <p className="text-zinc-400 text-sm">Sin pagos registrados</p>
          ) : (
            <div className="space-y-2">
              {payments.slice(0, 12).map((p: any) => (
                <div key={p.id} className="flex justify-between items-center py-2 border-b border-zinc-800 last:border-0">
                  <div>
                    <p className="text-sm font-medium">{p.plan_name}</p>
                    <p className="text-xs text-zinc-500">{new Date(p.created_at).toLocaleDateString('es-CL')} - {p.payment_method || '-'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">{formatCurrency(p.amount)}</p>
                    <span className={`text-xs px-1.5 py-0.5 rounded ${p.status === 'completed' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                      {p.status === 'completed' ? 'Pagado' : p.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
