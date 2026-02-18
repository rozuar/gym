import { useState, useEffect } from 'react'
import { users as usersApi } from '../../lib/api'
import type { User } from '../../types'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input, Select } from '../../components/ui/Input'
import { Badge } from '../../components/ui/Badge'
import { Modal } from '../../components/ui/Modal'

export default function AdminUsers() {
  const [items, setItems] = useState<User[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [editUser, setEditUser] = useState<User | null>(null)
  const [form, setForm] = useState({ name: '', phone: '', role: 'user', active: true })
  const [invModal, setInvModal] = useState<User | null>(null)
  const [invCount, setInvCount] = useState(1)

  const load = () => { setLoading(true); usersApi.list().then(r => setItems(r.users || [])).finally(() => setLoading(false)) }
  useEffect(load, [])

  const filtered = items.filter(u => u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()))

  const openEdit = (u: User) => { setEditUser(u); setForm({ name: u.name, phone: u.phone || '', role: u.role, active: u.active }) }

  const save = async () => {
    if (!editUser) return
    try { await usersApi.update(editUser.id, { name: form.name, phone: form.phone, role: form.role, active: form.active } as any); setEditUser(null); load() } catch (e: any) { alert(e.message) }
  }

  const addInv = async () => {
    if (!invModal) return
    try { await usersApi.addInvitation(invModal.id, invCount); setInvModal(null); load() } catch (e: any) { alert(e.message) }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Usuarios</h2>
        <span className="text-sm text-muted">{items.length} total</span>
      </div>
      <Input placeholder="Buscar por nombre o email..." value={search} onChange={e => setSearch(e.target.value)} className="mb-4" />
      {loading ? <p className="text-muted text-center py-8">Cargando...</p> : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-muted border-b border-border">
              <th className="pb-2">Nombre</th><th className="pb-2">Email</th><th className="pb-2">Rol</th><th className="pb-2">Estado</th><th className="pb-2">Inv</th><th className="pb-2"></th>
            </tr></thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u.id} className="border-b border-border/50">
                  <td className="py-2">{u.name}</td>
                  <td className="py-2 text-muted">{u.email}</td>
                  <td className="py-2"><Badge variant={u.role === 'admin' ? 'warning' : 'default'}>{u.role}</Badge></td>
                  <td className="py-2"><Badge variant={u.active ? 'success' : 'danger'}>{u.active ? 'Activo' : 'Inactivo'}</Badge></td>
                  <td className="py-2">{u.invitation_classes}</td>
                  <td className="py-2 text-right">
                    <Button size="sm" variant="ghost" onClick={() => openEdit(u)}>Editar</Button>
                    <Button size="sm" variant="ghost" onClick={() => { setInvModal(u); setInvCount(1) }}>+Inv</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Modal open={!!editUser} onClose={() => setEditUser(null)} title="Editar usuario">
        <div className="space-y-3">
          <Input placeholder="Nombre" value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} />
          <Input placeholder="Telefono" value={form.phone} onChange={e => setForm(f => ({...f, phone: e.target.value}))} />
          <Select value={form.role} onChange={e => setForm(f => ({...f, role: e.target.value}))}><option value="user">User</option><option value="admin">Admin</option></Select>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.active} onChange={e => setForm(f => ({...f, active: e.target.checked}))} /> Activo</label>
          <Button className="w-full" onClick={save}>Guardar</Button>
        </div>
      </Modal>
      <Modal open={!!invModal} onClose={() => setInvModal(null)} title={`Invitacion: ${invModal?.name}`}>
        <div className="space-y-3">
          <Input type="number" min={1} value={invCount} onChange={e => setInvCount(Number(e.target.value))} />
          <Button className="w-full" onClick={addInv}>Agregar clases de invitacion</Button>
        </div>
      </Modal>
    </div>
  )
}
