'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface User {
  id: number;
  email: string;
  name: string;
  phone: string;
  avatar_url?: string;
  role: string;
  active: boolean;
  created_at: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailUser, setDetailUser] = useState<any | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [editingAvatar, setEditingAvatar] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const data = await api.getUsers(100, 0);
      setUsers(data.users || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openDetail = async (id: number) => {
    setDetailUser(null);
    setEditingAvatar(false);
    setDetailLoading(true);
    try {
      const user = await api.getUser(id);
      setDetailUser(user);
      setAvatarUrl(user.avatar_url || '');
    } catch (err) {
      alert('Error al cargar usuario');
    } finally {
      setDetailLoading(false);
    }
  };

  const saveAvatar = async () => {
    if (!detailUser) return;
    try {
      await api.updateUser(detailUser.id, { avatar_url: avatarUrl });
      setDetailUser((p: any) => p ? { ...p, avatar_url: avatarUrl || '' } : null);
      setEditingAvatar(false);
      loadUsers();
    } catch (err) {
      alert('Error al actualizar avatar');
    }
  };

  const toggleActive = async (user: User) => {
    try {
      await api.updateUser(user.id, { active: !user.active });
      loadUsers();
      if (detailUser?.id === user.id) setDetailUser((p: any) => p ? { ...p, active: !p.active } : null);
    } catch (err) {
      alert('Error al actualizar usuario');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Eliminar este usuario? Esta acción no se puede deshacer.')) return;
    setDeletingId(id);
    try {
      await api.deleteUser(id);
      setDetailUser(null);
      loadUsers();
    } catch (err) {
      alert('Error al eliminar usuario');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return <div className="animate-pulse">Cargando...</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Usuarios</h1>

      <Card className="overflow-hidden p-0">
        <table className="w-full">
          <thead className="bg-zinc-800">
            <tr>
              <th className="p-2 w-12"></th>
              <th className="text-left p-4">Nombre</th>
              <th className="text-left p-4">Email</th>
              <th className="text-left p-4">Telefono</th>
              <th className="text-left p-4">Rol</th>
              <th className="text-left p-4">Estado</th>
              <th className="text-left p-4">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-t border-zinc-800">
                <td className="p-2">
                  {user.avatar_url ? (
                    <img src={user.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center text-zinc-500 text-sm font-medium">
                      {user.name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                  )}
                </td>
                <td className="p-4">{user.name}</td>
                <td className="p-4 text-zinc-400">{user.email}</td>
                <td className="p-4 text-zinc-400">{user.phone || '-'}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-xs ${user.role === 'admin' ? 'bg-purple-500/20 text-purple-400' : 'bg-zinc-700'}`}>
                    {user.role}
                  </span>
                </td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-xs ${user.active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                    {user.active ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="p-4 flex gap-2 flex-wrap">
                  <Button size="sm" variant="secondary" onClick={() => openDetail(user.id)}>Ver</Button>
                  <Button size="sm" variant="secondary" onClick={() => toggleActive(user)}>
                    {user.active ? 'Desactivar' : 'Activar'}
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => handleDelete(user.id)} loading={deletingId === user.id}>Eliminar</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {detailLoading && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-zinc-800 rounded-lg p-6">Cargando...</div>
        </div>
      )}
      {detailUser && !detailLoading && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={() => setDetailUser(null)}>
          <div className="bg-zinc-800 rounded-lg p-6 max-w-md w-full shadow-xl space-y-3" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-semibold text-lg">Detalle de usuario</h3>
            <div className="flex items-center gap-4">
              {detailUser.avatar_url ? (
                <img src={detailUser.avatar_url} alt="" className="w-20 h-20 rounded-full object-cover" />
              ) : (
                <div className="w-20 h-20 rounded-full bg-zinc-700 flex items-center justify-center text-2xl text-zinc-500 font-medium">
                  {detailUser.name?.charAt(0)?.toUpperCase() || '?'}
                </div>
              )}
              <div className="flex-1">
                {editingAvatar ? (
                  <div className="space-y-2">
                    <input
                      type="url"
                      placeholder="URL de la foto"
                      value={avatarUrl}
                      onChange={(e) => setAvatarUrl(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-lg text-sm"
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={saveAvatar}>Guardar</Button>
                      <Button size="sm" variant="secondary" onClick={() => { setEditingAvatar(false); setAvatarUrl(detailUser.avatar_url || ''); }}>Cancelar</Button>
                    </div>
                  </div>
                ) : (
                  <Button size="sm" variant="secondary" onClick={() => setEditingAvatar(true)}>
                    {detailUser.avatar_url ? 'Cambiar foto' : 'Agregar foto'}
                  </Button>
                )}
              </div>
            </div>
            <p><span className="text-zinc-500">Nombre:</span> {detailUser.name}</p>
            <p><span className="text-zinc-500">Email:</span> {detailUser.email}</p>
            <p><span className="text-zinc-500">Telefono:</span> {detailUser.phone || '-'}</p>
            <p><span className="text-zinc-500">Rol:</span> {detailUser.role}</p>
            <p><span className="text-zinc-500">Estado:</span> {detailUser.active ? 'Activo' : 'Inactivo'}</p>
            {detailUser.birth_date && (
              <p><span className="text-zinc-500">Nacimiento:</span> {new Date(detailUser.birth_date).toLocaleDateString('es-CL')}</p>
            )}
            {detailUser.sex && (
              <p><span className="text-zinc-500">Sexo:</span> {detailUser.sex === 'M' ? 'Masculino' : 'Femenino'}</p>
            )}
            {(detailUser.weight_kg ?? 0) > 0 && (
              <p><span className="text-zinc-500">Peso:</span> {detailUser.weight_kg} kg</p>
            )}
            {(detailUser.height_cm ?? 0) > 0 && (
              <p><span className="text-zinc-500">Estatura:</span> {detailUser.height_cm} cm</p>
            )}
            <p><span className="text-zinc-500">Invitaciones:</span> {detailUser.invitation_classes ?? 0}</p>
            <p className="text-sm text-zinc-500">Creado: {detailUser.created_at ? new Date(detailUser.created_at).toLocaleString() : '-'}</p>
            <div className="flex gap-2 pt-4 flex-wrap">
              <Button size="sm" variant="secondary" onClick={async () => {
                try {
                  const updated = await api.addInvitation(detailUser.id, 1);
                  setDetailUser(updated);
                  loadUsers();
                } catch (err) { alert('Error al agregar invitacion'); }
              }}>+1 Invitacion</Button>
              <Button size="sm" variant="secondary" onClick={() => toggleActive(detailUser)}>{detailUser.active ? 'Desactivar' : 'Activar'}</Button>
              <Button size="sm" variant="danger" onClick={() => handleDelete(detailUser.id)} loading={deletingId === detailUser.id}>Eliminar</Button>
              <Button size="sm" variant="secondary" onClick={() => setDetailUser(null)}>Cerrar</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
