import { useState, useEffect } from 'react'
import { plans as plansApi } from '../lib/api'
import type { Plan } from '../types'
import { Card } from '../components/ui/Card'

function fmtCLP(n: number) { return '$' + n.toLocaleString('es-CL') }

export default function PlansPage() {
  const [items, setItems] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => { plansApi.list().then(r => setItems((r.plans || []).filter(p => p.active))).finally(() => setLoading(false)) }, [])

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Planes</h2>
      {loading ? <p className="text-muted text-center py-8">Cargando...</p> : items.length === 0 ? (
        <p className="text-muted text-center py-8">No hay planes disponibles</p>
      ) : (
        <div className="space-y-3">
          {items.map(p => (
            <Card key={p.id}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">{p.name}</h3>
                <span className="text-lg font-bold text-accent">{fmtCLP(p.price)}</span>
              </div>
              {p.description && <p className="text-sm text-muted mb-2">{p.description}</p>}
              <div className="flex gap-4 text-xs text-muted">
                <span>{p.duration} dias</span>
                <span>{p.max_classes === 0 ? 'Clases ilimitadas' : `${p.max_classes} clases`}</span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
