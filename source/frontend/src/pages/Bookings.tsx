import { useState, useEffect } from 'react'
import { bookings, uploadFile } from '../lib/api'
import type { Booking } from '../types'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'

function fmt(d: string) { const p = new Date(d); return `${p.getDate().toString().padStart(2,'0')}/${(p.getMonth()+1).toString().padStart(2,'0')}/${p.getFullYear()}` }
const statusV: Record<string, 'success' | 'warning' | 'danger' | 'default'> = { booked: 'success', attended: 'success', cancelled: 'danger', no_show: 'warning' }

export default function BookingsPage() {
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming')
  const [items, setItems] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)

  const load = () => { setLoading(true); bookings.mine(tab === 'upcoming').then(r => setItems(r.bookings || [])).finally(() => setLoading(false)) }
  useEffect(load, [tab])

  const cancel = async (id: number) => { if (!confirm('Cancelar reserva?')) return; try { await bookings.cancel(id); load() } catch (e: any) { alert(e.message) } }

  const uploadPhoto = async (id: number) => {
    const input = document.createElement('input'); input.type = 'file'; input.accept = 'image/*'
    input.onchange = async () => { const f = input.files?.[0]; if (!f) return; try { const url = await uploadFile(f); await bookings.beforePhoto(id, url); load() } catch (e: any) { alert(e.message) } }
    input.click()
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Reservas</h2>
      <div className="flex gap-2 mb-4">
        {(['upcoming', 'past'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-lg text-sm ${tab === t ? 'bg-accent text-white' : 'bg-card text-muted'}`}>
            {t === 'upcoming' ? 'Proximas' : 'Anteriores'}
          </button>
        ))}
      </div>
      {loading ? <p className="text-muted text-center py-8">Cargando...</p> : items.length === 0 ? (
        <p className="text-muted text-center py-8">No hay reservas</p>
      ) : (
        <div className="space-y-3">
          {items.map(b => (
            <Card key={b.id} className="flex items-center justify-between">
              <div>
                <p className="font-medium">{b.class_name}</p>
                <p className="text-sm text-muted">{b.schedule_date ? fmt(b.schedule_date) : ''} {b.start_time}</p>
                <Badge variant={statusV[b.status] || 'default'}>{b.status}</Badge>
              </div>
              <div className="flex gap-2">
                {b.status === 'booked' && tab === 'upcoming' && (
                  <>
                    <Button size="sm" variant="ghost" onClick={() => uploadPhoto(b.id)} title="Foto antes">📷</Button>
                    <Button size="sm" variant="danger" onClick={() => cancel(b.id)}>Cancelar</Button>
                  </>
                )}
                {b.before_photo_url && <span className="text-success text-xs">Foto ✓</span>}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
