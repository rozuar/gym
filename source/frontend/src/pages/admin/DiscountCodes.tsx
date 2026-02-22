import { useState, useEffect } from 'react'
import { discountCodes as api } from '../../lib/api'
import type { DiscountCode } from '../../types'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input, Select } from '../../components/ui/Input'
import { Badge } from '../../components/ui/Badge'
import { Modal } from '../../components/ui/Modal'
import { toast } from 'sonner'

function fmtCLP(n: number) { return '$' + n.toLocaleString('es-CL') }

export default function AdminDiscountCodes() {
  const [items, setItems] = useState<DiscountCode[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ code: '', description: '', discount_type: 'percent' as 'percent' | 'amount', discount_value: 0, max_uses: 0, valid_until: '' })

  const load = () => { setLoading(true); api.list().then(r => setItems(r.codes || [])).finally(() => setLoading(false)) }
  useEffect(load, [])

  const save = async () => {
    if (!form.code || !form.discount_value) return toast.error('Código y valor requeridos')
    try {
      await api.create({ code: form.code.toUpperCase(), description: form.description, discount_type: form.discount_type, discount_value: form.discount_value, max_uses: form.max_uses, valid_until: form.valid_until || undefined } as any)
      setShowForm(false); load()
    } catch (e: any) { toast.error(e.message) }
  }

  const del = async (id: number) => {
    if (!confirm('Desactivar código?')) return
    await api.remove(id); load()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Códigos de descuento</h2>
        <Button size="sm" onClick={() => { setForm({ code: '', description: '', discount_type: 'percent', discount_value: 0, max_uses: 0, valid_until: '' }); setShowForm(true) }}>+ Nuevo</Button>
      </div>
      {loading ? <p className="text-muted text-center py-8">Cargando...</p> : items.length === 0 ? (
        <p className="text-muted text-center py-8">Sin códigos creados</p>
      ) : (
        <div className="space-y-2">
          {items.map(c => (
            <Card key={c.id} className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold">{c.code}</span>
                  <Badge variant={c.active ? 'success' : 'danger'}>{c.active ? 'Activo' : 'Inactivo'}</Badge>
                </div>
                <p className="text-sm text-muted">
                  {c.discount_type === 'percent' ? `${c.discount_value}% descuento` : `${fmtCLP(c.discount_value)} descuento`}
                  {c.max_uses > 0 && ` · ${c.uses_count}/${c.max_uses} usos`}
                  {c.valid_until && ` · hasta ${new Date(c.valid_until).toLocaleDateString('es-CL')}`}
                </p>
                {c.description && <p className="text-xs text-muted">{c.description}</p>}
              </div>
              {c.active && (
                <Button size="sm" variant="danger" onClick={() => del(c.id)}>Desactivar</Button>
              )}
            </Card>
          ))}
        </div>
      )}

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Nuevo código de descuento">
        <div className="space-y-3">
          <Input
            placeholder="Código (ej: BIENVENIDO20)"
            value={form.code}
            onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
          />
          <Input placeholder="Descripción (opcional)" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          <Select value={form.discount_type} onChange={e => setForm(f => ({ ...f, discount_type: e.target.value as 'percent' | 'amount' }))}>
            <option value="percent">Porcentaje (%)</option>
            <option value="amount">Monto fijo (CLP)</option>
          </Select>
          <Input
            type="number"
            placeholder={form.discount_type === 'percent' ? 'Descuento (1-100)' : 'Descuento (CLP)'}
            value={form.discount_value || ''}
            onChange={e => setForm(f => ({ ...f, discount_value: Number(e.target.value) }))}
          />
          <Input
            type="number"
            placeholder="Máximo de usos (0=ilimitado)"
            value={form.max_uses || ''}
            onChange={e => setForm(f => ({ ...f, max_uses: Number(e.target.value) }))}
          />
          <div>
            <label className="text-xs text-muted block mb-1">Válido hasta (opcional)</label>
            <Input type="date" value={form.valid_until} onChange={e => setForm(f => ({ ...f, valid_until: e.target.value }))} />
          </div>
          <Button className="w-full" onClick={save}>Crear código</Button>
        </div>
      </Modal>
    </div>
  )
}
