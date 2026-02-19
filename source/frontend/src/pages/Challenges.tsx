import { useState, useEffect } from 'react'
import { challenges as api } from '../lib/api'
import type { Challenge, ChallengeParticipant } from '../types'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Input, Textarea } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'

function fmtDate(d?: string) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('es-CL')
}

function typeLabel(t: string) {
  return { custom: 'Personalizado', attendance: 'Asistencia', score: 'Score' }[t] || t
}

function ChallengeDetail({
  challenge, participants, isParticipant, onBack, onRefresh,
}: {
  challenge: Challenge
  participants: ChallengeParticipant[]
  isParticipant: boolean
  onBack: () => void
  onRefresh: () => void
}) {
  const [score, setScore] = useState('')
  const [notes, setNotes] = useState('')
  const [showSubmit, setShowSubmit] = useState(false)
  const [busy, setBusy] = useState(false)

  const join = async () => {
    setBusy(true)
    try { await api.join(challenge.id); onRefresh() } catch (e: any) { alert(e.message) }
    setBusy(false)
  }

  const leave = async () => {
    if (!confirm('¿Abandonar el challenge?')) return
    setBusy(true)
    try { await api.leave(challenge.id); onRefresh() } catch (e: any) { alert(e.message) }
    setBusy(false)
  }

  const submit = async () => {
    setBusy(true)
    try {
      await api.submitProgress(challenge.id, score, notes)
      setShowSubmit(false)
      onRefresh()
    } catch (e: any) { alert(e.message) }
    setBusy(false)
  }

  return (
    <div>
      <button onClick={onBack} className="text-sm text-accent hover:underline mb-4 block">← Volver</button>

      <Card className="mb-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h2 className="text-xl font-bold">{challenge.name}</h2>
            <Badge className="mt-1">{typeLabel(challenge.type)}</Badge>
          </div>
          <div className="text-right text-sm text-muted">
            {challenge.start_date && <p>Inicio: {fmtDate(challenge.start_date)}</p>}
            {challenge.end_date && <p>Fin: {fmtDate(challenge.end_date)}</p>}
          </div>
        </div>
        {challenge.description && <p className="text-sm text-muted mb-2">{challenge.description}</p>}
        {challenge.goal && (
          <div className="bg-bg rounded-lg px-3 py-2 mb-3">
            <p className="text-xs text-muted uppercase font-medium mb-0.5">Meta</p>
            <p className="text-sm">{challenge.goal}</p>
          </div>
        )}
        <p className="text-xs text-muted">{challenge.participant_count || 0} participantes</p>

        <div className="flex gap-2 mt-3">
          {!isParticipant ? (
            <Button className="flex-1" onClick={join} disabled={busy}>
              {busy ? '...' : 'Unirse'}
            </Button>
          ) : (
            <>
              <Button className="flex-1" onClick={() => setShowSubmit(true)}>
                Registrar progreso
              </Button>
              <Button variant="secondary" onClick={leave} disabled={busy}>
                Salir
              </Button>
            </>
          )}
        </div>
      </Card>

      {/* Leaderboard / Participantes */}
      {participants.length > 0 && (
        <Card>
          <h3 className="font-semibold mb-3">Participantes</h3>
          <div className="space-y-2">
            {participants.map((p, i) => (
              <div key={p.id} className="flex items-center justify-between py-1 border-b border-border/50 last:border-0">
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-bold w-6 ${i < 3 && p.score ? 'text-accent' : 'text-muted'}`}>{i + 1}.</span>
                  <div>
                    <p className="text-sm font-medium">{p.user_name}</p>
                    {p.notes && <p className="text-xs text-muted">{p.notes}</p>}
                  </div>
                </div>
                <div className="text-right">
                  {p.score ? (
                    <span className="text-sm font-bold">{p.score}</span>
                  ) : (
                    <span className="text-xs text-muted">Sin score</span>
                  )}
                  {p.completed_at && <p className="text-xs text-muted">{fmtDate(p.completed_at)}</p>}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Modal open={showSubmit} onClose={() => setShowSubmit(false)} title="Registrar progreso">
        <div className="space-y-3">
          <Input
            placeholder={challenge.type === 'attendance' ? 'Clases asistidas' : 'Score / resultado'}
            value={score}
            onChange={e => setScore(e.target.value)}
          />
          <Textarea
            placeholder="Notas (opcional)"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={2}
          />
          <Button className="w-full" onClick={submit} disabled={busy}>
            {busy ? 'Guardando...' : 'Guardar progreso'}
          </Button>
        </div>
      </Modal>
    </div>
  )
}

export default function ChallengesPage() {
  const [items, setItems] = useState<Challenge[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<number | null>(null)
  const [detail, setDetail] = useState<{
    challenge: Challenge
    participants: ChallengeParticipant[]
    is_participant: boolean
  } | null>(null)

  const load = () => {
    setLoading(true)
    api.list().then(r => setItems(r.challenges || [])).finally(() => setLoading(false))
  }

  const loadDetail = (id: number) => {
    api.getById(id).then(setDetail).catch(() => {})
  }

  useEffect(load, [])

  useEffect(() => {
    if (selected) loadDetail(selected)
    else setDetail(null)
  }, [selected])

  if (selected && detail) {
    return (
      <ChallengeDetail
        challenge={detail.challenge}
        participants={detail.participants}
        isParticipant={detail.is_participant}
        onBack={() => setSelected(null)}
        onRefresh={() => loadDetail(selected)}
      />
    )
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Challenges</h2>

      {loading ? (
        <p className="text-muted text-center py-8">Cargando...</p>
      ) : items.length === 0 ? (
        <Card><p className="text-muted text-center py-8">No hay challenges activos</p></Card>
      ) : (
        <div className="space-y-3">
          {items.map(c => (
            <Card key={c.id} className="cursor-pointer hover:border-accent/50 transition-colors" onClick={() => setSelected(c.id)}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold">{c.name}</p>
                    <Badge>{typeLabel(c.type)}</Badge>
                  </div>
                  {c.description && <p className="text-sm text-muted line-clamp-2">{c.description}</p>}
                  {c.goal && <p className="text-xs text-muted mt-1">Meta: {c.goal}</p>}
                  <div className="flex gap-3 mt-1 text-xs text-muted">
                    {c.start_date && <span>{fmtDate(c.start_date)} →</span>}
                    {c.end_date && <span>{fmtDate(c.end_date)}</span>}
                    <span>{c.participant_count || 0} participantes</span>
                  </div>
                </div>
                <span className="text-muted text-lg ml-2">›</span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
