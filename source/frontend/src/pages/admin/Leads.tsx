import { useState, useEffect } from 'react'
import { leads } from '../../lib/api'
import type { Lead } from '../../types'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Modal } from '../../components/ui/Modal'
import { Input, Select, Textarea } from '../../components/ui/Input'

const STATUSES = ['new', 'contacted', 'trial', 'converted', 'lost'] as const
const STATUS_LABELS: Record<string, string> = {
  new: 'Nuevo', contacted: 'Contactado', trial: 'Trial', converted: 'Convertido', lost: 'Perdido'
}
const STATUS_VARIANTS: Record<string, 'default' | 'success' | 'warning' | 'danger'> = {
  new: 'default', contacted: 'warning', trial: 'warning', converted: 'success', lost: 'danger'
}

const SOURCES = ['web', 'instagram', 'referral', 'walk_in', 'other'] as const
const SOURCE_LABELS: Record<string, string> = {
  web: 'Web', instagram: 'Instagram', referral: 'Referido', walk_in: 'Presencial', other: 'Otro'
}

type Form = {
  name: string; email: string; phone: string
  source: string; status: string; notes: string
}

const emptyForm = (): Form => ({ name: '', email: '', phone: '', source: 'other', status: 'new', notes: '' })

function fmt(d: string) { const p = new Date(d); return p.toLocaleDateString('es-CL') }

export default function AdminLeads() {
  const [items, setItems] = useState<Lead[]>([])
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [filterStatus, setFilterStatus] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [form, setForm] = useState<Form>(emptyForm())

  const load = (status = filterStatus) => {
    setLoading(true)
    leads.list(status || undefined).then(r => {
      setItems(r.leads || [])
      if (r.counts) setCounts(r.counts)
    }).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [filterStatus])

  const openNew = () => { setEditId(null); setForm(emptyForm()); setShowForm(true) }
  const openEdit = (l: Lead) => {
    setEditId(l.id)
    setForm({ name: l.name, email: l.email || '', phone: l.phone || '', source: l.source, status: l.status, notes: l.notes || '' })
    setShowForm(true)
  }

  const submit = async () => {
    if (!form.name.trim()) return alert('Nombre requerido')
    try {
      if (editId) await leads.update(editId, form)
      else await leads.create(form)
      setShowForm(false); load()
    } catch (e: any) { alert(e.message) }
  }

  const del = async (id: number) => {
    if (!confirm('Eliminar lead?')) return
    await leads.remove(id); load()
  }

  const quickStatus = async (id: number, status: string) => {
    await leads.update(id, { status })
    load()
  }

  const f = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }))

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Pipeline de Leads</h2>
        <Button size="sm" onClick={openNew}>+ Nuevo lead</Button>
      </div>

      {/* Counts por status */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <button
          onClick={() => setFilterStatus('')}
          className={`px-3 py-1 rounded text-sm transition-colors ${filterStatus === '' ? 'bg-accent text-white' : 'bg-border text-muted hover:text-white'}`}
        >
          Todos ({Object.values(counts).reduce((a, b) => a + b, 0)})
        </button>
        {STATUSES.map(s => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`px-3 py-1 rounded text-sm transition-colors ${filterStatus === s ? 'bg-accent text-white' : 'bg-border text-muted hover:text-white'}`}
          >
            {STATUS_LABELS[s]} ({counts[s] || 0})
          </button>
        ))}
      </div>

      {loading && items.length === 0 ? (
        <p className="text-muted text-center py-8">Cargando...</p>
      ) : items.length === 0 ? (
        <p className="text-muted text-center py-8">Sin leads{filterStatus ? ` con estado "${STATUS_LABELS[filterStatus]}"` : ''}</p>
      ) : (
        <div className="space-y-2">
          {items.map(l => (
            <Card key={l.id}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium">{l.name}</span>
                    <Badge variant={STATUS_VARIANTS[l.status]}>{STATUS_LABELS[l.status]}</Badge>
                    <span className="text-xs text-muted">{SOURCE_LABELS[l.source]}</span>
                  </div>
                  {(l.email || l.phone) && (
                    <p className="text-xs text-muted mt-0.5">{[l.email, l.phone].filter(Boolean).join(' · ')}</p>
                  )}
                  {l.notes && <p className="text-xs text-muted mt-1 italic truncate">{l.notes}</p>}
                  <p className="text-xs text-muted mt-1">{fmt(l.created_at)}</p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => openEdit(l)} className="text-xs text-muted hover:text-white">Editar</button>
                  <button onClick={() => del(l.id)} className="text-xs text-danger">Eliminar</button>
                </div>
              </div>
              {/* Quick status actions */}
              {l.status !== 'converted' && l.status !== 'lost' && (
                <div className="flex gap-1 mt-2 flex-wrap">
                  {l.status === 'new' && <button onClick={() => quickStatus(l.id, 'contacted')} className="text-xs bg-warning/20 text-warning px-2 py-0.5 rounded">→ Contactado</button>}
                  {l.status === 'contacted' && <button onClick={() => quickStatus(l.id, 'trial')} className="text-xs bg-warning/20 text-warning px-2 py-0.5 rounded">→ Trial</button>}
                  {(l.status === 'contacted' || l.status === 'trial') && <button onClick={() => quickStatus(l.id, 'converted')} className="text-xs bg-success/20 text-success px-2 py-0.5 rounded">→ Convertido</button>}
                  <button onClick={() => quickStatus(l.id, 'lost')} className="text-xs bg-danger/20 text-danger px-2 py-0.5 rounded">→ Perdido</button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      <Modal open={showForm} onClose={() => setShowForm(false)} title={editId ? 'Editar lead' : 'Nuevo lead'}>
        <div className="space-y-3">
          <Input placeholder="Nombre *" value={form.name} onChange={f('name')} />
          <Input placeholder="Email" value={form.email} onChange={f('email')} type="email" />
          <Input placeholder="Teléfono" value={form.phone} onChange={f('phone')} />
          <Select value={form.source} onChange={f('source')}>
            {SOURCES.map(s => <option key={s} value={s}>{SOURCE_LABELS[s]}</option>)}
          </Select>
          <Select value={form.status} onChange={f('status')}>
            {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
          </Select>
          <Textarea placeholder="Notas" value={form.notes} onChange={f('notes')} rows={3} />
          <Button className="w-full" onClick={submit}>Guardar</Button>
        </div>
      </Modal>
    </div>
  )
}
