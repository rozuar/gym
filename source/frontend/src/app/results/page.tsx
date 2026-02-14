'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface ResultItem {
  id: number;
  routine_id: number;
  routine_name: string;
  routine_type: string;
  score: string;
  notes?: string;
  rx: boolean;
  schedule_date?: string;
  created_at: string;
}

export default function ResultsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [results, setResults] = useState<ResultItem[]>([]);
  const [routines, setRoutines] = useState<{ id: number; name: string; type: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [form, setForm] = useState({ routine_id: 0, score: '', notes: '', rx: false });

  // Filters
  const [filterType, setFilterType] = useState<string>('all');
  const [filterRoutine, setFilterRoutine] = useState<string>('all');

  // Routine history
  const [viewingHistory, setViewingHistory] = useState<number | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    if (user) loadData();
  }, [user, authLoading]);

  const loadData = async () => {
    try {
      const [resData, routinesData] = await Promise.all([
        api.getMyResults(),
        api.getRoutines().catch(() => ({ routines: [] })),
      ]);
      setResults((resData.results || []) as ResultItem[]);
      setRoutines((routinesData as { routines?: { id: number; name: string; type: string }[] }).routines || []);
      setLoadError('');
    } catch (err) {
      console.error(err);
      setLoadError('No se pudieron cargar los resultados.');
    } finally {
      setLoading(false);
    }
  };

  const filteredResults = useMemo(() => {
    let filtered = [...results];
    
    if (filterType !== 'all') {
      filtered = filtered.filter(r => r.routine_type === filterType);
    }
    
    if (filterRoutine !== 'all') {
      filtered = filtered.filter(r => r.routine_id === Number(filterRoutine));
    }
    
    return filtered;
  }, [results, filterType, filterRoutine]);

  const routineTypes = useMemo(() => {
    const types = new Set(results.map(r => r.routine_type));
    return Array.from(types);
  }, [results]);

  const openEditForm = (result: ResultItem) => {
    setEditingId(result.id);
    setForm({
      routine_id: result.routine_id,
      score: result.score,
      notes: result.notes || '',
      rx: result.rx,
    });
    setFormOpen(true);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm({ routine_id: 0, score: '', notes: '', rx: false });
    setFormOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.routine_id || !form.score.trim()) return;
    setSubmitting(true);
    try {
      if (editingId) {
        await api.updateResult(editingId, {
          score: form.score.trim(),
          notes: form.notes.trim() || undefined,
          rx: form.rx,
        });
      } else {
        await api.logResult({
          routine_id: form.routine_id,
          score: form.score.trim(),
          notes: form.notes.trim() || undefined,
          rx: form.rx,
        });
      }
      cancelEdit();
      await loadData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este resultado?')) return;
    setDeletingId(id);
    try {
      await api.deleteResult(id);
      await loadData();
      if (viewingHistory) {
        loadRoutineHistory(viewingHistory);
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error al eliminar');
    } finally {
      setDeletingId(null);
    }
  };

  const loadRoutineHistory = async (routineId: number) => {
    if (viewingHistory === routineId && history.length > 0) {
      setViewingHistory(null);
      setHistory([]);
      return;
    }
    
    setViewingHistory(routineId);
    setLoadingHistory(true);
    try {
      const data = await api.getRoutineHistory(routineId);
      setHistory(data.history || []);
    } catch (err) {
      console.error(err);
      setHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Mis Resultados</h1>
        <Button onClick={() => { cancelEdit(); setFormOpen(!formOpen); }} variant="secondary">
          {formOpen ? 'Cerrar' : 'Registrar resultado'}
        </Button>
      </div>

      {loadError && (
        <Card className="mb-6">
          <p className="text-red-400 text-center">{loadError}</p>
        </Card>
      )}

      {formOpen && (
        <Card className="mb-6">
          <h2 className="text-lg font-semibold mb-4">
            {editingId ? 'Editar resultado' : 'Nuevo resultado'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Rutina</label>
              <select
                className="w-full bg-zinc-800 border border-zinc-600 rounded px-3 py-2 text-white"
                value={form.routine_id}
                onChange={(e) => setForm({ ...form, routine_id: Number(e.target.value) })}
                required
                disabled={!!editingId}
              >
                <option value={0}>Seleccionar</option>
                {routines.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
            <Input
              label="Resultado (tiempo, reps, etc.)"
              value={form.score}
              onChange={(e) => setForm({ ...form, score: e.target.value })}
              required
            />
            <Input
              label="Notas (opcional)"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.rx}
                onChange={(e) => setForm({ ...form, rx: e.target.checked })}
                className="rounded bg-zinc-800 border-zinc-600"
              />
              <span className="text-sm text-zinc-400">RX</span>
            </label>
            <div className="flex gap-2">
              <Button type="submit" loading={submitting}>
                {editingId ? 'Actualizar' : 'Guardar'}
              </Button>
              <Button type="button" variant="secondary" onClick={cancelEdit}>
                Cancelar
              </Button>
            </div>
          </form>
        </Card>
      )}

      {results.length > 0 && (
        <Card className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Filtrar por tipo</label>
              <select
                className="w-full bg-zinc-800 border border-zinc-600 rounded px-3 py-2 text-white"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="all">Todos los tipos</option>
                {routineTypes.map((type) => (
                  <option key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Filtrar por rutina</label>
              <select
                className="w-full bg-zinc-800 border border-zinc-600 rounded px-3 py-2 text-white"
                value={filterRoutine}
                onChange={(e) => setFilterRoutine(e.target.value)}
              >
                <option value="all">Todas las rutinas</option>
                {routines.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Card>
      )}

      {filteredResults.length === 0 ? (
        <Card>
          <p className="text-zinc-400 text-center">
            {results.length === 0
              ? 'No tienes resultados registrados.'
              : 'No hay resultados que coincidan con los filtros seleccionados.'}
          </p>
          {results.length === 0 && (
            <p className="text-zinc-500 text-center text-sm mt-2">Registra tu primer resultado arriba.</p>
          )}
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredResults.map((r) => (
            <div key={r.id}>
              <Card className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-lg">{r.routine_name}</h3>
                        <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded mt-1 inline-block">
                          {r.routine_type}
                        </span>
                      </div>
                      {r.rx && (
                        <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">
                          RX
                        </span>
                      )}
                    </div>
                    <p className="text-2xl font-bold text-blue-400 mt-2 mb-1">{r.score}</p>
                    {r.notes && (
                      <p className="text-sm text-zinc-400 mt-2 italic">&quot;{r.notes}&quot;</p>
                    )}
                    <div className="flex gap-4 mt-3 text-xs text-zinc-500">
                      {r.schedule_date && (
                        <span>
                          Clase: {new Date(r.schedule_date.slice(0, 10) + 'T12:00:00').toLocaleDateString('es-CL', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      )}
                      <span>
                        Registrado: {new Date(r.created_at.slice(0, 10) + 'T12:00:00').toLocaleDateString('es-CL', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 sm:flex-col">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => openEditForm(r)}
                      disabled={deletingId === r.id}
                    >
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => loadRoutineHistory(r.routine_id)}
                      disabled={deletingId === r.id}
                    >
                      {viewingHistory === r.routine_id ? 'Ocultar historial' : 'Ver historial'}
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleDelete(r.id)}
                      loading={deletingId === r.id}
                    >
                      Eliminar
                    </Button>
                  </div>
                </div>
              </Card>
              
              {viewingHistory === r.routine_id && (
                <Card className="mt-2 p-4 bg-zinc-800/50">
                  <h4 className="font-semibold mb-3 text-sm text-zinc-300">
                    Historial de &quot;{r.routine_name}&quot;
                  </h4>
                  {loadingHistory ? (
                    <div className="flex justify-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white" />
                    </div>
                  ) : history.length === 0 ? (
                    <p className="text-zinc-500 text-sm text-center py-2">
                      No hay más resultados registrados para esta rutina.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {history.map((h) => (
                        <div
                          key={h.id}
                          className="flex items-center justify-between p-2 bg-zinc-900/50 rounded text-sm"
                        >
                          <div className="flex items-center gap-3">
                            <span className="font-medium text-blue-400">{h.score}</span>
                            {h.notes && (
                              <span className="text-zinc-500 text-xs italic">{h.notes}</span>
                            )}
                            {h.rx && (
                              <span className="text-xs bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded">
                                RX
                              </span>
                            )}
                          </div>
                          <span className="text-zinc-600 text-xs">
                            {new Date(h.created_at.slice(0, 10) + 'T12:00:00').toLocaleDateString('es-CL', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
