import { useState, useEffect } from 'react'
import { plans as plansApi } from '../../lib/api'
import type { Plan } from '../../types'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input, Textarea } from '../../components/ui/Input'
import { Badge } from '../../components/ui/Badge'
import { Modal } from '../../components/ui/Modal'

function fmtCLP(n: number) { return '$' + n.toLocaleString('es-CL') }

export default function AdminPlans() {
  const [items, setItems] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ id: 0, name: '', description: '', price: 0, duration: 30, max_classes: 0, active: true })

  const load = () => { setLoading(true); plansApi.list().then(r => setItems(r.plans || [])).finally(() => setLoading(false)) }
  useEffect(load, [])

  const save = async () => {
    try {
      if (form.id) await plansApi.update(form.id, { name: form.name, description: form.description, price: form.price, duration: form.duration, max_classes: form.max_classes, active: form.active } as any)
      else await plansApi.create({ name: form.name, description: form.description, price: form.price, duration: form.duration, max_classes: form.max_classes } as any)
      setShowForm(false); load()
    } catch (e: any) { alert(e.message) }
  }

  const del = async (id: number) => { if (!confirm('Eliminar plan?')) return; await plansApi.remove(id); load() }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Planes</h2>
        <Button size="sm" onClick={() => { setForm({ id: 0, name: '', description: '', price: 0, duration: 30, max_classes: 0, active: true }); setShowForm(true) }}>+ Nuevo</Button>
      </div>
      {loading ? <p className="text-muted text-center py-8">Cargando...</p> : (
        <div className="space-y-2">
          {items.map(p => (
            <Card key={p.id} className="flex items-center justify-between cursor-pointer" onClick={() => { setForm({ id: p.id, name: p.name, description: p.description, price: p.price, duration: p.duration, max_classes: p.max_classes, active: p.active }); setShowForm(true) }}>
              <div>
                <p className="font-medium">{p.name}</p>
                <p className="text-sm text-muted">{fmtCLP(p.price)} &middot; {p.duration} dias &middot; {p.max_classes === 0 ? 'Ilimitado' : `${p.max_classes} clases`}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={p.active ? 'success' : 'danger'}>{p.active ? 'Activo' : 'Inactivo'}</Badge>
                <Button size="sm" variant="danger" onClick={e => { e.stopPropagation(); del(p.id) }}>X</Button>
              </div>
            </Card>
          ))}
        </div>
      )}
      <Modal open={showForm} onClose={() => setShowForm(false)} title={form.id ? 'Editar plan' : 'Nuevo plan'}>
        <div className="space-y-3">
          <Input placeholder="Nombre" value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} />
          <Textarea placeholder="Descripcion" value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} rows={2} />
          <Input type="number" placeholder="Precio (CLP)" value={form.price || ''} onChange={e => setForm(f => ({...f, price: Number(e.target.value)}))} />
          <Input type="number" placeholder="Duracion (dias)" value={form.duration} onChange={e => setForm(f => ({...f, duration: Number(e.target.value)}))} />
          <Input type="number" placeholder="Max clases (0=ilimitado)" value={form.max_classes} onChange={e => setForm(f => ({...f, max_classes: Number(e.target.value)}))} />
          {form.id > 0 && <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.active} onChange={e => setForm(f => ({...f, active: e.target.checked}))} /> Activo</label>}
          <Button className="w-full" onClick={save}>Guardar</Button>
        </div>
      </Modal>
    </div>
  )
}
