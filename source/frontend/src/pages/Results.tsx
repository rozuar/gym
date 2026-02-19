import { useState, useEffect } from 'react'
import { results, fistbumps, routines as routinesApi, comments as commentsApi } from '../lib/api'
import type { UserResult, Routine, ResultComment } from '../types'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Modal } from '../components/ui/Modal'
import { Input, Select, Textarea } from '../components/ui/Input'
import { useAuth } from '../contexts/AuthContext'

function fmt(d: string) { const p = new Date(d); return `${p.getDate().toString().padStart(2,'0')}/${(p.getMonth()+1).toString().padStart(2,'0')}/${p.getFullYear()}` }

function CommentsSection({ resultId }: { resultId: number }) {
  const { user } = useAuth()
  const [items, setItems] = useState<ResultComment[]>([])
  const [loaded, setLoaded] = useState(false)
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const load = () => {
    commentsApi.list(resultId).then(r => { setItems(r.comments || []); setLoaded(true) })
  }

  const toggle = () => {
    if (!open && !loaded) load()
    setOpen(o => !o)
  }

  const submit = async () => {
    if (!text.trim()) return
    setSubmitting(true)
    try { await commentsApi.create(resultId, text.trim()); setText(''); load() }
    catch (e: any) { alert(e.message) }
    finally { setSubmitting(false) }
  }

  const del = async (commentId: number) => {
    await commentsApi.remove(resultId, commentId)
    setItems(prev => prev.filter(c => c.id !== commentId))
  }

  return (
    <div className="border-t border-border/50 mt-2 pt-2">
      <button onClick={toggle} className="text-xs text-muted hover:text-white">
        💬 {loaded ? items.length : '...'} comentarios {open ? '▲' : '▼'}
      </button>
      {open && (
        <div className="mt-2 space-y-2">
          {items.map(c => (
            <div key={c.id} className="flex items-start gap-2 text-sm">
              <div className="flex-1">
                <span className="font-medium text-xs">{c.user_name}</span>
                <span className="text-muted text-xs ml-2">{fmt(c.created_at)}</span>
                <p className="mt-0.5">{c.content}</p>
              </div>
              {user?.id === c.user_id && (
                <button onClick={() => del(c.id)} className="text-xs text-danger shrink-0">×</button>
              )}
            </div>
          ))}
          <div className="flex gap-2 mt-2">
            <input
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit() } }}
              placeholder="Agregar comentario..."
              className="flex-1 bg-bg border border-border rounded px-2 py-1 text-sm focus:outline-none focus:border-accent"
            />
            <button
              onClick={submit}
              disabled={submitting || !text.trim()}
              className="text-xs bg-accent text-white px-3 py-1 rounded disabled:opacity-50"
            >
              Enviar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function ResultsPage() {
  const [items, setItems] = useState<UserResult[]>([])
  const [rList, setRList] = useState<Routine[]>([])
  const [loading, setLoading] = useState(true)
  const [offset, setOffset] = useState(0)
  const [showLog, setShowLog] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [form, setForm] = useState({ routine_id: 0, score: '', notes: '', rx: false })

  const load = (off = 0) => {
    setLoading(true)
    results.mine(50, off).then(r => {
      if (off === 0) setItems(r.results || [])
      else setItems(prev => [...prev, ...(r.results || [])])
    }).finally(() => setLoading(false))
  }

  useEffect(() => { load(); routinesApi.list().then(r => setRList(r.routines || [])) }, [])

  const submit = async () => {
    if (!form.score) return alert('Score requerido')
    try {
      if (editId) { await results.update(editId, { score: form.score, notes: form.notes, rx: form.rx }) }
      else { if (!form.routine_id) return alert('Selecciona rutina'); await results.log({ routine_id: form.routine_id, score: form.score, notes: form.notes, rx: form.rx }) }
      setShowLog(false); setEditId(null); setForm({ routine_id: 0, score: '', notes: '', rx: false }); load()
    } catch (e: any) { alert(e.message) }
  }

  const del = async (id: number) => { if (!confirm('Eliminar?')) return; await results.remove(id); load() }

  const toggleFB = async (r: UserResult) => {
    try { if (r.user_fistbumped) await fistbumps.remove(r.id); else await fistbumps.create(r.id); load() } catch {}
  }

  const edit = (r: UserResult) => { setEditId(r.id); setForm({ routine_id: r.routine_id, score: r.score, notes: r.notes, rx: r.rx }); setShowLog(true) }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Resultados</h2>
        <Button size="sm" onClick={() => { setEditId(null); setForm({ routine_id: 0, score: '', notes: '', rx: false }); setShowLog(true) }}>+ Log</Button>
      </div>
      {loading && items.length === 0 ? <p className="text-muted text-center py-8">Cargando...</p> : items.length === 0 ? (
        <p className="text-muted text-center py-8">Sin resultados aun</p>
      ) : (
        <div className="space-y-3">
          {items.map(r => (
            <Card key={r.id} className="space-y-1">
              <div className="flex items-center justify-between">
                <div><span className="font-medium">{r.routine_name}</span>{r.is_pr && <Badge variant="pr" className="ml-2">PR</Badge>}{r.rx && <Badge variant="warning" className="ml-1">Rx</Badge>}</div>
                <span className="text-sm text-muted">{fmt(r.created_at)}</span>
              </div>
              <p className="text-lg font-bold">{r.score}</p>
              {r.notes && <p className="text-sm text-muted">{r.notes}</p>}
              <div className="flex items-center justify-between pt-1">
                <button onClick={() => toggleFB(r)} className={`text-sm ${r.user_fistbumped ? 'text-accent' : 'text-muted'}`}>👊 {r.fistbump_count}</button>
                <div className="flex gap-2">
                  <button onClick={() => edit(r)} className="text-xs text-muted hover:text-white">Editar</button>
                  <button onClick={() => del(r.id)} className="text-xs text-danger">Eliminar</button>
                </div>
              </div>
              <CommentsSection resultId={r.id} />
            </Card>
          ))}
          <Button variant="secondary" className="w-full" onClick={() => { const o = offset + 50; setOffset(o); load(o) }}>Cargar mas</Button>
        </div>
      )}
      <Modal open={showLog} onClose={() => setShowLog(false)} title={editId ? 'Editar resultado' : 'Log resultado'}>
        <div className="space-y-3">
          {!editId && (<Select value={form.routine_id} onChange={e => setForm(f => ({ ...f, routine_id: Number(e.target.value) }))}><option value={0}>Seleccionar rutina</option>{rList.map(r => <option key={r.id} value={r.id}>{r.name} ({r.type})</option>)}</Select>)}
          <Input placeholder="Score" value={form.score} onChange={e => setForm(f => ({ ...f, score: e.target.value }))} />
          <Textarea placeholder="Notas" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} />
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.rx} onChange={e => setForm(f => ({ ...f, rx: e.target.checked }))} /> Rx</label>
          <Button className="w-full" onClick={submit}>Guardar</Button>
        </div>
      </Modal>
    </div>
  )
}
