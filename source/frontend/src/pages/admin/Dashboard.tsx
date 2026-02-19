import { useState, useEffect } from 'react'
import { stats } from '../../lib/api'
import type { DashboardStats, RetentionAlert } from '../../types'
import { Card } from '../../components/ui/Card'

function fmtCLP(n: number) { return '$' + n.toLocaleString('es-CL') }

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardStats | null>(null)
  const [retention, setRetention] = useState<RetentionAlert[]>([])
  const [retDays, setRetDays] = useState(30)
  const [showRetention, setShowRetention] = useState(false)

  useEffect(() => { stats.dashboard().then(setData) }, [])

  useEffect(() => {
    if (!showRetention) return
    stats.retention(retDays).then(r => setRetention(r.alerts || []))
  }, [showRetention, retDays])

  if (!data) return <p className="text-muted text-center py-8">Cargando...</p>

  const cards = [
    { label: 'Total usuarios', value: data.total_users },
    { label: 'Usuarios activos', value: data.active_users },
    { label: 'Nuevos este mes', value: data.new_users_month },
    { label: 'Revenue total', value: fmtCLP(data.total_revenue) },
    { label: 'Revenue mes', value: fmtCLP(data.revenue_month) },
    { label: 'MRR', value: fmtCLP(data.mrr), highlight: true },
    { label: 'Suscripciones activas', value: data.active_subs },
    { label: 'Churn rate', value: `${data.churn_rate?.toFixed(1) ?? 0}%` },
    { label: 'Nuevos leads', value: data.new_leads ?? 0 },
    { label: 'Clases hoy', value: data.classes_today },
    { label: 'Reservas hoy', value: data.bookings_today },
    { label: 'Asistencia hoy', value: data.attendance_today },
  ]

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Dashboard</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        {cards.map(c => (
          <Card key={c.label}>
            <p className="text-sm text-muted">{c.label}</p>
            <p className={`text-2xl font-bold ${(c as any).highlight ? 'text-accent' : ''}`}>{c.value}</p>
          </Card>
        ))}
      </div>

      {/* Alertas de retención */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">Alertas de retención</h3>
          <div className="flex items-center gap-2">
            <select
              value={retDays}
              onChange={e => setRetDays(Number(e.target.value))}
              className="text-xs bg-bg border border-border rounded px-2 py-1"
            >
              <option value={14}>14 días</option>
              <option value={30}>30 días</option>
              <option value={60}>60 días</option>
              <option value={90}>90 días</option>
            </select>
            <button
              onClick={() => setShowRetention(s => !s)}
              className="text-xs text-accent hover:underline"
            >
              {showRetention ? 'Ocultar' : 'Ver inactivos'}
            </button>
          </div>
        </div>

        {!showRetention ? (
          <p className="text-sm text-muted">Usuarios sin actividad en los últimos {retDays} días.</p>
        ) : retention.length === 0 ? (
          <p className="text-sm text-muted">No hay usuarios inactivos por más de {retDays} días.</p>
        ) : (
          <div className="space-y-2">
            {retention.map(a => (
              <div key={a.user_id} className="flex items-center justify-between text-sm border-b border-border/50 pb-2">
                <div>
                  <p className="font-medium">{a.user_name}</p>
                  <p className="text-xs text-muted">{a.user_email}</p>
                </div>
                <div className="text-right">
                  <span className={`text-xs font-medium ${a.days_inactive >= 60 ? 'text-danger' : a.days_inactive >= 30 ? 'text-warning' : 'text-muted'}`}>
                    {a.days_inactive >= 9999 ? 'Nunca activo' : `${a.days_inactive} días`}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
