import { useState, useEffect, useCallback } from 'react'
import { payments as payApi, users as usersApi, plans as plansApi, discountCodes, uploadFile } from '../../lib/api'
import type { Payment, User, Plan } from '../../types'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input, Select } from '../../components/ui/Input'
import { Badge } from '../../components/ui/Badge'
import { Modal } from '../../components/ui/Modal'

function fmtCLP(n: number) { return '$' + n.toLocaleString('es-CL') }
function fmt(d: string) { return new Date(d).toLocaleDateString('es-CL') }

export default function AdminPayments() {
  const [items, setItems] = useState<Payment[]>([])
  const [usersList, setUsersList] = useState<User[]>([])
  const [plansList, setPlansList] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ user_id: 0, plan_id: 0, payment_method: 'efectivo', proof_image_url: '', discount_code: '' })
  const [discountInfo, setDiscountInfo] = useState<{ discount_type: string; discount_value: number; description: string } | null>(null)
  const [discountError, setDiscountError] = useState('')
  const [validatingCode, setValidatingCode] = useState(false)

  const load = () => { setLoading(true); payApi.listAll().then(r => setItems(r.payments || [])).finally(() => setLoading(false)) }
  useEffect(() => { load(); usersApi.list().then(r => setUsersList(r.users || [])); plansApi.list().then(r => setPlansList(r.plans || [])) }, [])

  const validateCode = useCallback(async (code: string) => {
    if (!code) { setDiscountInfo(null); setDiscountError(''); return }
    setValidatingCode(true)
    try {
      const res = await discountCodes.validate(code)
      setDiscountInfo(res)
      setDiscountError('')
    } catch {
      setDiscountInfo(null)
      setDiscountError('Código inválido o expirado')
    }
    setValidatingCode(false)
  }, [])

  const selectedPlan = plansList.find(p => p.id === form.plan_id)
  const computeTotal = () => {
    if (!selectedPlan) return null
    let price = selectedPlan.price
    if (discountInfo) {
      if (discountInfo.discount_type === 'percent') price = price * (1 - discountInfo.discount_value / 100)
      else price = Math.max(0, price - discountInfo.discount_value)
    }
    return Math.round(price)
  }

  const save = async () => {
    try {
      await payApi.create({ user_id: form.user_id, plan_id: form.plan_id, payment_method: form.payment_method, proof_image_url: form.proof_image_url || undefined, discount_code: form.discount_code || undefined } as any)
      setShowForm(false); load()
    } catch (e: any) { alert(e.message) }
  }

  const uploadProof = async () => {
    const input = document.createElement('input'); input.type = 'file'; input.accept = 'image/*'
    input.onchange = async () => { const f = input.files?.[0]; if (!f) return; try { const url = await uploadFile(f); setForm(prev => ({ ...prev, proof_image_url: url })) } catch (e: any) { alert(e.message) } }
    input.click()
  }

  const total = computeTotal()

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Pagos</h2>
        <Button size="sm" onClick={() => { setForm({ user_id: 0, plan_id: 0, payment_method: 'efectivo', proof_image_url: '', discount_code: '' }); setDiscountInfo(null); setDiscountError(''); setShowForm(true) }}>+ Registrar</Button>
      </div>
      {loading ? <p className="text-muted text-center py-8">Cargando...</p> : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-muted border-b border-border"><th className="pb-2">Usuario</th><th className="pb-2">Plan</th><th className="pb-2">Monto</th><th className="pb-2">Metodo</th><th className="pb-2">Estado</th><th className="pb-2">Fecha</th></tr></thead>
            <tbody>
              {items.map(p => (
                <tr key={p.id} className="border-b border-border/50">
                  <td className="py-2">{p.user_name}</td><td className="py-2">{p.plan_name}</td>
                  <td className="py-2">{fmtCLP(p.amount)}</td><td className="py-2">{p.payment_method}</td>
                  <td className="py-2"><Badge variant={p.status === 'completed' ? 'success' : 'warning'}>{p.status}</Badge></td>
                  <td className="py-2 text-muted">{fmt(p.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Modal open={showForm} onClose={() => setShowForm(false)} title="Registrar pago">
        <div className="space-y-3">
          <Select value={form.user_id} onChange={e => setForm(f => ({ ...f, user_id: Number(e.target.value) }))}>
            <option value={0}>Seleccionar usuario</option>
            {usersList.map(u => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
          </Select>
          <Select value={form.plan_id} onChange={e => setForm(f => ({ ...f, plan_id: Number(e.target.value) }))}>
            <option value={0}>Seleccionar plan</option>
            {plansList.filter(p => p.active).map(p => (
              <option key={p.id} value={p.id}>
                {p.name} - {fmtCLP(p.price)}
                {p.trial_price && p.trial_days ? ` (trial: ${fmtCLP(p.trial_price)})` : ''}
              </option>
            ))}
          </Select>
          <Select value={form.payment_method} onChange={e => setForm(f => ({ ...f, payment_method: e.target.value }))}>
            <option value="efectivo">Efectivo</option><option value="debito">Debito</option><option value="transferencia">Transferencia</option>
          </Select>
          {form.payment_method === 'transferencia' && (
            <div className="flex gap-2 items-center">
              <Button variant="secondary" size="sm" onClick={uploadProof}>Subir comprobante</Button>
              {form.proof_image_url && <span className="text-success text-xs">Subido ✓</span>}
            </div>
          )}

          {/* Código de descuento */}
          <div>
            <div className="flex gap-2">
              <Input
                placeholder="Código de descuento (opcional)"
                value={form.discount_code}
                onChange={e => { setForm(f => ({ ...f, discount_code: e.target.value.toUpperCase() })); setDiscountInfo(null); setDiscountError('') }}
              />
              <Button size="sm" variant="secondary" onClick={() => validateCode(form.discount_code)} disabled={validatingCode || !form.discount_code}>
                {validatingCode ? '...' : 'Aplicar'}
              </Button>
            </div>
            {discountInfo && (
              <p className="text-xs text-success mt-1">
                ✓ {discountInfo.discount_type === 'percent' ? `${discountInfo.discount_value}% descuento` : `${fmtCLP(discountInfo.discount_value)} descuento`}
                {discountInfo.description ? ` — ${discountInfo.description}` : ''}
              </p>
            )}
            {discountError && <p className="text-xs text-danger mt-1">{discountError}</p>}
          </div>

          {/* Total calculado */}
          {total !== null && (
            <div className="flex justify-between items-center bg-bg rounded-lg px-3 py-2">
              <span className="text-sm text-muted">Total a cobrar</span>
              <span className="font-bold text-lg">{fmtCLP(total)}</span>
            </div>
          )}

          <Button className="w-full" onClick={save}>Registrar pago</Button>
        </div>
      </Modal>
    </div>
  )
}
