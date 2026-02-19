import { useState, useEffect } from 'react'
import { events as eventsApi } from '../lib/api'
import type { GymEvent } from '../types'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'

function fmtDate(d: string) { return new Date(d).toLocaleString('es-CL', { dateStyle: 'long', timeStyle: 'short' }) }
function fmtCLP(n: number) { return '$' + n.toLocaleString('es-CL') }

const TYPE_LABELS: Record<string, string> = {
  event: 'Evento', competition: 'Competencia', seminar: 'Seminario', workshop: 'Workshop',
}

export default function EventsPage() {
  const [items, setItems] = useState<GymEvent[]>([])
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    eventsApi.list(true).then(r => setItems(r.events || [])).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const register = async (e: GymEvent) => {
    try {
      if (e.is_registered) {
        if (!confirm('¿Cancelar inscripción?')) return
        await eventsApi.unregister(e.id)
      } else {
        await eventsApi.register(e.id)
      }
      load()
    } catch (err: any) { alert(err.message) }
  }

  if (loading && items.length === 0) return <p className="text-muted text-center py-8">Cargando...</p>

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Eventos</h2>
      {items.length === 0 ? (
        <p className="text-muted text-center py-8">Sin eventos próximos</p>
      ) : (
        <div className="space-y-3">
          {items.map(e => {
            const full = e.capacity > 0 && e.registered_count >= e.capacity && !e.is_registered
            return (
              <Card key={e.id}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-semibold">{e.title}</span>
                      <Badge variant="default">{TYPE_LABELS[e.event_type] || e.event_type}</Badge>
                      {e.is_registered && <Badge variant="success">Inscrito</Badge>}
                      {full && <Badge variant="danger">Lleno</Badge>}
                    </div>
                    <p className="text-sm text-muted">{fmtDate(e.date)}</p>
                    <p className="text-xs text-muted mt-0.5">
                      {e.registered_count} inscriptos{e.capacity > 0 ? ` / ${e.capacity}` : ''}
                      {e.price > 0 ? ` · ${fmtCLP(e.price)} ${e.currency}` : ' · Gratuito'}
                    </p>
                    {e.description && <p className="text-sm text-muted mt-1">{e.description}</p>}
                  </div>
                  <Button
                    size="sm"
                    variant={e.is_registered ? 'secondary' : 'primary'}
                    disabled={full}
                    onClick={() => register(e)}
                    className="shrink-0"
                  >
                    {e.is_registered ? 'Cancelar' : full ? 'Lleno' : 'Inscribirse'}
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
