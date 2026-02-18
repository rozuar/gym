import { useState, useEffect } from 'react'
import { payments as payApi, users as usersApi, plans as plansApi, uploadFile } from '../../lib/api'
import type { Payment, User, Plan } from '../../types'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Select } from '../../components/ui/Input'
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
  const [form, setForm] = useState({ user_id: 0, plan_id: 0, payment_method: 'efectivo', proof_image_url: '' })

  const load = () => { setLoading(true); payApi.listAll().then(r => setItems(r.payments || [])).finally(() => setLoading(false)) }
  useEffect(() => { load(); usersApi.list().then(r => setUsersList(r.users || [])); plansApi.list().then(r => setPlansList(r.plans || [])) }, [])

  const save = async () => {
    try { await payApi.create({ user_id: form.user_id, plan_id: form.plan_id, payment_method: form.payment_method, proof_image_url: form.proof_image_url || undefined }); setShowForm(false); load() } catch (e: any) { alert(e.message) }
  }

  const uploadProof = async () => {
    const input = document.createElement('input'); input.type = 'file'; input.accept = 'image/*'
    input.onchange = async () => { const f = input.files?.[0]; if (!f) return; try { const url = await uploadFile(f); setForm(prev => ({...prev, proof_image_url: url})) } catch (e: any) { alert(e.message) } }
    input.click()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Pagos</h2>
        <Button size="sm" onClick={() => { setForm({ user_id: 0, plan_id: 0, payment_method: 'efectivo', proof_image_url: '' }); setShowForm(true) }}>+ Registrar</Button>
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
          <Select value={form.user_id} onChange={e => setForm(f => ({...f, user_id: Number(e.target.value)}))}>
            <option value={0}>Seleccionar usuario</option>
            {usersList.map(u => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
          </Select>
          <Select value={form.plan_id} onChange={e => setForm(f => ({...f, plan_id: Number(e.target.value)}))}>
            <option value={0}>Seleccionar plan</option>
            {plansList.filter(p => p.active).map(p => <option key={p.id} value={p.id}>{p.name} - {fmtCLP(p.price)}</option>)}
          </Select>
          <Select value={form.payment_method} onChange={e => setForm(f => ({...f, payment_method: e.target.value}))}>
            <option value="efectivo">Efectivo</option><option value="debito">Debito</option><option value="transferencia">Transferencia</option>
          </Select>
          {form.payment_method === 'transferencia' && (
            <div className="flex gap-2 items-center">
              <Button variant="secondary" size="sm" onClick={uploadProof}>Subir comprobante</Button>
              {form.proof_image_url && <span className="text-success text-xs">Subido ✓</span>}
            </div>
          )}
          <Button className="w-full" onClick={save}>Registrar pago</Button>
        </div>
      </Modal>
    </div>
  )
}
