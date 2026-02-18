import { useState, useEffect } from 'react'
import { tv } from '../lib/api'
import type { TVSchedule } from '../types'

export default function TVDisplay() {
  const [schedules, setSchedules] = useState<TVSchedule[]>([])
  const [date, setDate] = useState('')
  const [clock, setClock] = useState(new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', second: '2-digit' }))

  const load = () => { tv.today().then(r => { setSchedules(r.schedules || []); setDate(r.date) }).catch(() => {}) }

  useEffect(() => {
    load()
    const interval = setInterval(load, 60000)
    const clockInterval = setInterval(() => setClock(new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', second: '2-digit' })), 1000)
    return () => { clearInterval(interval); clearInterval(clockInterval) }
  }, [])

  return (
    <div className="min-h-screen bg-bg text-white p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-bold">Box Magic</h1>
        <div className="text-right">
          <p className="text-5xl font-bold font-mono">{clock}</p>
          <p className="text-xl text-muted">{date ? new Date(date + 'T12:00:00').toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' }) : ''}</p>
        </div>
      </div>
      {schedules.length === 0 ? (
        <p className="text-3xl text-muted text-center py-20">No hay clases programadas hoy</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {schedules.map(s => (
            <div key={s.id} className="bg-card border border-border rounded-2xl p-6">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-2xl font-bold">{s.class_name}</h2>
                <span className="text-xl text-accent font-mono">{s.start_time}</span>
              </div>
              <p className="text-lg text-muted mb-2">{s.discipline_name} &middot; {s.booked}/{s.capacity}</p>
              {s.routine_name && (
                <div className="mb-3">
                  <p className="text-sm text-muted uppercase tracking-wider">WOD</p>
                  <p className="text-lg font-semibold">{s.routine_name}</p>
                  {s.routine_content && <p className="text-sm text-muted mt-1 whitespace-pre-line line-clamp-4">{s.routine_content}</p>}
                </div>
              )}
              {s.leaderboard && s.leaderboard.length > 0 && (
                <div>
                  <p className="text-sm text-muted uppercase tracking-wider mb-1">Top 5</p>
                  {s.leaderboard.map((e, i) => (
                    <div key={e.user_id} className="flex items-center justify-between py-1 text-lg">
                      <span><span className={`font-bold ${i < 3 ? 'text-accent' : 'text-muted'}`}>{i+1}.</span> {e.user_name}{e.rx ? ' Rx' : ''}</span>
                      <span className="font-bold">{e.score}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
