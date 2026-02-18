import { useState, useEffect } from 'react'
import { prs } from '../lib/api'
import type { UserResult } from '../types'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'

function fmt(d: string) { const p = new Date(d); return `${p.getDate().toString().padStart(2,'0')}/${(p.getMonth()+1).toString().padStart(2,'0')}/${p.getFullYear()}` }

export default function PRsPage() {
  const [items, setItems] = useState<UserResult[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => { prs.mine().then(r => setItems(r.prs || [])).finally(() => setLoading(false)) }, [])
  const grouped = items.reduce<Record<string, UserResult[]>>((acc, r) => { (acc[r.routine_name] ||= []).push(r); return acc }, {})

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Personal Records</h2>
      {loading ? <p className="text-muted text-center py-8">Cargando...</p> : Object.keys(grouped).length === 0 ? (
        <p className="text-muted text-center py-8">Sin PRs aun</p>
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([name, list]) => (
            <div key={name}>
              <h3 className="font-semibold text-sm text-muted mb-2">{name}</h3>
              {list.map(r => (
                <Card key={r.id} className="flex items-center justify-between mb-2">
                  <div><span className="text-lg font-bold">{r.score}</span>{r.rx && <Badge variant="warning" className="ml-2">Rx</Badge>}</div>
                  <span className="text-sm text-muted">{fmt(r.created_at)}</span>
                </Card>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
