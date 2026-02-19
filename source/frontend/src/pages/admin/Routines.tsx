import { useState, useEffect } from 'react'
import { routines as routApi } from '../../lib/api'
import type { Routine } from '../../types'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input, Select, Textarea } from '../../components/ui/Input'
import { Badge } from '../../components/ui/Badge'
import { Modal } from '../../components/ui/Modal'

const types = ['', 'wod', 'strength', 'skill', 'cardio']

export default function AdminRoutines() {
  const [items, setItems] = useState<Routine[]>([])
  const [loading, setLoading] = useState(true)
  const [typeFilter, setTypeFilter] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ id: 0, name: '', description: '', type: 'wod', content: '', content_scaled: '', content_beginner: '', duration: 0, difficulty: '' })

  const load = () => { setLoading(true); routApi.list(typeFilter || undefined).then(r => setItems(r.routines || [])).finally(() => setLoading(false)) }
  useEffect(load, [typeFilter])

  const save = async () => {
    try {
      if (form.id) await routApi.update(form.id, { name: form.name, description: form.description, type: form.type, content: form.content, content_scaled: form.content_scaled, content_beginner: form.content_beginner, duration: form.duration || undefined, difficulty: form.difficulty } as any)
      else await routApi.create({ name: form.name, description: form.description, type: form.type, content: form.content, content_scaled: form.content_scaled, content_beginner: form.content_beginner, duration: form.duration || undefined, difficulty: form.difficulty } as any)
      setShowForm(false); load()
    } catch (e: any) { alert(e.message) }
  }

  const del = async (id: number) => { if (!confirm('Eliminar rutina?')) return; await routApi.remove(id); load() }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Rutinas</h2>
        <Button size="sm" onClick={() => { setForm({ id: 0, name: '', description: '', type: 'wod', content: '', content_scaled: '', content_beginner: '', duration: 0, difficulty: '' }); setShowForm(true) }}>+ Nueva</Button>
      </div>
      <div className="flex gap-2 mb-4">
        {types.map(t => (
          <button key={t} onClick={() => setTypeFilter(t)} className={`px-3 py-1 rounded-lg text-sm ${typeFilter === t ? 'bg-accent text-white' : 'bg-card text-muted'}`}>
            {t || 'Todas'}
          </button>
        ))}
      </div>
      {loading ? <p className="text-muted text-center py-8">Cargando...</p> : (
        <div className="space-y-2">
          {items.map(r => (
            <Card key={r.id} className="cursor-pointer" onClick={() => { setForm({ id: r.id, name: r.name, description: r.description, type: r.type, content: r.content, content_scaled: r.content_scaled || '', content_beginner: r.content_beginner || '', duration: r.duration, difficulty: r.difficulty }); setShowForm(true) }}>
              <div className="flex items-center justify-between">
                <div><p className="font-medium">{r.name}</p><p className="text-sm text-muted">{r.creator_name}</p></div>
                <div className="flex items-center gap-2">
                  <Badge>{r.type}</Badge>
                  <Button size="sm" variant="danger" onClick={e => { e.stopPropagation(); del(r.id) }}>X</Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
      <Modal open={showForm} onClose={() => setShowForm(false)} title={form.id ? 'Editar rutina' : 'Nueva rutina'}>
        <div className="space-y-3">
          <Input placeholder="Nombre" value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} />
          <Textarea placeholder="Descripcion" value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} rows={2} />
          <Select value={form.type} onChange={e => setForm(f => ({...f, type: e.target.value}))}>
            <option value="wod">WOD</option><option value="strength">Strength</option><option value="skill">Skill</option><option value="cardio">Cardio</option>
          </Select>
          <Textarea placeholder="Contenido del WOD (Rx)" value={form.content} onChange={e => setForm(f => ({...f, content: e.target.value}))} rows={5} />
          <Textarea placeholder="Versión Scaled (opcional)" value={form.content_scaled} onChange={e => setForm(f => ({...f, content_scaled: e.target.value}))} rows={3} />
          <Textarea placeholder="Versión Beginner (opcional)" value={form.content_beginner} onChange={e => setForm(f => ({...f, content_beginner: e.target.value}))} rows={3} />
          <Input type="number" placeholder="Duracion (min)" value={form.duration || ''} onChange={e => setForm(f => ({...f, duration: Number(e.target.value)}))} />
          <Select value={form.difficulty} onChange={e => setForm(f => ({...f, difficulty: e.target.value}))}>
            <option value="">Dificultad</option><option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option><option value="rx">Rx</option>
          </Select>
          <Button className="w-full" onClick={save}>Guardar</Button>
        </div>
      </Modal>
    </div>
  )
}
