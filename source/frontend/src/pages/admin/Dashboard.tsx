import { useState, useEffect } from 'react'
import { stats } from '../../lib/api'
import type { DashboardStats } from '../../types'
import { Card } from '../../components/ui/Card'

function fmtCLP(n: number) { return '$' + n.toLocaleString('es-CL') }

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardStats | null>(null)
  useEffect(() => { stats.dashboard().then(setData) }, [])

  if (!data) return <p className="text-muted text-center py-8">Cargando...</p>

  const cards = [
    { label: 'Total usuarios', value: data.total_users },
    { label: 'Usuarios activos', value: data.active_users },
    { label: 'Nuevos este mes', value: data.new_users_month },
    { label: 'Revenue total', value: fmtCLP(data.total_revenue) },
    { label: 'Revenue mes', value: fmtCLP(data.revenue_month) },
    { label: 'Suscripciones activas', value: data.active_subs },
    { label: 'Clases hoy', value: data.classes_today },
    { label: 'Reservas hoy', value: data.bookings_today },
    { label: 'Asistencia hoy', value: data.attendance_today },
  ]

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Dashboard</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {cards.map(c => (
          <Card key={c.label}>
            <p className="text-sm text-muted">{c.label}</p>
            <p className="text-2xl font-bold">{c.value}</p>
          </Card>
        ))}
      </div>
    </div>
  )
}
