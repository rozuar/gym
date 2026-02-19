import { useState, useEffect } from 'react'
import { prs, results as resultsApi } from '../lib/api'
import type { UserResult } from '../types'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(d: string) {
  const p = new Date(d)
  return `${p.getDate().toString().padStart(2, '0')}/${(p.getMonth() + 1).toString().padStart(2, '0')}/${p.getFullYear()}`
}

function fmtShort(d: string) {
  const p = new Date(d)
  return `${p.getDate()}/${p.getMonth() + 1}`
}

function parseScoreValue(score: string): number | null {
  if (!score) return null
  const timeMatch = score.match(/^(\d+):(\d+)(?::(\d+))?$/)
  if (timeMatch) {
    const [, a, b, c] = timeMatch
    if (c) return Number(a) * 3600 + Number(b) * 60 + Number(c)
    return Number(a) * 60 + Number(b)
  }
  const numMatch = score.match(/^([\d.]+)/)
  return numMatch ? parseFloat(numMatch[1]) : null
}

function isTimeScore(score: string): boolean {
  return /^\d+:\d+/.test(score.trim())
}

function fmtSeconds(s: number): string {
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}

// ─── SVG Progress Chart ────────────────────────────────────────────────────────

interface ChartPoint { date: string; value: number; is_pr: boolean; score: string }

function ProgressChart({ points, isTime }: { points: ChartPoint[]; isTime: boolean }) {
  if (points.length < 2) {
    return <p className="text-muted text-center py-6 text-sm">Se necesitan al menos 2 resultados para ver el gráfico.</p>
  }

  const W = 320, H = 120
  const PAD = { t: 12, b: 28, l: 36, r: 12 }
  const cW = W - PAD.l - PAD.r
  const cH = H - PAD.t - PAD.b

  const vals = points.map(p => p.value)
  const minV = Math.min(...vals)
  const maxV = Math.max(...vals)
  const range = maxV - minV || 1

  // For time: lower = better → invert Y so better results appear higher
  const toY = (v: number) => {
    const norm = (v - minV) / range
    return isTime
      ? PAD.t + norm * cH        // time: higher value = lower on chart = worse
      : PAD.t + (1 - norm) * cH  // other: higher value = higher on chart = better
  }
  const toX = (i: number) => PAD.l + (i / (points.length - 1)) * cW

  const polyPoints = points.map((p, i) => `${toX(i)},${toY(p.value)}`).join(' ')

  // Y axis labels (3 ticks)
  const yTicks = isTime
    ? [minV, minV + range / 2, maxV]
    : [maxV, minV + range / 2, minV]
  const yLabels = isTime
    ? [fmtSeconds(minV), fmtSeconds(minV + range / 2), fmtSeconds(maxV)]
    : [String(Math.round(maxV)), String(Math.round(minV + range / 2)), String(Math.round(minV))]

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: '160px' }}>
      {/* Grid lines */}
      {[0, 0.5, 1].map((t, i) => {
        const y = PAD.t + t * cH
        return <line key={i} x1={PAD.l} y1={y} x2={W - PAD.r} y2={y} stroke="#27272a" strokeWidth="1" />
      })}

      {/* Y axis labels */}
      {yTicks.map((v, i) => {
        const y = PAD.t + (i / 2) * cH
        return (
          <text key={i} x={PAD.l - 4} y={y + 4} textAnchor="end" fontSize="9" fill="#71717a">
            {yLabels[i]}
          </text>
        )
      })}

      {/* X axis date labels (first, middle, last) */}
      {[0, Math.floor((points.length - 1) / 2), points.length - 1].map((idx, i) => (
        <text key={i} x={toX(idx)} y={H - 4} textAnchor="middle" fontSize="9" fill="#71717a">
          {fmtShort(points[idx].date)}
        </text>
      ))}

      {/* Line */}
      <polyline fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinejoin="round" points={polyPoints} />

      {/* Dots */}
      {points.map((p, i) => (
        <g key={i}>
          <circle
            cx={toX(i)} cy={toY(p.value)}
            r={p.is_pr ? 5 : 3}
            fill={p.is_pr ? '#f59e0b' : '#3b82f6'}
            stroke={p.is_pr ? '#f59e0b' : '#3b82f6'}
            strokeWidth="1"
          />
          <title>{fmt(p.date)}: {p.score}{p.is_pr ? ' 🏆 PR' : ''}</title>
        </g>
      ))}
    </svg>
  )
}

// ─── Tab: PRs ─────────────────────────────────────────────────────────────────

function PRsTab({ items, onSelectRoutine }: { items: UserResult[]; onSelectRoutine: (id: number) => void }) {
  const grouped = items.reduce<Record<string, UserResult[]>>((acc, r) => {
    (acc[r.routine_name] ||= []).push(r)
    return acc
  }, {})

  if (items.length === 0) return <p className="text-muted text-center py-8">Sin PRs aún</p>

  return (
    <div className="space-y-4">
      {Object.entries(grouped).map(([name, list]) => (
        <div key={name}>
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-sm text-muted">{name}</h3>
            <button
              className="text-xs text-accent hover:underline"
              onClick={() => onSelectRoutine(list[0].routine_id)}
            >
              Ver progresión →
            </button>
          </div>
          {list.map(r => (
            <Card key={r.id} className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold">{r.score}</span>
                <Badge variant="pr">PR</Badge>
                {r.rx && <Badge variant="warning">Rx</Badge>}
              </div>
              <span className="text-sm text-muted">{fmt(r.created_at)}</span>
            </Card>
          ))}
        </div>
      ))}
    </div>
  )
}

// ─── Tab: Progresión ──────────────────────────────────────────────────────────

function ProgresionTab({ prItems, initialRoutineId }: { prItems: UserResult[]; initialRoutineId?: number }) {
  const routineOptions = Array.from(
    new Map(prItems.map(r => [r.routine_id, r.routine_name])).entries()
  )

  const [selectedId, setSelectedId] = useState<number | null>(
    initialRoutineId ?? routineOptions[0]?.[0] ?? null
  )
  const [history, setHistory] = useState<UserResult[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!selectedId) return
    setLoading(true)
    resultsApi.history(selectedId)
      .then(r => setHistory(r.history || []))
      .finally(() => setLoading(false))
  }, [selectedId])

  if (routineOptions.length === 0) {
    return <p className="text-muted text-center py-8">Registra resultados para ver tu progresión.</p>
  }

  // Build chart points: sort chronologically, filter parseable scores
  const chronological = [...history].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
  const chartPoints: ChartPoint[] = chronological
    .map(r => {
      const v = parseScoreValue(r.score)
      return v !== null ? { date: r.created_at, value: v, is_pr: r.is_pr, score: r.score } : null
    })
    .filter((p): p is ChartPoint => p !== null)

  const timeScores = chartPoints.length > 0 && isTimeScore(chartPoints[0].score)
  const selectedName = routineOptions.find(([id]) => id === selectedId)?.[1] ?? ''

  return (
    <div className="space-y-4">
      <select
        value={selectedId ?? ''}
        onChange={e => setSelectedId(Number(e.target.value))}
        className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm"
      >
        {routineOptions.map(([id, name]) => (
          <option key={id} value={id}>{name}</option>
        ))}
      </select>

      {loading ? (
        <p className="text-muted text-center py-6">Cargando...</p>
      ) : (
        <>
          <Card className="p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">{selectedName}</span>
              {timeScores && <span className="text-xs text-muted">menor = mejor</span>}
            </div>
            <ProgressChart points={chartPoints} isTime={timeScores} />
            <div className="flex items-center gap-3 mt-2 text-xs text-muted">
              <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-full bg-accent"></span> resultado</span>
              <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-full bg-warning"></span> PR</span>
              <span className="ml-auto">{history.length} resultados</span>
            </div>
          </Card>

          {history.length > 0 && (
            <div className="space-y-2">
              {[...history].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).map(r => (
                <div key={r.id} className="flex items-center justify-between text-sm border-b border-border pb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{r.score}</span>
                    {r.is_pr && <Badge variant="pr" className="text-xs">PR</Badge>}
                    {r.rx && <Badge variant="warning" className="text-xs">Rx</Badge>}
                  </div>
                  <span className="text-muted">{fmt(r.created_at)}</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ─── Tab: Calculadora ─────────────────────────────────────────────────────────

const PERCENTAGES = [50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100]

function CalculadoraTab() {
  const [rm, setRm] = useState('')
  const [unit, setUnit] = useState('kg')

  const val = parseFloat(rm)
  const valid = !isNaN(val) && val > 0

  return (
    <div className="space-y-4">
      <Card className="p-4 space-y-3">
        <p className="text-sm font-medium">Ingresa tu 1RM</p>
        <div className="flex gap-2">
          <input
            type="number"
            min="0"
            placeholder="Ej: 100"
            value={rm}
            onChange={e => setRm(e.target.value)}
            className="flex-1 bg-bg border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent"
          />
          <select
            value={unit}
            onChange={e => setUnit(e.target.value)}
            className="bg-bg border border-border rounded-lg px-3 py-2 text-sm"
          >
            <option value="kg">kg</option>
            <option value="lb">lb</option>
            <option value="reps">reps</option>
          </select>
        </div>
      </Card>

      {valid && (
        <div className="grid grid-cols-2 gap-2">
          {PERCENTAGES.map(pct => {
            const calc = val * (pct / 100)
            const rounded = unit === 'reps' ? Math.round(calc) : Math.round(calc * 2) / 2
            const isKey = [70, 75, 80, 85, 90].includes(pct)
            return (
              <Card
                key={pct}
                className={`flex items-center justify-between px-3 py-2 ${isKey ? 'border-accent/30' : ''}`}
              >
                <span className={`text-sm font-medium ${pct === 100 ? 'text-accent' : isKey ? 'text-white' : 'text-muted'}`}>
                  {pct}%
                </span>
                <span className={`font-bold ${pct === 100 ? 'text-accent' : ''}`}>
                  {rounded} <span className="text-xs font-normal text-muted">{unit}</span>
                </span>
              </Card>
            )
          })}
        </div>
      )}

      {valid && (
        <Card className="p-3 space-y-1 text-sm">
          <p className="font-medium text-muted text-xs mb-2">REFERENCIAS COMUNES</p>
          <div className="flex justify-between"><span className="text-muted">Calentamiento (60%)</span><span className="font-medium">{Math.round(val * 0.6 * 2) / 2} {unit}</span></div>
          <div className="flex justify-between"><span className="text-muted">Trabajo pesado (85%)</span><span className="font-medium">{Math.round(val * 0.85 * 2) / 2} {unit}</span></div>
          <div className="flex justify-between"><span className="text-muted">Top set (90%)</span><span className="font-medium">{Math.round(val * 0.9 * 2) / 2} {unit}</span></div>
          <div className="flex justify-between"><span className="text-muted">Max effort (95%)</span><span className="font-medium">{Math.round(val * 0.95 * 2) / 2} {unit}</span></div>
        </Card>
      )}
    </div>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

type Tab = 'prs' | 'progresion' | 'calculadora'

export default function PRsPage() {
  const [tab, setTab] = useState<Tab>('prs')
  const [items, setItems] = useState<UserResult[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRoutineId, setSelectedRoutineId] = useState<number | undefined>()

  useEffect(() => {
    prs.mine().then(r => setItems(r.prs || [])).finally(() => setLoading(false))
  }, [])

  const handleSelectRoutine = (id: number) => {
    setSelectedRoutineId(id)
    setTab('progresion')
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'prs', label: 'PRs' },
    { id: 'progresion', label: 'Progresión' },
    { id: 'calculadora', label: 'Calculadora' },
  ]

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Personal Records</h2>

      {/* Tabs */}
      <div className="flex gap-1 bg-card rounded-lg p-1 mb-4">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 text-sm py-1.5 rounded-md transition-colors ${
              tab === t.id ? 'bg-accent text-white font-medium' : 'text-muted hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading && tab !== 'calculadora' ? (
        <p className="text-muted text-center py-8">Cargando...</p>
      ) : (
        <>
          {tab === 'prs' && <PRsTab items={items} onSelectRoutine={handleSelectRoutine} />}
          {tab === 'progresion' && <ProgresionTab prItems={items} initialRoutineId={selectedRoutineId} />}
          {tab === 'calculadora' && <CalculadoraTab />}
        </>
      )}
    </div>
  )
}
