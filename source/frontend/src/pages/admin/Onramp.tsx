import { useState, useEffect } from 'react'
import { onramp, users as usersApi } from '../../lib/api'
import type { OnrampProgram, OnrampEnrollment, User } from '../../types'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Modal } from '../../components/ui/Modal'
import { Input, Textarea, Select } from '../../components/ui/Input'
import { toast } from 'sonner'

type ProgramForm = { name: string; description: string; required_sessions: string; active: boolean }
const emptyProgramForm = (): ProgramForm => ({ name: '', description: '', required_sessions: '4', active: true })

export default function AdminOnramp() {
  const [programs, setPrograms] = useState<OnrampProgram[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [form, setForm] = useState<ProgramForm>(emptyProgramForm())

  // Enrollments panel
  const [selectedProgram, setSelectedProgram] = useState<OnrampProgram | null>(null)
  const [enrollments, setEnrollments] = useState<OnrampEnrollment[]>([])
  const [showEnroll, setShowEnroll] = useState(false)
  const [allUsers, setAllUsers] = useState<User[]>([])
  const [enrollUserId, setEnrollUserId] = useState('')

  const loadPrograms = () => {
    setLoading(true)
    onramp.listPrograms(false).then(r => setPrograms(r.programs || [])).finally(() => setLoading(false))
  }

  const loadEnrollments = (programId: number) => {
    onramp.listEnrollments(programId).then(r => setEnrollments(r.enrollments || []))
  }

  useEffect(() => { loadPrograms() }, [])

  const openNew = () => { setEditId(null); setForm(emptyProgramForm()); setShowForm(true) }
  const openEdit = (p: OnrampProgram) => {
    setEditId(p.id)
    setForm({ name: p.name, description: p.description || '', required_sessions: String(p.required_sessions), active: p.active })
    setShowForm(true)
  }

  const submit = async () => {
    if (!form.name.trim()) return toast.error('Nombre requerido')
    const data = { name: form.name, description: form.description, required_sessions: Number(form.required_sessions), active: form.active }
    try {
      if (editId) await onramp.updateProgram(editId, data)
      else await onramp.createProgram(data)
      setShowForm(false); loadPrograms()
    } catch (e: any) { toast.error(e.message) }
  }

  const del = async (id: number) => {
    if (!confirm('Eliminar programa?')) return
    await onramp.deleteProgram(id); loadPrograms()
    if (selectedProgram?.id === id) setSelectedProgram(null)
  }

  const openPanel = (p: OnrampProgram) => {
    setSelectedProgram(p)
    loadEnrollments(p.id)
    if (allUsers.length === 0) usersApi.list(200).then(r => setAllUsers(r.users || []))
  }

  const doEnroll = async () => {
    if (!enrollUserId || !selectedProgram) return
    try {
      await onramp.enroll(Number(enrollUserId), selectedProgram.id)
      setEnrollUserId(''); setShowEnroll(false)
      loadEnrollments(selectedProgram.id)
    } catch (e: any) { toast.error(e.message) }
  }

  const updateSessions = async (e: OnrampEnrollment, sessions: number) => {
    if (sessions < 0) return
    await onramp.updateSessions(e.user_id, e.program_id, sessions)
    loadEnrollments(e.program_id)
  }

  const f = (k: keyof ProgramForm) => (ev: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [k]: ev.target.value }))

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">On-ramp / Fundamentos</h2>
        <Button size="sm" onClick={openNew}>+ Programa</Button>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Programs list */}
        <div>
          <h3 className="text-sm font-semibold text-muted mb-2">Programas</h3>
          {loading ? (
            <p className="text-muted text-sm">Cargando...</p>
          ) : programs.length === 0 ? (
            <p className="text-muted text-sm">Sin programas</p>
          ) : (
            <div className="space-y-2">
              {programs.map(p => (
                <Card
                  key={p.id}
                  className={`cursor-pointer transition-colors ${selectedProgram?.id === p.id ? 'border-accent' : ''}`}
                  onClick={() => openPanel(p)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{p.name}</span>
                        {!p.active && <Badge variant="danger">Inactivo</Badge>}
                      </div>
                      <p className="text-xs text-muted">{p.required_sessions} sesiones requeridas · {p.enrolled_count ?? 0} inscriptos</p>
                      {p.description && <p className="text-xs text-muted mt-0.5 truncate">{p.description}</p>}
                    </div>
                    <div className="flex gap-2 shrink-0" onClick={e => e.stopPropagation()}>
                      <button onClick={() => openEdit(p)} className="text-xs text-muted hover:text-white">Editar</button>
                      <button onClick={() => del(p.id)} className="text-xs text-danger">Eliminar</button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Enrollments panel */}
        <div>
          {selectedProgram ? (
            <>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-muted">Inscriptos — {selectedProgram.name}</h3>
                <button onClick={() => setShowEnroll(true)} className="text-xs text-accent hover:underline">+ Inscribir</button>
              </div>
              {enrollments.length === 0 ? (
                <p className="text-muted text-sm">Sin inscriptos</p>
              ) : (
                <div className="space-y-2">
                  {enrollments.map(e => (
                    <Card key={e.id}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">{e.user_name}</p>
                          <p className="text-xs text-muted">{e.user_email}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => updateSessions(e, e.sessions_completed - 1)}
                              className="w-6 h-6 text-sm bg-border rounded hover:bg-border/80"
                            >−</button>
                            <span className="text-sm w-6 text-center font-medium">{e.sessions_completed}</span>
                            <button
                              onClick={() => updateSessions(e, e.sessions_completed + 1)}
                              className="w-6 h-6 text-sm bg-border rounded hover:bg-border/80"
                            >+</button>
                          </div>
                          <span className="text-xs text-muted">/ {selectedProgram.required_sessions}</span>
                          {e.completed_at && <Badge variant="success">✓</Badge>}
                        </div>
                      </div>
                      {/* Progress bar */}
                      <div className="mt-2 h-1.5 bg-border rounded-full overflow-hidden">
                        <div
                          className="h-full bg-accent rounded-full transition-all"
                          style={{ width: `${Math.min(100, (e.sessions_completed / selectedProgram.required_sessions) * 100)}%` }}
                        />
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </>
          ) : (
            <p className="text-muted text-sm text-center py-8">Selecciona un programa para ver inscriptos</p>
          )}
        </div>
      </div>

      {/* Modal: create/edit program */}
      <Modal open={showForm} onClose={() => setShowForm(false)} title={editId ? 'Editar programa' : 'Nuevo programa'}>
        <div className="space-y-3">
          <Input placeholder="Nombre *" value={form.name} onChange={f('name')} />
          <Textarea placeholder="Descripción" value={form.description} onChange={f('description')} rows={2} />
          <Input placeholder="Sesiones requeridas" type="number" min="1" value={form.required_sessions} onChange={f('required_sessions')} />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.active} onChange={e => setForm(p => ({ ...p, active: e.target.checked }))} />
            Activo
          </label>
          <Button className="w-full" onClick={submit}>Guardar</Button>
        </div>
      </Modal>

      {/* Modal: enroll user */}
      <Modal open={showEnroll} onClose={() => setShowEnroll(false)} title="Inscribir usuario">
        <div className="space-y-3">
          <Select value={enrollUserId} onChange={e => setEnrollUserId(e.target.value)}>
            <option value="">Seleccionar usuario</option>
            {allUsers
              .filter(u => !enrollments.some(e => e.user_id === u.id))
              .map(u => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
          </Select>
          <Button className="w-full" onClick={doEnroll} disabled={!enrollUserId}>Inscribir</Button>
        </div>
      </Modal>
    </div>
  )
}
