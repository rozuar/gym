import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { users, payments, uploadFile } from '../lib/api'
import type { Subscription } from '../types'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input, Select } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'

function fmtDate(d: string) { return new Date(d).toLocaleDateString('es-CL') }

export default function ProfilePage() {
  const { user, refreshUser } = useAuth()
  const [form, setForm] = useState({ name: '', phone: '', birth_date: '', sex: '', weight_kg: '', height_cm: '' })
  const [sub, setSub] = useState<Subscription | null>(null)
  const [saving, setSaving] = useState(false)
  const [showFreeze, setShowFreeze] = useState(false)
  const [freezeUntil, setFreezeUntil] = useState('')
  const [freezing, setFreezing] = useState(false)

  const loadSub = () => payments.mySubscription().then(r => setSub(r.subscription)).catch(() => {})

  useEffect(() => {
    if (user) setForm({
      name: user.name, phone: user.phone || '',
      birth_date: user.birth_date?.slice(0, 10) || '',
      sex: user.sex || '',
      weight_kg: user.weight_kg ? String(user.weight_kg) : '',
      height_cm: user.height_cm ? String(user.height_cm) : '',
    })
    loadSub()
  }, [user])

  const save = async () => {
    setSaving(true)
    try {
      await users.updateMe({ name: form.name, phone: form.phone } as any)
      await refreshUser()
    } catch (e: any) { alert(e.message) }
    setSaving(false)
  }

  const uploadAvatar = async () => {
    const input = document.createElement('input'); input.type = 'file'; input.accept = 'image/*'
    input.onchange = async () => {
      const f = input.files?.[0]; if (!f) return
      try { const url = await uploadFile(f); await users.updateMe({ avatar_url: url } as any); await refreshUser() }
      catch (e: any) { alert(e.message) }
    }
    input.click()
  }

  const handleFreeze = async () => {
    if (!freezeUntil) return alert('Selecciona fecha')
    setFreezing(true)
    try {
      await payments.freeze(freezeUntil)
      await loadSub()
      setShowFreeze(false)
    } catch (e: any) { alert(e.message) }
    setFreezing(false)
  }

  const handleUnfreeze = async () => {
    if (!confirm('¿Reactivar membresía ahora?')) return
    try {
      await payments.unfreeze()
      await loadSub()
    } catch (e: any) { alert(e.message) }
  }

  if (!user) return null

  // Min freeze date: tomorrow
  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1)
  const minFreeze = tomorrow.toISOString().slice(0, 10)
  // Max: 3 months from now
  const maxFreeze = new Date(); maxFreeze.setMonth(maxFreeze.getMonth() + 3)
  const maxFreezeStr = maxFreeze.toISOString().slice(0, 10)

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Perfil</h2>
      <Card className="mb-4">
        <div className="flex items-center gap-4 mb-4">
          <button onClick={uploadAvatar} className="w-16 h-16 rounded-full bg-border flex items-center justify-center text-2xl font-bold hover:opacity-80">
            {user.avatar_url ? <img src={user.avatar_url} className="w-16 h-16 rounded-full object-cover" alt="" /> : user.name[0]?.toUpperCase()}
          </button>
          <div><p className="font-semibold">{user.name}</p><p className="text-sm text-muted">{user.email}</p></div>
        </div>
        <div className="space-y-3">
          <Input placeholder="Nombre" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          <Input placeholder="Telefono" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
          <Input type="date" value={form.birth_date} onChange={e => setForm(f => ({ ...f, birth_date: e.target.value }))} />
          <Select value={form.sex} onChange={e => setForm(f => ({ ...f, sex: e.target.value }))}>
            <option value="">Sexo</option><option value="M">Masculino</option><option value="F">Femenino</option>
          </Select>
          <div className="flex gap-2">
            <Input type="number" placeholder="Peso (kg)" value={form.weight_kg} onChange={e => setForm(f => ({ ...f, weight_kg: e.target.value }))} />
            <Input type="number" placeholder="Altura (cm)" value={form.height_cm} onChange={e => setForm(f => ({ ...f, height_cm: e.target.value }))} />
          </div>
          <Button className="w-full" onClick={save} disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</Button>
        </div>
      </Card>

      {sub && (
        <Card className="mb-4">
          <h3 className="font-semibold mb-2">Suscripción</h3>
          {sub.frozen ? (
            <div className="rounded-lg bg-warning/10 border border-warning/30 px-3 py-2 mb-3">
              <p className="text-sm font-medium text-warning">Membresía congelada</p>
              {sub.frozen_until && (
                <p className="text-xs text-muted mt-0.5">Hasta: {fmtDate(sub.frozen_until)}</p>
              )}
            </div>
          ) : null}
          <p className="text-sm">Plan: <strong>{sub.plan_name}</strong></p>
          <p className="text-sm text-muted">Clases: {sub.classes_used}/{sub.classes_allowed || '∞'}</p>
          <p className="text-sm text-muted">Vence: {fmtDate(sub.end_date)}</p>
          <div className="mt-3">
            {sub.frozen ? (
              <Button variant="secondary" className="w-full text-sm" onClick={handleUnfreeze}>
                Reactivar membresía
              </Button>
            ) : (
              <Button variant="secondary" className="w-full text-sm" onClick={() => setShowFreeze(true)}>
                Congelar membresía
              </Button>
            )}
          </div>
        </Card>
      )}

      <div className="flex gap-2">
        <Link to="/prs" className="flex-1"><Button variant="secondary" className="w-full">Mis PRs</Button></Link>
        <Link to="/plans" className="flex-1"><Button variant="secondary" className="w-full">Planes</Button></Link>
      </div>

      <Modal open={showFreeze} onClose={() => setShowFreeze(false)} title="Congelar membresía">
        <div className="space-y-3">
          <p className="text-sm text-muted">
            Tu membresía se pausará y la fecha de vencimiento se extenderá automáticamente. Máximo 3 meses.
          </p>
          <div>
            <label className="text-xs text-muted block mb-1">Congelar hasta</label>
            <Input
              type="date"
              min={minFreeze}
              max={maxFreezeStr}
              value={freezeUntil}
              onChange={e => setFreezeUntil(e.target.value)}
            />
          </div>
          <Button className="w-full" onClick={handleFreeze} disabled={freezing}>
            {freezing ? 'Procesando...' : 'Confirmar congelamiento'}
          </Button>
        </div>
      </Modal>
    </div>
  )
}
