import { useState, useEffect } from 'react'
import { feed } from '../lib/api'
import type { FeedEvent } from '../types'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'

function timeAgo(d: string) {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000)
  if (s < 60) return 'ahora'; if (s < 3600) return `${Math.floor(s/60)}m`; if (s < 86400) return `${Math.floor(s/3600)}h`; return `${Math.floor(s/86400)}d`
}
function parseData(json: string) { try { return JSON.parse(json) } catch { return {} } }

export default function FeedPage() {
  const [events, setEvents] = useState<FeedEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [offset, setOffset] = useState(0)

  const load = (off = 0) => {
    setLoading(true)
    feed.get(30, off).then(r => { if (off === 0) setEvents(r.events || []); else setEvents(prev => [...prev, ...(r.events || [])]) }).finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Feed</h2>
      {loading && events.length === 0 ? <p className="text-muted text-center py-8">Cargando...</p> : events.length === 0 ? (
        <p className="text-muted text-center py-8">Sin actividad aun</p>
      ) : (
        <div className="space-y-3">
          {events.map(e => { const data = parseData(e.data_json); return (
            <Card key={e.id} className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-border flex items-center justify-center text-sm font-bold flex-shrink-0">
                {e.avatar_url ? <img src={e.avatar_url} className="w-9 h-9 rounded-full object-cover" alt="" /> : e.user_name[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{e.user_name}</span>
                  <Badge variant={e.event_type === 'pr' ? 'pr' : 'default'}>{e.event_type}</Badge>
                  <span className="text-xs text-muted ml-auto">{timeAgo(e.created_at)}</span>
                </div>
                {data.score && <p className="text-sm mt-1">Score: <strong>{data.score}</strong></p>}
              </div>
            </Card>
          )})}
          <Button variant="secondary" className="w-full" onClick={() => { const o = offset + 30; setOffset(o); load(o) }}>Cargar mas</Button>
        </div>
      )}
    </div>
  )
}
