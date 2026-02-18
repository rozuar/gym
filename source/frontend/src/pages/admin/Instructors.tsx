import { useState, useEffect } from 'react'
import { instructors as instApi } from '../../lib/api'
import type { Instructor } from '../../types'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input, Textarea } from '../../components/ui/Input'
import { Badge } from '../../components/ui/Badge'
import { Modal } from '../../components/ui/Modal'

export default function AdminInstructors() {
  const [items, setItems] = useState<Instructor[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ id: 0, name: '', email: '', phone: '', specialty: '', bio: '', active: true })

  const load = () => { setLoading(true); instApi.list().then(r => setItems((r as any).instructors || [])).finally(() => setLoading(false)) }
  useEffect(load, [])

  const save = async () => {
    try {
      if (form.id) await instApi.update(form.id, { name: form.name, email: form.email, phone: form.phone, specialty: form.specialty, bio: form.bio, active: form.active } as any)
      else await instApi.create({ name: form.name, email: form.email, phone: form.phone, specialty: form.specialty, bio: form.bio } as any)
      setShowForm(false); load()
    } catch (e: any) { alert(e.message) }
  }

  const del = async (id: number) => { if (!confirm('Eliminar instructor?')) return; await instApi.remove(id); load() }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Instructores</h2>
        <Button size="sm" onClick={() => { setForm({ id: 0, name: '', email: '', phone: '', specialty: '', bio: '', active: true }); setShowForm(true) }}>+ Nuevo</Button>
      </div>
      {loading ? <p className="text-muted text-center py-8">Cargando...</p> : (
        <div className="space-y-2">
          {items.map(i => (
            <Card key={i.id} className="flex items-center justify-between cursor-pointer" onClick={() => { setForm({ id: i.id, name: i.name, email: i.email, phone: i.phone, specialty: i.specialty, bio: i.bio, active: i.active }); setShowForm(true) }}>
              <div><p className="font-medium">{i.name}</p><p className="text-sm text-muted">{i.specialty} &middot; {i.email}</p></div>
              <div className="flex items-center gap-2">
                <Badge variant={i.active ? 'success' : 'danger'}>{i.active ? 'Activo' : 'Inactivo'}</Badge>
                <Button size="sm" variant="danger" onClick={e => { e.stopPropagation(); del(i.id) }}>X</Button>
              </div>
            </Card>
          ))}
        </div>
      )}
      <Modal open={showForm} onClose={() => setShowForm(false)} title={form.id ? 'Editar instructor' : 'Nuevo instructor'}>
        <div className="space-y-3">
          <Input placeholder="Nombre" value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} />
          <Input placeholder="Email" value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} />
          <Input placeholder="Telefono" value={form.phone} onChange={e => setForm(f => ({...f, phone: e.target.value}))} />
          <Input placeholder="Especialidad" value={form.specialty} onChange={e => setForm(f => ({...f, specialty: e.target.value}))} />
          <Textarea placeholder="Bio" value={form.bio} onChange={e => setForm(f => ({...f, bio: e.target.value}))} rows={3} />
          {form.id > 0 && <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.active} onChange={e => setForm(f => ({...f, active: e.target.checked}))} /> Activo</label>}
          <Button className="w-full" onClick={save}>Guardar</Button>
        </div>
      </Modal>
    </div>
  )
}
