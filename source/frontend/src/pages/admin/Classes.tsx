import { useState, useEffect } from 'react'
import { classes as classesApi, disciplines as discApi, instructors as instApi } from '../../lib/api'
import type { ClassItem, Discipline, Instructor } from '../../types'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input, Select, Textarea } from '../../components/ui/Input'
import { Badge } from '../../components/ui/Badge'
import { Modal } from '../../components/ui/Modal'
import { toast } from 'sonner'

const dayNames = ['Domingo','Lunes','Martes','Miercoles','Jueves','Viernes','Sabado']

export default function AdminClasses() {
  const [discs, setDiscs] = useState<Discipline[]>([])
  const [cls, setCls] = useState<ClassItem[]>([])
  const [insts, setInsts] = useState<Instructor[]>([])
  const [loading, setLoading] = useState(true)
  const [showDisc, setShowDisc] = useState(false)
  const [discForm, setDiscForm] = useState({ id: 0, name: '', description: '', color: '#3b82f6', active: true })
  const [showClass, setShowClass] = useState(false)
  const [classForm, setClassForm] = useState({ id: 0, discipline_id: 0, name: '', description: '', day_of_week: 1, start_time: '07:00', end_time: '08:00', capacity: 20, instructor_ids: [] as number[] })

  const load = () => {
    setLoading(true)
    Promise.all([discApi.list(), classesApi.list(), instApi.list()])
      .then(([d, c, i]) => { setDiscs(d.disciplines || []); setCls(c.classes || []); setInsts((i as any).instructors || []) })
      .finally(() => setLoading(false))
  }
  useEffect(load, [])

  const saveDisc = async () => {
    try {
      if (discForm.id) await discApi.update(discForm.id, { name: discForm.name, description: discForm.description, color: discForm.color, active: discForm.active } as any)
      else await discApi.create({ name: discForm.name, description: discForm.description, color: discForm.color } as any)
      setShowDisc(false); load()
    } catch (e: any) { toast.error(e.message) }
  }

  const saveClass = async () => {
    try {
      if (classForm.id) await classesApi.update(classForm.id, { name: classForm.name, description: classForm.description, start_time: classForm.start_time, end_time: classForm.end_time, capacity: classForm.capacity, instructor_ids: classForm.instructor_ids } as any)
      else await classesApi.create({ discipline_id: classForm.discipline_id, name: classForm.name, description: classForm.description, day_of_week: classForm.day_of_week, start_time: classForm.start_time, end_time: classForm.end_time, capacity: classForm.capacity, instructor_ids: classForm.instructor_ids } as any)
      setShowClass(false); load()
    } catch (e: any) { toast.error(e.message) }
  }

  const delDisc = async (id: number) => { if (!confirm('Eliminar disciplina?')) return; await discApi.remove(id); load() }
  const delClass = async (id: number) => { if (!confirm('Eliminar clase?')) return; await classesApi.remove(id); load() }

  if (loading) return <p className="text-muted text-center py-8">Cargando...</p>

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-bold">Disciplinas</h2>
          <Button size="sm" onClick={() => { setDiscForm({ id: 0, name: '', description: '', color: '#3b82f6', active: true }); setShowDisc(true) }}>+ Nueva</Button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {discs.map(d => (
            <Card key={d.id} className="cursor-pointer" onClick={() => { setDiscForm({ id: d.id, name: d.name, description: d.description, color: d.color, active: d.active }); setShowDisc(true) }}>
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} /><span className="font-medium">{d.name}</span></div>
              {!d.active && <Badge variant="danger" className="mt-1">Inactiva</Badge>}
            </Card>
          ))}
        </div>
      </div>
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-bold">Clases</h2>
          <Button size="sm" onClick={() => { setClassForm({ id: 0, discipline_id: discs[0]?.id || 0, name: '', description: '', day_of_week: 1, start_time: '07:00', end_time: '08:00', capacity: 20, instructor_ids: [] }); setShowClass(true) }}>+ Nueva</Button>
        </div>
        <div className="space-y-2">
          {cls.map(c => (
            <Card key={c.id} className="flex items-center justify-between cursor-pointer" onClick={() => { setClassForm({ id: c.id, discipline_id: c.discipline_id, name: c.name, description: c.description, day_of_week: c.day_of_week, start_time: c.start_time, end_time: c.end_time, capacity: c.capacity, instructor_ids: c.instructor_ids || [] }); setShowClass(true) }}>
              <div><p className="font-medium">{c.name}</p><p className="text-sm text-muted">{c.discipline_name} &middot; {dayNames[c.day_of_week]} {c.start_time}-{c.end_time} &middot; Cap: {c.capacity}</p></div>
              <Button size="sm" variant="danger" onClick={e => { e.stopPropagation(); delClass(c.id) }}>X</Button>
            </Card>
          ))}
        </div>
      </div>
      <Modal open={showDisc} onClose={() => setShowDisc(false)} title={discForm.id ? 'Editar disciplina' : 'Nueva disciplina'}>
        <div className="space-y-3">
          <Input placeholder="Nombre" value={discForm.name} onChange={e => setDiscForm(f => ({...f, name: e.target.value}))} />
          <Textarea placeholder="Descripcion" value={discForm.description} onChange={e => setDiscForm(f => ({...f, description: e.target.value}))} rows={2} />
          <Input type="color" value={discForm.color} onChange={e => setDiscForm(f => ({...f, color: e.target.value}))} />
          {discForm.id > 0 && <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={discForm.active} onChange={e => setDiscForm(f => ({...f, active: e.target.checked}))} /> Activa</label>}
          <div className="flex gap-2">
            <Button className="flex-1" onClick={saveDisc}>Guardar</Button>
            {discForm.id > 0 && <Button variant="danger" onClick={() => { delDisc(discForm.id); setShowDisc(false) }}>Eliminar</Button>}
          </div>
        </div>
      </Modal>
      <Modal open={showClass} onClose={() => setShowClass(false)} title={classForm.id ? 'Editar clase' : 'Nueva clase'}>
        <div className="space-y-3">
          <Input placeholder="Nombre" value={classForm.name} onChange={e => setClassForm(f => ({...f, name: e.target.value}))} />
          <Textarea placeholder="Descripcion" value={classForm.description} onChange={e => setClassForm(f => ({...f, description: e.target.value}))} rows={2} />
          <Select value={classForm.discipline_id} onChange={e => setClassForm(f => ({...f, discipline_id: Number(e.target.value)}))}>
            {discs.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </Select>
          {!classForm.id && <Select value={classForm.day_of_week} onChange={e => setClassForm(f => ({...f, day_of_week: Number(e.target.value)}))}>
            {dayNames.map((n, i) => <option key={i} value={i}>{n}</option>)}
          </Select>}
          <div className="flex gap-2">
            <Input type="time" value={classForm.start_time} onChange={e => setClassForm(f => ({...f, start_time: e.target.value}))} />
            <Input type="time" value={classForm.end_time} onChange={e => setClassForm(f => ({...f, end_time: e.target.value}))} />
          </div>
          <Input type="number" placeholder="Capacidad" value={classForm.capacity} onChange={e => setClassForm(f => ({...f, capacity: Number(e.target.value)}))} />
          <div><p className="text-sm text-muted mb-1">Instructores</p>
            {insts.map(inst => (<label key={inst.id} className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={classForm.instructor_ids.includes(inst.id)} onChange={e => {
                setClassForm(f => ({...f, instructor_ids: e.target.checked ? [...f.instructor_ids, inst.id] : f.instructor_ids.filter(x => x !== inst.id)}))
              }} />{inst.name}</label>))}
          </div>
          <Button className="w-full" onClick={saveClass}>Guardar</Button>
        </div>
      </Modal>
    </div>
  )
}
