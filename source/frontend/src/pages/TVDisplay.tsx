import { useState, useEffect, useCallback } from 'react'
import { tv } from '../lib/api'
import type { TVSchedule } from '../types'

type ViewMode = 'grid' | 'slideshow'
type ScaleTab = 'rx' | 'scaled' | 'beginner'

function Clock() {
  const [time, setTime] = useState(new Date())
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  return (
    <span className="font-mono tabular-nums">
      {time.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
    </span>
  )
}

function WODContent({ schedule }: { schedule: TVSchedule }) {
  const [tab, setTab] = useState<ScaleTab>('rx')

  const hasScaled = !!schedule.routine_content_scaled
  const hasBeginner = !!schedule.routine_content_beginner

  const content = tab === 'scaled' && hasScaled
    ? schedule.routine_content_scaled
    : tab === 'beginner' && hasBeginner
      ? schedule.routine_content_beginner
      : schedule.routine_content

  return (
    <div>
      {schedule.routine_name && (
        <div className="mb-4">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-accent mb-1">WOD</p>
          <p className="text-2xl font-bold">{schedule.routine_name}</p>
        </div>
      )}
      {content && (
        <div>
          {(hasScaled || hasBeginner) && (
            <div className="flex gap-2 mb-3">
              <button onClick={() => setTab('rx')} className={`px-3 py-1 rounded text-sm font-medium transition-colors ${tab === 'rx' ? 'bg-accent text-white' : 'bg-white/10 text-white/60'}`}>Rx</button>
              {hasScaled && <button onClick={() => setTab('scaled')} className={`px-3 py-1 rounded text-sm font-medium transition-colors ${tab === 'scaled' ? 'bg-accent text-white' : 'bg-white/10 text-white/60'}`}>Scaled</button>}
              {hasBeginner && <button onClick={() => setTab('beginner')} className={`px-3 py-1 rounded text-sm font-medium transition-colors ${tab === 'beginner' ? 'bg-accent text-white' : 'bg-white/10 text-white/60'}`}>Beginner</button>}
            </div>
          )}
          <pre className="text-base leading-relaxed text-white/90 whitespace-pre-wrap font-sans">{content}</pre>
        </div>
      )}
    </div>
  )
}

function ScheduleCard({ schedule, large }: { schedule: TVSchedule; large?: boolean }) {
  return (
    <div className={`bg-white/5 border border-white/10 rounded-2xl p-6 ${large ? 'p-8' : ''}`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className={`font-bold ${large ? 'text-4xl' : 'text-2xl'}`}>{schedule.class_name}</p>
          <p className={`text-white/60 mt-1 ${large ? 'text-xl' : 'text-base'}`}>{schedule.discipline_name}</p>
        </div>
        <div className="text-right">
          <p className={`font-mono font-bold text-accent ${large ? 'text-4xl' : 'text-2xl'}`}>{schedule.start_time}</p>
          <p className="text-white/60 text-sm mt-1">{schedule.booked}/{schedule.capacity} inscritos</p>
        </div>
      </div>

      <WODContent schedule={schedule} />

      {schedule.leaderboard && schedule.leaderboard.length > 0 && (
        <div className="mt-4 pt-4 border-t border-white/10">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-white/50 mb-2">Leaderboard</p>
          <div className="space-y-1">
            {schedule.leaderboard.slice(0, large ? 8 : 5).map((e, i) => (
              <div key={e.user_id} className={`flex items-center justify-between ${large ? 'text-xl' : 'text-base'}`}>
                <span>
                  <span className={`font-bold mr-2 ${i === 0 ? 'text-yellow-400' : i === 1 ? 'text-gray-300' : i === 2 ? 'text-amber-600' : 'text-white/40'}`}>{i + 1}.</span>
                  {e.user_name}
                  {e.rx && <span className="ml-2 text-xs font-bold text-accent">Rx</span>}
                </span>
                <span className="font-bold font-mono">{e.score}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function TVDisplay() {
  const [schedules, setSchedules] = useState<TVSchedule[]>([])
  const [date, setDate] = useState('')
  const [mode, setMode] = useState<ViewMode>('grid')
  const [slideIndex, setSlideIndex] = useState(0)

  const load = useCallback(() => {
    tv.today().then(r => {
      setSchedules(r.schedules || [])
      setDate(r.date)
    }).catch(() => {})
  }, [])

  useEffect(() => {
    load()
    const interval = setInterval(load, 60000)
    return () => clearInterval(interval)
  }, [load])

  // Auto-advance slideshow every 20s
  useEffect(() => {
    if (mode !== 'slideshow' || schedules.length === 0) return
    const id = setInterval(() => {
      setSlideIndex(i => (i + 1) % schedules.length)
    }, 20000)
    return () => clearInterval(id)
  }, [mode, schedules.length])

  const dateStr = date
    ? new Date(date + 'T12:00:00').toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' })
    : ''

  return (
    <div className="min-h-screen bg-[#09090b] text-white select-none">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-[#09090b]/90 backdrop-blur border-b border-white/10 px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <h1 className="text-3xl font-black tracking-tight">Box Magic</h1>
            {dateStr && <p className="text-lg text-white/50 capitalize">{dateStr}</p>}
          </div>
          <div className="flex items-center gap-6">
            <div className="flex gap-2">
              <button
                onClick={() => setMode('grid')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${mode === 'grid' ? 'bg-accent text-white' : 'bg-white/10 text-white/60 hover:bg-white/20'}`}
              >
                Grid
              </button>
              <button
                onClick={() => { setMode('slideshow'); setSlideIndex(0) }}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${mode === 'slideshow' ? 'bg-accent text-white' : 'bg-white/10 text-white/60 hover:bg-white/20'}`}
              >
                Slideshow
              </button>
            </div>
            <p className="text-4xl font-bold font-mono"><Clock /></p>
          </div>
        </div>
      </header>

      <main className="px-8 py-8">
        {schedules.length === 0 ? (
          <div className="flex items-center justify-center min-h-[60vh]">
            <p className="text-4xl text-white/30">No hay clases programadas hoy</p>
          </div>
        ) : mode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {schedules.map(s => (
              <ScheduleCard key={s.id} schedule={s} />
            ))}
          </div>
        ) : (
          /* Slideshow mode */
          <div className="max-w-4xl mx-auto">
            <ScheduleCard schedule={schedules[slideIndex]} large />
            {schedules.length > 1 && (
              <div className="flex items-center justify-center gap-4 mt-8">
                <button
                  onClick={() => setSlideIndex(i => (i - 1 + schedules.length) % schedules.length)}
                  className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-2xl"
                >
                  ←
                </button>
                <div className="flex gap-2">
                  {schedules.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setSlideIndex(i)}
                      className={`w-3 h-3 rounded-full transition-colors ${i === slideIndex ? 'bg-accent' : 'bg-white/20'}`}
                    />
                  ))}
                </div>
                <button
                  onClick={() => setSlideIndex(i => (i + 1) % schedules.length)}
                  className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-2xl"
                >
                  →
                </button>
              </div>
            )}
            <p className="text-center text-white/30 text-sm mt-4">Avance automático cada 20 segundos</p>
          </div>
        )}
      </main>
    </div>
  )
}
