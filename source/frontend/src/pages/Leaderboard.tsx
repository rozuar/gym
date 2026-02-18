import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { leaderboard as lbApi } from '../lib/api'
import type { LeaderboardEntry } from '../types'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'

export default function LeaderboardPage() {
  const { scheduleId } = useParams()
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!scheduleId) return
    setLoading(true)
    lbApi.get(Number(scheduleId)).then(r => setEntries(r.leaderboard || [])).finally(() => setLoading(false))
  }, [scheduleId])

  if (!scheduleId) return (
    <div><h2 className="text-xl font-bold mb-4">Leaderboard</h2><p className="text-muted text-center py-8">Selecciona una clase desde el horario para ver el ranking</p></div>
  )

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Leaderboard</h2>
      {loading ? <p className="text-muted text-center py-8">Cargando...</p> : entries.length === 0 ? (
        <p className="text-muted text-center py-8">Sin resultados para esta clase</p>
      ) : (
        <div className="space-y-2">
          {entries.map((e, i) => (
            <Card key={e.user_id} className="flex items-center gap-3">
              <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${i < 3 ? 'bg-accent text-white' : 'bg-border'}`}>{i + 1}</span>
              <div className="flex-1">
                <span className="font-medium">{e.user_name}</span>
                {e.rx && <Badge variant="warning" className="ml-2">Rx</Badge>}
                {e.is_pr && <Badge variant="pr" className="ml-1">PR</Badge>}
              </div>
              <span className="font-bold">{e.score}</span>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
