import { useState, useEffect } from 'react'
import { movements as movementsApi } from '../../lib/api'
import type { Movement } from '../../types'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Modal } from '../../components/ui/Modal'
import { Input, Textarea, Select } from '../../components/ui/Input'

const CATEGORIES = ['olympic', 'gymnastics', 'monostructural', 'strength', 'other']
const CAT_LABELS: Record<string, string> = {
  olympic: 'Olímpico', gymnastics: 'Gimnasia', monostructural: 'Monoestructural',
  strength: 'Fuerza', other: 'Otro',
}

type Form = {
  name: string; description: string; category: string
  video_url: string; muscles_primary: string; muscles_secondary: string; active: boolean
}
const emptyForm = (): Form => ({ name: '', description: '', category: 'other', video_url: '', muscles_primary: '', muscles_secondary: '', active: true })

export default function AdminMovements() {
  const [items, setItems] = useState<Movement[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [form, setForm] = useState<Form>(emptyForm())

  const load = () => {
    setLoading(true)
    movementsApi.list(filter || undefined, search || undefined, false)
      .then(r => setItems(r.movements || []))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [filter, search])

  const openNew = () => { setEditId(null); setForm(emptyForm()); setShowForm(true) }
  const openEdit = (m: Movement) => {
    setEditId(m.id)
    setForm({ name: m.name, description: m.description, category: m.category, video_url: m.video_url, muscles_primary: m.muscles_primary, muscles_secondary: m.muscles_secondary, active: m.active })
    setShowForm(true)
  }

  const submit = async () => {
    if (!form.name.trim()) return alert('Nombre requerido')
    try {
      if (editId) await movementsApi.update(editId, form)
      else await movementsApi.create(form)
      setShowForm(false); load()
    } catch (e: any) { alert(e.message) }
  }

  const del = async (id: number) => {
    if (!confirm('Eliminar movimiento?')) return
    await movementsApi.remove(id); load()
  }

  const f = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }))

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Biblioteca de Movimientos</h2>
        <Button size="sm" onClick={openNew}>+ Movimiento</Button>
      </div>
      <div className="flex gap-2 mb-4">
        <Input placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} className="flex-1" />
        <Select value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="">Todas las categorías</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{CAT_LABELS[c]}</option>)}
        </Select>
      </div>
      {loading ? <p className="text-muted text-center py-8">Cargando...</p> : items.length === 0 ? (
        <p className="text-muted text-center py-8">Sin movimientos</p>
      ) : (
        <div className="grid md:grid-cols-2 gap-2">
          {items.map(m => (
            <Card key={m.id}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium">{m.name}</span>
                    <Badge variant="default">{CAT_LABELS[m.category] || m.category}</Badge>
                    {!m.active && <Badge variant="danger">Inactivo</Badge>}
                  </div>
                  {m.muscles_primary && <p className="text-xs text-muted mt-0.5">💪 {m.muscles_primary}</p>}
                  {m.description && <p className="text-xs text-muted mt-0.5 truncate">{m.description}</p>}
                  {m.video_url && <a href={m.video_url} target="_blank" rel="noopener noreferrer" className="text-xs text-accent hover:underline">▶ Video</a>}
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => openEdit(m)} className="text-xs text-muted hover:text-white">Editar</button>
                  <button onClick={() => del(m.id)} className="text-xs text-danger">Eliminar</button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
      <Modal open={showForm} onClose={() => setShowForm(false)} title={editId ? 'Editar movimiento' : 'Nuevo movimiento'}>
        <div className="space-y-3">
          <Input placeholder="Nombre *" value={form.name} onChange={f('name')} />
          <Select value={form.category} onChange={f('category')}>
            {CATEGORIES.map(c => <option key={c} value={c}>{CAT_LABELS[c]}</option>)}
          </Select>
          <Textarea placeholder="Descripción" value={form.description} onChange={f('description')} rows={2} />
          <Input placeholder="URL de video (YouTube, etc.)" value={form.video_url} onChange={f('video_url')} />
          <Input placeholder="Músculos primarios (ej: glúteos, isquios)" value={form.muscles_primary} onChange={f('muscles_primary')} />
          <Input placeholder="Músculos secundarios (ej: core, espada)" value={form.muscles_secondary} onChange={f('muscles_secondary')} />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.active} onChange={e => setForm(p => ({ ...p, active: e.target.checked }))} />
            Activo
          </label>
          <Button className="w-full" onClick={submit}>Guardar</Button>
        </div>
      </Modal>
    </div>
  )
}
