import { useState, useEffect } from 'react'
import { schedules as schedApi, bookings as bookApi, waitlist as wlApi, routines as routApi } from '../../lib/api'
import type { Schedule, BookingWithUser, WaitlistEntry, Routine } from '../../types'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input, Select } from '../../components/ui/Input'
import { Badge } from '../../components/ui/Badge'
import { Modal } from '../../components/ui/Modal'

function fmt(d: string) { const p = new Date(d); return `${p.getDate().toString().padStart(2,'0')}/${(p.getMonth()+1).toString().padStart(2,'0')}` }

export default function AdminSchedules() {
  const [items, setItems] = useState<Schedule[]>([])
  const [loading, setLoading] = useState(true)
  const [from, setFrom] = useState(() => new Date().toISOString().slice(0,10))
  const [to, setTo] = useState(() => { const d = new Date(); d.setDate(d.getDate()+7); return d.toISOString().slice(0,10) })
  const [attModal, setAttModal] = useState<Schedule | null>(null)
  const [attBookings, setAttBookings] = useState<BookingWithUser[]>([])
  const [wlEntries, setWlEntries] = useState<WaitlistEntry[]>([])
  const [attTab, setAttTab] = useState<'bookings' | 'waitlist' | 'routine'>('bookings')
  const [routineList, setRoutineList] = useState<Routine[]>([])
  const [selRoutine, setSelRoutine] = useState(0)

  const load = () => { setLoading(true); schedApi.list(from, to, true).then(r => setItems(r.schedules || [])).finally(() => setLoading(false)) }
  useEffect(load, [from, to])

  const generate = async () => { try { await schedApi.generate(from); load() } catch (e: any) { alert(e.message) } }
  const cancel = async (id: number) => { if (!confirm('Cancelar clase?')) return; try { await schedApi.cancel(id); load() } catch (e: any) { alert(e.message) } }

  const openAtt = async (s: Schedule) => {
    setAttModal(s); setAttTab('bookings')
    const [att, wl] = await Promise.all([schedApi.attendance(s.id), wlApi.get(s.id).catch(() => ({ waitlist: [] }))])
    setAttBookings(att.bookings || [])
    setWlEntries(wl.waitlist || [])
    routApi.list().then(r => setRoutineList(r.routines || []))
  }

  const checkin = async (id: number) => { try { await bookApi.checkin(id); if (attModal) openAtt(attModal) } catch (e: any) { alert(e.message) } }

  const assignRoutine = async () => {
    if (!attModal || !selRoutine) return
    try { await routApi.assignToSchedule(attModal.id, selRoutine); alert('Rutina asignada') } catch (e: any) { alert(e.message) }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Horarios</h2>
        <Button size="sm" onClick={generate}>Generar semana</Button>
      </div>
      <div className="flex gap-2 mb-4">
        <Input type="date" value={from} onChange={e => setFrom(e.target.value)} />
        <Input type="date" value={to} onChange={e => setTo(e.target.value)} />
      </div>
      {loading ? <p className="text-muted text-center py-8">Cargando...</p> : items.length === 0 ? (
        <p className="text-muted text-center py-8">Sin horarios</p>
      ) : (
        <div className="space-y-2">
          {items.map(s => (
            <Card key={s.id} className="flex items-center justify-between cursor-pointer" onClick={() => openAtt(s)}>
              <div>
                <p className="font-medium">{s.class_name}</p>
                <p className="text-sm text-muted">{fmt(s.date)} {s.start_time}-{s.end_time} &middot; {s.booked}/{s.capacity}</p>
              </div>
              <div className="flex items-center gap-2">
                {s.cancelled && <Badge variant="danger">Cancelada</Badge>}
                {!s.cancelled && <Button size="sm" variant="danger" onClick={e => { e.stopPropagation(); cancel(s.id) }}>Cancelar</Button>}
              </div>
            </Card>
          ))}
        </div>
      )}
      <Modal open={!!attModal} onClose={() => setAttModal(null)} title={`${attModal?.class_name} - ${attModal ? fmt(attModal.date) : ''}`}>
        <div className="flex gap-2 mb-4">
          {(['bookings', 'waitlist', 'routine'] as const).map(t => (
            <button key={t} onClick={() => setAttTab(t)} className={`px-3 py-1 rounded text-sm ${attTab === t ? 'bg-accent text-white' : 'bg-border text-muted'}`}>
              {t === 'bookings' ? 'Asistencia' : t === 'waitlist' ? 'Waitlist' : 'Rutina'}
            </button>
          ))}
        </div>
        {attTab === 'bookings' && (
          <div className="space-y-2">
            {attBookings.length === 0 ? <p className="text-muted text-sm">Sin reservas</p> : attBookings.map(b => (
              <div key={b.id} className="flex items-center justify-between py-2 border-b border-border/50">
                <div><p className="text-sm font-medium">{b.user_name}</p><Badge variant={b.status === 'attended' ? 'success' : b.status === 'cancelled' ? 'danger' : 'default'}>{b.status}</Badge></div>
                {b.status === 'booked' && <Button size="sm" onClick={() => checkin(b.id)}>Check-in</Button>}
              </div>
            ))}
          </div>
        )}
        {attTab === 'waitlist' && (
          <div className="space-y-2">
            {wlEntries.length === 0 ? <p className="text-muted text-sm">Waitlist vacia</p> : wlEntries.map(w => (
              <div key={w.id} className="flex items-center justify-between py-2 border-b border-border/50">
                <span className="text-sm">#{w.position} {w.user_name}</span>
              </div>
            ))}
          </div>
        )}
        {attTab === 'routine' && (
          <div className="space-y-3">
            <Select value={selRoutine} onChange={e => setSelRoutine(Number(e.target.value))}>
              <option value={0}>Seleccionar rutina</option>
              {routineList.map(r => <option key={r.id} value={r.id}>{r.name} ({r.type})</option>)}
            </Select>
            <Button className="w-full" onClick={assignRoutine}>Asignar rutina</Button>
          </div>
        )}
      </Modal>
    </div>
  )
}
