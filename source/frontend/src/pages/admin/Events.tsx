import { useState, useEffect } from 'react'
import { events as eventsApi } from '../../lib/api'
import type { GymEvent, EventRegistration } from '../../types'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Modal } from '../../components/ui/Modal'
import { Input, Select, Textarea } from '../../components/ui/Input'

function fmtDate(d: string) { return new Date(d).toLocaleString('es-CL', { dateStyle: 'medium', timeStyle: 'short' }) }
function fmtCLP(n: number) { return '$' + n.toLocaleString('es-CL') }

type Form = {
  title: string; description: string; event_type: string
  date: string; capacity: string; price: string; currency: string
}
const emptyForm = (): Form => ({
  title: '', description: '', event_type: 'event',
  date: '', capacity: '0', price: '0', currency: 'CLP',
})

export default function AdminEvents() {
  const [items, setItems] = useState<GymEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [form, setForm] = useState<Form>(emptyForm())
  const [selectedEvent, setSelectedEvent] = useState<GymEvent | null>(null)
  const [regs, setRegs] = useState<EventRegistration[]>([])

  const load = () => {
    setLoading(true)
    eventsApi.list(false).then(r => setItems(r.events || [])).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const openNew = () => { setEditId(null); setForm(emptyForm()); setShowForm(true) }
  const openEdit = (e: GymEvent) => {
    setEditId(e.id)
    const d = new Date(e.date)
    const local = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}T${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
    setForm({ title: e.title, description: e.description, event_type: e.event_type, date: local, capacity: String(e.capacity), price: String(e.price), currency: e.currency })
    setShowForm(true)
  }

  const submit = async () => {
    if (!form.title.trim() || !form.date) return alert('Título y fecha requeridos')
    const data = { title: form.title, description: form.description, event_type: form.event_type, date: form.date, capacity: Number(form.capacity), price: Number(form.price), currency: form.currency }
    try {
      if (editId) await eventsApi.update(editId, data)
      else await eventsApi.create(data)
      setShowForm(false); load()
    } catch (e: any) { alert(e.message) }
  }

  const del = async (id: number) => {
    if (!confirm('Eliminar evento?')) return
    await eventsApi.remove(id); load()
  }

  const openRegs = async (e: GymEvent) => {
    setSelectedEvent(e)
    const r = await eventsApi.listRegistrations(e.id)
    setRegs(r.registrations || [])
  }

  const togglePaid = async (reg: EventRegistration) => {
    if (!selectedEvent) return
    await eventsApi.updateRegistration(selectedEvent.id, reg.user_id, !reg.paid)
    openRegs(selectedEvent)
  }

  const f = (k: keyof Form) => (ev: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(p => ({ ...p, [k]: ev.target.value }))

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Eventos y Competencias</h2>
        <Button size="sm" onClick={openNew}>+ Evento</Button>
      </div>
      {loading ? <p className="text-muted text-center py-8">Cargando...</p> : items.length === 0 ? (
        <p className="text-muted text-center py-8">Sin eventos</p>
      ) : (
        <div className="space-y-2">
          {items.map(e => (
            <Card key={e.id}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium">{e.title}</span>
                    <Badge variant="default">{e.event_type}</Badge>
                    {!e.active && <Badge variant="danger">Inactivo</Badge>}
                  </div>
                  <p className="text-xs text-muted mt-0.5">{fmtDate(e.date)}</p>
                  <p className="text-xs text-muted">
                    {e.registered_count} inscriptos{e.capacity > 0 ? ` / ${e.capacity}` : ''}{e.price > 0 ? ` · ${fmtCLP(e.price)}` : ' · Gratuito'}
                  </p>
                  {e.description && <p className="text-xs text-muted truncate">{e.description}</p>}
                </div>
                <div className="flex gap-2 shrink-0 flex-wrap justify-end">
                  <button onClick={() => openRegs(e)} className="text-xs text-accent hover:underline">Inscritos</button>
                  <button onClick={() => openEdit(e)} className="text-xs text-muted hover:text-white">Editar</button>
                  <button onClick={() => del(e.id)} className="text-xs text-danger">Eliminar</button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Form modal */}
      <Modal open={showForm} onClose={() => setShowForm(false)} title={editId ? 'Editar evento' : 'Nuevo evento'}>
        <div className="space-y-3">
          <Input placeholder="Título *" value={form.title} onChange={f('title')} />
          <Select value={form.event_type} onChange={f('event_type')}>
            <option value="event">Evento</option>
            <option value="competition">Competencia</option>
            <option value="seminar">Seminario</option>
            <option value="workshop">Workshop</option>
          </Select>
          <Input type="datetime-local" value={form.date} onChange={f('date')} />
          <Textarea placeholder="Descripción" value={form.description} onChange={f('description')} rows={2} />
          <div className="grid grid-cols-3 gap-2">
            <Input placeholder="Capacidad (0=ilimitada)" value={form.capacity} onChange={f('capacity')} type="number" min="0" />
            <Input placeholder="Precio" value={form.price} onChange={f('price')} type="number" min="0" />
            <Select value={form.currency} onChange={f('currency')}>
              <option value="CLP">CLP</option>
              <option value="USD">USD</option>
            </Select>
          </div>
          <Button className="w-full" onClick={submit}>Guardar</Button>
        </div>
      </Modal>

      {/* Registrations panel */}
      <Modal open={!!selectedEvent} onClose={() => setSelectedEvent(null)} title={`Inscritos — ${selectedEvent?.title || ''}`}>
        <div className="space-y-2">
          {regs.length === 0 ? (
            <p className="text-muted text-sm">Sin inscritos aún</p>
          ) : regs.map(reg => (
            <div key={reg.id} className="flex items-center justify-between text-sm border-b border-border/50 pb-2">
              <div>
                <p className="font-medium">{reg.user_name}</p>
                <p className="text-xs text-muted">{reg.user_email}</p>
              </div>
              <button
                onClick={() => togglePaid(reg)}
                className={`text-xs px-2 py-0.5 rounded ${reg.paid ? 'bg-success/20 text-success' : 'bg-border text-muted hover:text-white'}`}
              >
                {reg.paid ? '✓ Pagado' : 'Marcar pagado'}
              </button>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  )
}
