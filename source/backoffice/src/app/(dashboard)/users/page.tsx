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

  const toggleActive = async (user: User) => {
    try {
      await api.updateUser(user.id, { active: !user.active });
      loadUsers();
    } catch (err) {
      alert('Error al actualizar usuario');
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
                <td className="p-4">
                  <Button size="sm" variant="secondary" onClick={() => toggleActive(user)}>
                    {user.active ? 'Desactivar' : 'Activar'}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
