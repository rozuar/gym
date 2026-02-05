'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Subscription } from '@/types';

export default function ProfilePage() {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({ name: '', phone: '' });

  useEffect(() => {
    if (user) {
      setFormData({ name: user.name, phone: user.phone || '' });
    }
    loadSubscription();
  }, [user]);

  const loadSubscription = async () => {
    try {
      const data = await api.getMySubscription();
      setSubscription(data.subscription);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.updateMe(formData);
      setEditing(false);
      window.location.reload();
    } catch (err: any) {
      alert(err.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Mi Perfil</h1>

      <div className="space-y-6">
        <Card>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Datos Personales</h2>
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
                label="Teléfono"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
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
              <p><span className="text-zinc-500">Nombre:</span> {user?.name}</p>
              <p><span className="text-zinc-500">Email:</span> {user?.email}</p>
              <p><span className="text-zinc-500">Teléfono:</span> {user?.phone || '-'}</p>
            </div>
          )}
        </Card>

        <Card>
          <h2 className="text-lg font-semibold mb-4">Suscripción</h2>

          {subscription ? (
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
          ) : (
            <div className="text-center py-4">
              <p className="text-zinc-400 mb-4">No tienes suscripción activa</p>
              <Button onClick={() => window.location.href = '/plans'}>
                Ver Planes
              </Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
