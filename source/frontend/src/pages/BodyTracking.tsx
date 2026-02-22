import { useState, useEffect } from 'react'
import { bodyTracking } from '../lib/api'
import type { BodyMeasurement } from '../types'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input, Textarea } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { toast } from 'sonner'

function fmt(d: string) {
  const p = new Date(d + 'T00:00:00')
  return `${p.getDate().toString().padStart(2,'0')}/${(p.getMonth()+1).toString().padStart(2,'0')}/${p.getFullYear()}`
}

type Form = {
  weight_kg: string; body_fat_pct: string
  chest_cm: string; waist_cm: string; hip_cm: string
  arm_cm: string; thigh_cm: string
  notes: string; measured_at: string
}

const emptyForm = (): Form => ({
  weight_kg: '', body_fat_pct: '',
  chest_cm: '', waist_cm: '', hip_cm: '',
  arm_cm: '', thigh_cm: '',
  notes: '', measured_at: new Date().toISOString().slice(0, 10),
})

function WeightChart({ measurements }: { measurements: BodyMeasurement[] }) {
  const data = measurements
    .filter(m => m.weight_kg != null)
    .slice(0, 15)
    .reverse()

  if (data.length < 2) return null

  const weights = data.map(m => m.weight_kg!)
  const min = Math.min(...weights) - 1
  const max = Math.max(...weights) + 1
  const range = max - min || 1
  const W = 300, H = 80, PAD = 8
  const pts = data.map((_, i) => {
    const x = PAD + (i / (data.length - 1)) * (W - PAD * 2)
    const y = H - PAD - ((weights[i] - min) / range) * (H - PAD * 2)
    return `${x},${y}`
  })

  return (
    <div className="mt-2">
      <p className="text-xs text-muted mb-1">Peso (últimos {data.length} registros)</p>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full rounded bg-bg/50">
        <polyline fill="none" stroke="var(--color-accent)" strokeWidth="1.5" points={pts.join(' ')} />
        {data.map((m, i) => {
          const x = PAD + (i / (data.length - 1)) * (W - PAD * 2)
          const y = H - PAD - ((weights[i] - min) / range) * (H - PAD * 2)
          return <circle key={i} cx={x} cy={y} r="2.5" fill="var(--color-accent)" />
        })}
        <text x={pts[pts.length-1].split(',')[0]} y={Number(pts[pts.length-1].split(',')[1]) - 5} fill="white" fontSize="9" textAnchor="middle">
          {weights[weights.length-1]} kg
        </text>
      </svg>
    </div>
  )
}

export default function BodyTrackingPage() {
  const [items, setItems] = useState<BodyMeasurement[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Form>(emptyForm())

  const load = () => {
    setLoading(true)
    bodyTracking.list(30).then(r => setItems(r.measurements || [])).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const f = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }))

  const submit = async () => {
    const payload: Record<string, unknown> = { measured_at: form.measured_at }
    if (form.weight_kg) payload.weight_kg = parseFloat(form.weight_kg)
    if (form.body_fat_pct) payload.body_fat_pct = parseFloat(form.body_fat_pct)
    if (form.chest_cm) payload.chest_cm = parseFloat(form.chest_cm)
    if (form.waist_cm) payload.waist_cm = parseFloat(form.waist_cm)
    if (form.hip_cm) payload.hip_cm = parseFloat(form.hip_cm)
    if (form.arm_cm) payload.arm_cm = parseFloat(form.arm_cm)
    if (form.thigh_cm) payload.thigh_cm = parseFloat(form.thigh_cm)
    if (form.notes) payload.notes = form.notes
    try {
      await bodyTracking.create(payload as any)
      setShowForm(false); setForm(emptyForm()); load()
    } catch (e: any) { toast.error(e.message) }
  }

  const del = async (id: number) => {
    if (!confirm('Eliminar medición?')) return
    await bodyTracking.remove(id); load()
  }

  const latest = items[0]

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Body Tracking</h2>
        <Button size="sm" onClick={() => { setForm(emptyForm()); setShowForm(true) }}>+ Medición</Button>
      </div>

      {latest && (
        <Card className="mb-4">
          <p className="text-sm text-muted mb-2">Última medición — {fmt(latest.measured_at)}</p>
          <div className="grid grid-cols-3 gap-2 text-center">
            {latest.weight_kg != null && <div><p className="text-2xl font-bold">{latest.weight_kg}</p><p className="text-xs text-muted">kg</p></div>}
            {latest.body_fat_pct != null && <div><p className="text-2xl font-bold">{latest.body_fat_pct}%</p><p className="text-xs text-muted">grasa</p></div>}
            {latest.waist_cm != null && <div><p className="text-2xl font-bold">{latest.waist_cm}</p><p className="text-xs text-muted">cintura cm</p></div>}
          </div>
          <WeightChart measurements={items} />
        </Card>
      )}

      {loading && items.length === 0 ? (
        <p className="text-muted text-center py-8">Cargando...</p>
      ) : items.length === 0 ? (
        <p className="text-muted text-center py-8">Sin mediciones aún. Agrega la primera.</p>
      ) : (
        <div className="space-y-2">
          {items.map(m => (
            <Card key={m.id}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium">{fmt(m.measured_at)}</span>
                <button onClick={() => del(m.id)} className="text-xs text-danger">Eliminar</button>
              </div>
              <div className="grid grid-cols-4 gap-1 text-xs text-muted">
                {m.weight_kg != null && <span>Peso: <b className="text-white">{m.weight_kg}kg</b></span>}
                {m.body_fat_pct != null && <span>Grasa: <b className="text-white">{m.body_fat_pct}%</b></span>}
                {m.chest_cm != null && <span>Pecho: <b className="text-white">{m.chest_cm}cm</b></span>}
                {m.waist_cm != null && <span>Cintura: <b className="text-white">{m.waist_cm}cm</b></span>}
                {m.hip_cm != null && <span>Cadera: <b className="text-white">{m.hip_cm}cm</b></span>}
                {m.arm_cm != null && <span>Brazo: <b className="text-white">{m.arm_cm}cm</b></span>}
                {m.thigh_cm != null && <span>Muslo: <b className="text-white">{m.thigh_cm}cm</b></span>}
              </div>
              {m.notes && <p className="text-xs text-muted mt-1 italic">{m.notes}</p>}
            </Card>
          ))}
        </div>
      )}

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Nueva medición">
        <div className="space-y-3">
          <Input type="date" value={form.measured_at} onChange={f('measured_at')} />
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="Peso (kg)" value={form.weight_kg} onChange={f('weight_kg')} type="number" step="0.1" />
            <Input placeholder="% Grasa" value={form.body_fat_pct} onChange={f('body_fat_pct')} type="number" step="0.1" />
            <Input placeholder="Pecho (cm)" value={form.chest_cm} onChange={f('chest_cm')} type="number" step="0.1" />
            <Input placeholder="Cintura (cm)" value={form.waist_cm} onChange={f('waist_cm')} type="number" step="0.1" />
            <Input placeholder="Cadera (cm)" value={form.hip_cm} onChange={f('hip_cm')} type="number" step="0.1" />
            <Input placeholder="Brazo (cm)" value={form.arm_cm} onChange={f('arm_cm')} type="number" step="0.1" />
            <Input placeholder="Muslo (cm)" value={form.thigh_cm} onChange={f('thigh_cm')} type="number" step="0.1" />
          </div>
          <Textarea placeholder="Notas" value={form.notes} onChange={f('notes')} rows={2} />
          <Button className="w-full" onClick={submit}>Guardar</Button>
        </div>
      </Modal>
    </div>
  )
}
