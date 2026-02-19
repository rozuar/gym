import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { schedules, bookings, waitlist } from '../lib/api'
import type { Schedule, Booking } from '../types'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'

const dayNames = ['Dom','Lun','Mar','Mie','Jue','Vie','Sab']

interface BoxConfig { booking_window_days?: number; booking_cutoff_hours?: number }

function isBookingClosed(schedDate: string, startTime: string, cutoffHours: number): boolean {
  if (!cutoffHours) return false
  try {
    const classDateTime = new Date(`${schedDate}T${startTime}:00`)
    const cutoff = new Date(classDateTime.getTime() - cutoffHours * 3600 * 1000)
    return new Date() > cutoff
  } catch { return false }
}

export default function SchedulePage() {
  const [dates, setDates] = useState<string[]>([])
  const [selected, setSelected] = useState('')
  const [items, setItems] = useState<Schedule[]>([])
  const [myBookings, setMyBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [boxConfig, setBoxConfig] = useState<BoxConfig>({})
  const navigate = useNavigate()

  useEffect(() => {
    fetch('/api/v1/config').then(r => r.json()).then(setBoxConfig).catch(() => {})
  }, [])

  useEffect(() => {
    const windowDays = boxConfig.booking_window_days || 14
    const totalDays = Math.min(windowDays, 14)
    const d: string[] = []
    const now = new Date()
    for (let i = 0; i < totalDays; i++) {
      const dt = new Date(now)
      dt.setDate(now.getDate() + i)
      d.push(dt.toISOString().slice(0, 10))
    }
    setDates(d)
    if (!selected || !d.includes(selected)) setSelected(d[0] || '')
  }, [boxConfig.booking_window_days])

  const loadDay = (day: string) => {
    setLoading(true)
    Promise.all([
      schedules.list(day, day),
      bookings.mine(true),
    ]).then(([s, b]) => {
      setItems(s.schedules || [])
      setMyBookings(b.bookings || [])
    }).finally(() => setLoading(false))
  }

  useEffect(() => { if (selected) loadDay(selected) }, [selected])

  const isBooked = (id: number) => myBookings.some(b => b.class_schedule_id === id && b.status === 'booked')

  const book = async (id: number) => {
    try { await bookings.create(id); loadDay(selected) } catch (e: any) { alert(e.message) }
  }

  const joinWL = async (id: number) => {
    try { await waitlist.join(id); alert('Agregado a la lista de espera') } catch (e: any) { alert(e.message) }
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Horario</h2>
      <div className="flex gap-2 overflow-x-auto pb-3 mb-4">
        {dates.map(d => {
          const dt = new Date(d + 'T12:00:00')
          return (
            <button key={d} onClick={() => setSelected(d)}
              className={`flex-shrink-0 flex flex-col items-center px-3 py-2 rounded-lg text-sm transition-colors ${selected === d ? 'bg-accent text-white' : 'bg-card text-muted hover:text-white'}`}>
              <span className="text-xs">{dayNames[dt.getDay()]}</span>
              <span className="font-bold">{dt.getDate()}</span>
            </button>
          )
        })}
      </div>
      {loading ? <p className="text-muted text-center py-8">Cargando...</p> : items.length === 0 ? (
        <p className="text-muted text-center py-8">No hay clases este dia</p>
      ) : (
        <div className="space-y-3">
          {items.filter(s => !s.cancelled).map(s => (
            <Card key={s.id} className="flex items-center justify-between">
              <div>
                <p className="font-medium">{s.class_name}</p>
                <p className="text-sm text-muted">{s.discipline_name} &middot; {s.start_time}-{s.end_time}</p>
                <p className="text-xs text-muted">{s.booked}/{s.capacity} reservados</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => navigate(`/leaderboard/${s.id}`)} className="text-muted hover:text-accent text-lg" title="Leaderboard">🏆</button>
                {isBooked(s.id) ? (
                  <Badge variant="success">Reservado</Badge>
                ) : isBookingClosed(s.date, s.start_time, boxConfig.booking_cutoff_hours || 0) ? (
                  <Badge>Cerrado</Badge>
                ) : s.available > 0 ? (
                  <Button size="sm" onClick={() => book(s.id)}>Reservar</Button>
                ) : (
                  <Button size="sm" variant="secondary" onClick={() => joinWL(s.id)}>Waitlist</Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
