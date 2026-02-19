import { useState, useEffect, useRef, useCallback } from 'react'

type Mode = 'amrap' | 'emom' | 'tabata' | 'fortime' | 'countdown'

const MODES: { id: Mode; label: string; desc: string }[] = [
  { id: 'amrap', label: 'AMRAP', desc: 'As Many Rounds As Possible' },
  { id: 'emom', label: 'EMOM', desc: 'Every Minute On the Minute' },
  { id: 'tabata', label: 'Tabata', desc: '20s trabajo / 10s descanso' },
  { id: 'fortime', label: 'For Time', desc: 'Cuenta hacia arriba' },
  { id: 'countdown', label: 'Countdown', desc: 'Cuenta regresiva simple' },
]

function fmt(s: number) {
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}

export default function TimerPage() {
  const [mode, setMode] = useState<Mode>('amrap')
  const [running, setRunning] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [remaining, setRemaining] = useState(0)
  const [phase, setPhase] = useState<'work' | 'rest'>('work')
  const [round, setRound] = useState(1)
  const [finished, setFinished] = useState(false)

  // Config
  const [minutes, setMinutes] = useState(10)
  const [seconds, setSeconds] = useState(0)
  const [emomInterval, setEmomInterval] = useState(60)
  const [tabataWork, setTabataWork] = useState(20)
  const [tabataRest, setTabataRest] = useState(10)
  const [tabataRounds, setTabataRounds] = useState(8)

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const totalSeconds = minutes * 60 + seconds

  const stop = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    setRunning(false)
  }, [])

  const reset = () => {
    stop()
    setElapsed(0)
    setRemaining(totalSeconds)
    setPhase('work')
    setRound(1)
    setFinished(false)
  }

  const start = () => {
    setFinished(false)
    if (mode === 'amrap' || mode === 'countdown') {
      setRemaining(totalSeconds)
    } else if (mode === 'emom') {
      setRemaining(emomInterval)
    } else if (mode === 'tabata') {
      setPhase('work'); setRemaining(tabataWork); setRound(1)
    } else {
      setElapsed(0)
    }
    setRunning(true)
  }

  useEffect(() => {
    if (!running) return
    intervalRef.current = setInterval(() => {
      if (mode === 'fortime') {
        setElapsed(e => e + 1)
        return
      }
      if (mode === 'amrap' || mode === 'countdown') {
        setRemaining(r => {
          if (r <= 1) { stop(); setFinished(true); return 0 }
          return r - 1
        })
        return
      }
      if (mode === 'emom') {
        setElapsed(e => e + 1)
        setRemaining(r => {
          if (r <= 1) {
            setRound(rd => rd + 1)
            return emomInterval
          }
          return r - 1
        })
        return
      }
      if (mode === 'tabata') {
        setRemaining(r => {
          if (r <= 1) {
            setPhase(p => {
              if (p === 'work') { setRemaining(tabataRest); return 'rest' }
              else {
                setRound(rd => {
                  if (rd >= tabataRounds) { stop(); setFinished(true) }
                  return rd + 1
                })
                setRemaining(tabataWork)
                return 'work'
              }
            })
            return r
          }
          return r - 1
        })
      }
    }, 1000)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [running, mode, emomInterval, tabataWork, tabataRest, tabataRounds])

  const displayTime = mode === 'fortime' ? fmt(elapsed) : fmt(remaining)
  const phaseColor = phase === 'work' ? 'text-accent' : 'text-warning'

  return (
    <div className="max-w-sm mx-auto">
      <h2 className="text-xl font-bold mb-4">Timer</h2>

      {/* Mode selector */}
      <div className="grid grid-cols-5 gap-1 mb-4">
        {MODES.map(m => (
          <button
            key={m.id}
            onClick={() => { setMode(m.id); reset() }}
            className={`py-2 rounded text-xs font-medium transition-colors ${mode === m.id ? 'bg-accent text-white' : 'bg-border text-muted hover:text-white'}`}
          >
            {m.label}
          </button>
        ))}
      </div>
      <p className="text-xs text-muted text-center mb-4">{MODES.find(m => m.id === mode)?.desc}</p>

      {/* Config */}
      {!running && !finished && (
        <div className="bg-card border border-border rounded-lg p-4 mb-4 space-y-3">
          {(mode === 'amrap' || mode === 'countdown' || mode === 'fortime') && (
            <div className="flex gap-2 items-center">
              <label className="text-sm text-muted w-16">Tiempo</label>
              <input type="number" min="0" max="99" value={minutes} onChange={e => setMinutes(Number(e.target.value))} className="w-16 text-center bg-bg border border-border rounded px-2 py-1 text-sm" />
              <span className="text-muted text-sm">min</span>
              <input type="number" min="0" max="59" value={seconds} onChange={e => setSeconds(Number(e.target.value))} className="w-16 text-center bg-bg border border-border rounded px-2 py-1 text-sm" />
              <span className="text-muted text-sm">seg</span>
            </div>
          )}
          {mode === 'emom' && (
            <div className="flex gap-2 items-center">
              <label className="text-sm text-muted w-20">Intervalo</label>
              <input type="number" min="10" value={emomInterval} onChange={e => setEmomInterval(Number(e.target.value))} className="w-16 text-center bg-bg border border-border rounded px-2 py-1 text-sm" />
              <span className="text-muted text-sm">seg</span>
            </div>
          )}
          {mode === 'tabata' && (
            <>
              <div className="flex gap-2 items-center">
                <label className="text-sm text-muted w-20">Trabajo</label>
                <input type="number" min="5" value={tabataWork} onChange={e => setTabataWork(Number(e.target.value))} className="w-16 text-center bg-bg border border-border rounded px-2 py-1 text-sm" />
                <span className="text-muted text-sm">seg</span>
              </div>
              <div className="flex gap-2 items-center">
                <label className="text-sm text-muted w-20">Descanso</label>
                <input type="number" min="5" value={tabataRest} onChange={e => setTabataRest(Number(e.target.value))} className="w-16 text-center bg-bg border border-border rounded px-2 py-1 text-sm" />
                <span className="text-muted text-sm">seg</span>
              </div>
              <div className="flex gap-2 items-center">
                <label className="text-sm text-muted w-20">Rounds</label>
                <input type="number" min="1" value={tabataRounds} onChange={e => setTabataRounds(Number(e.target.value))} className="w-16 text-center bg-bg border border-border rounded px-2 py-1 text-sm" />
              </div>
            </>
          )}
        </div>
      )}

      {/* Display */}
      <div className="bg-card border border-border rounded-xl p-8 text-center mb-4">
        {mode === 'tabata' && running && (
          <p className={`text-lg font-bold mb-1 ${phaseColor}`}>{phase === 'work' ? 'TRABAJO' : 'DESCANSO'}</p>
        )}
        {(mode === 'emom' || mode === 'tabata') && (
          <p className="text-sm text-muted mb-2">Round {round}{mode === 'tabata' ? ` / ${tabataRounds}` : ''}</p>
        )}
        <p className={`font-mono font-bold transition-colors ${finished ? 'text-success' : running ? (mode === 'tabata' && phase === 'rest' ? 'text-warning' : 'text-accent') : 'text-white'}`}
          style={{ fontSize: 'clamp(3rem, 15vw, 6rem)', lineHeight: 1 }}>
          {finished ? 'TIME!' : displayTime}
        </p>
        {mode === 'fortime' && !finished && <p className="text-xs text-muted mt-2">Detén el tiempo al terminar</p>}
      </div>

      {/* Controls */}
      <div className="flex gap-3">
        {!running ? (
          <button
            onClick={start}
            className="flex-1 py-3 rounded-lg bg-accent text-white font-bold text-lg hover:bg-accent-hover transition-colors"
          >
            {finished || elapsed > 0 || remaining > 0 ? 'Reanudar' : 'Iniciar'}
          </button>
        ) : (
          <button
            onClick={stop}
            className="flex-1 py-3 rounded-lg bg-warning text-white font-bold text-lg hover:opacity-90 transition-colors"
          >
            {mode === 'fortime' ? 'Detener' : 'Pausar'}
          </button>
        )}
        <button
          onClick={reset}
          className="px-6 py-3 rounded-lg bg-border text-muted hover:text-white font-bold transition-colors"
        >
          Reset
        </button>
      </div>
    </div>
  )
}
