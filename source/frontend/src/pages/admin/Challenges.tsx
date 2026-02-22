import { useState, useEffect } from 'react'
import { challenges as api } from '../../lib/api'
import type { Challenge } from '../../types'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input, Select, Textarea } from '../../components/ui/Input'
import { Badge } from '../../components/ui/Badge'
import { Modal } from '../../components/ui/Modal'
import { toast } from 'sonner'

function fmtDate(d?: string) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('es-CL')
}

const typeLabels: Record<string, string> = {
  custom: 'Personalizado',
  attendance: 'Asistencia',
  score: 'Score',
}

export default function AdminChallenges() {
  const [items, setItems] = useState<Challenge[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ id: 0, name: '', description: '', goal: '', type: 'custom', start_date: '', end_date: '' })

  const load = () => {
    setLoading(true)
    api.list(false).then(r => setItems(r.challenges || [])).finally(() => setLoading(false))
  }
  useEffect(load, [])

  const save = async () => {
    try {
      if (form.id) {
        await api.update(form.id, {
          name: form.name, description: form.description, goal: form.goal,
          type: form.type, start_date: form.start_date || undefined, end_date: form.end_date || undefined,
        })
      } else {
        await api.create({
          name: form.name, description: form.description, goal: form.goal,
          type: form.type, start_date: form.start_date || undefined, end_date: form.end_date || undefined,
        } as any)
      }
      setShowForm(false)
      load()
    } catch (e: any) { toast.error(e.message) }
  }

  const del = async (id: number) => {
    if (!confirm('¿Eliminar challenge?')) return
    try { await api.remove(id); load() } catch (e: any) { toast.error(e.message) }
  }

  const openNew = () => {
    setForm({ id: 0, name: '', description: '', goal: '', type: 'custom', start_date: '', end_date: '' })
    setShowForm(true)
  }

  const openEdit = (c: Challenge) => {
    setForm({
      id: c.id, name: c.name, description: c.description || '', goal: c.goal || '',
      type: c.type,
      start_date: c.start_date ? new Date(c.start_date).toISOString().slice(0, 10) : '',
      end_date: c.end_date ? new Date(c.end_date).toISOString().slice(0, 10) : '',
    })
    setShowForm(true)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Challenges / Retos</h2>
        <Button size="sm" onClick={openNew}>+ Nuevo</Button>
      </div>

      {loading ? (
        <p className="text-muted text-center py-8">Cargando...</p>
      ) : items.length === 0 ? (
        <Card><p className="text-muted text-center py-4">No hay challenges creados</p></Card>
      ) : (
        <div className="space-y-3">
          {items.map(c => (
            <Card key={c.id} className="cursor-pointer" onClick={() => openEdit(c)}>
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold">{c.name}</p>
                    {!c.active && <Badge variant="danger">Inactivo</Badge>}
                    <Badge>{typeLabels[c.type] || c.type}</Badge>
                  </div>
                  {c.description && <p className="text-sm text-muted line-clamp-1">{c.description}</p>}
                  {c.goal && <p className="text-xs text-muted mt-0.5">Meta: {c.goal}</p>}
                  <div className="flex gap-3 mt-1 text-xs text-muted">
                    {c.start_date && <span>Inicio: {fmtDate(c.start_date)}</span>}
                    {c.end_date && <span>Fin: {fmtDate(c.end_date)}</span>}
                    <span>{c.participant_count || 0} participantes</span>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={e => { e.stopPropagation(); del(c.id) }}
                  className="ml-2 shrink-0"
                >
                  X
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={showForm} onClose={() => setShowForm(false)} title={form.id ? 'Editar challenge' : 'Nuevo challenge'}>
        <div className="space-y-3">
          <Input placeholder="Nombre" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          <Textarea placeholder="Descripción" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} />
          <Input placeholder="Meta / objetivo" value={form.goal} onChange={e => setForm(f => ({ ...f, goal: e.target.value }))} />
          <Select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
            <option value="custom">Personalizado</option>
            <option value="attendance">Asistencia</option>
            <option value="score">Score / Resultado</option>
          </Select>
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-xs text-muted block mb-1">Fecha inicio</label>
              <Input type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} />
            </div>
            <div className="flex-1">
              <label className="text-xs text-muted block mb-1">Fecha fin</label>
              <Input type="date" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} />
            </div>
          </div>
          <Button className="w-full" onClick={save}>Guardar</Button>
        </div>
      </Modal>
    </div>
  )
}
