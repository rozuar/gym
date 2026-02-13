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
  }, [user, authLoading, router]);

  const loadSubscription = async () => {
    try {
      const data = await api.getMySubscription();
      setSubscription(data.subscription);
      setLoadError('');
    } catch (err) {
      console.error(err);
      setLoadError('No se pudo cargar la suscripción.');
    } finally {
      setLoading(false);
    }
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
                label="Teléfono"
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
              <p><span className="text-zinc-500">Teléfono:</span> {user?.phone || '-'}</p>
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
              <p className="text-zinc-400 mb-4">No tienes suscripción activa</p>
              <Button onClick={() => window.location.href = '/plans'}>
                Ver Planes
              </Button>
            </div>
          ) : null}
        </Card>
      </div>
    </div>
  );
}
