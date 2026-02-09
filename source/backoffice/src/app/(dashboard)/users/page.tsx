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
    setDetailLoading(true);
    try {
      const user = await api.getUser(id);
      setDetailUser(user);
    } catch (err) {
      alert('Error al cargar usuario');
    } finally {
      setDetailLoading(false);
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
              <th className="text-left p-4">Nombre</th>
              <th className="text-left p-4">Email</th>
              <th className="text-left p-4">Teléfono</th>
              <th className="text-left p-4">Rol</th>
              <th className="text-left p-4">Estado</th>
              <th className="text-left p-4">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-t border-zinc-800">
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
            <p><span className="text-zinc-500">Nombre:</span> {detailUser.name}</p>
            <p><span className="text-zinc-500">Email:</span> {detailUser.email}</p>
            <p><span className="text-zinc-500">Teléfono:</span> {detailUser.phone || '-'}</p>
            <p><span className="text-zinc-500">Rol:</span> {detailUser.role}</p>
            <p><span className="text-zinc-500">Estado:</span> {detailUser.active ? 'Activo' : 'Inactivo'}</p>
            <p className="text-sm text-zinc-500">Creado: {detailUser.created_at ? new Date(detailUser.created_at).toLocaleString() : '-'}</p>
            <div className="flex gap-2 pt-4">
              <Button variant="secondary" onClick={() => toggleActive(detailUser)}>{detailUser.active ? 'Desactivar' : 'Activar'}</Button>
              <Button variant="danger" onClick={() => handleDelete(detailUser.id)} loading={deletingId === detailUser.id}>Eliminar</Button>
              <Button variant="secondary" onClick={() => setDetailUser(null)}>Cerrar</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
