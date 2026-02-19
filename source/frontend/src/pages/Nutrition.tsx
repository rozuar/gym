import { useState, useEffect } from 'react'
import { nutrition as nutritionApi } from '../lib/api'
import type { NutritionLog, NutritionSummary, WaterLog } from '../types'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input, Select } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'

const MEALS = ['breakfast', 'lunch', 'dinner', 'snack', 'other']
const MEAL_LABELS: Record<string, string> = {
  breakfast: '🌅 Desayuno', lunch: '☀️ Almuerzo', dinner: '🌙 Cena', snack: '🍎 Snack', other: '🍽️ Otro',
}

const WATER_PRESETS = [150, 250, 350, 500]

type FoodForm = {
  food_name: string; grams: string; calories: string
  protein_g: string; carbs_g: string; fat_g: string; meal_type: string
}
const emptyFoodForm = (): FoodForm => ({ food_name: '', grams: '', calories: '', protein_g: '', carbs_g: '', fat_g: '', meal_type: 'other' })

function MacroBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0
  return (
    <div>
      <div className="flex justify-between text-xs mb-0.5">
        <span className="text-muted">{label}</span>
        <span className="font-medium">{value.toFixed(0)}g</span>
      </div>
      <div className="h-1.5 bg-border rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  )
}

export default function NutritionPage() {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [logs, setLogs] = useState<NutritionLog[]>([])
  const [summary, setSummary] = useState<NutritionSummary | null>(null)
  const [water, setWater] = useState<WaterLog[]>([])
  const [loading, setLoading] = useState(true)
  const [showFood, setShowFood] = useState(false)
  const [foodForm, setFoodForm] = useState<FoodForm>(emptyFoodForm())

  const load = (d = date) => {
    setLoading(true)
    nutritionApi.getDay(d).then(r => {
      setLogs(r.logs || [])
      setSummary(r.summary || null)
      setWater(r.water || [])
    }).finally(() => setLoading(false))
  }

  useEffect(() => { load(date) }, [date])

  const submitFood = async () => {
    if (!foodForm.food_name.trim()) return alert('Nombre requerido')
    const payload: Record<string, unknown> = { food_name: foodForm.food_name, meal_type: foodForm.meal_type, logged_at: date }
    if (foodForm.grams) payload.grams = parseFloat(foodForm.grams)
    if (foodForm.calories) payload.calories = parseFloat(foodForm.calories)
    if (foodForm.protein_g) payload.protein_g = parseFloat(foodForm.protein_g)
    if (foodForm.carbs_g) payload.carbs_g = parseFloat(foodForm.carbs_g)
    if (foodForm.fat_g) payload.fat_g = parseFloat(foodForm.fat_g)
    try {
      await nutritionApi.logFood(payload as any)
      setShowFood(false); setFoodForm(emptyFoodForm()); load(date)
    } catch (e: any) { alert(e.message) }
  }

  const delLog = async (id: number) => { await nutritionApi.deleteLog(id); load(date) }

  const logWater = async (ml: number) => {
    try { await nutritionApi.logWater(ml, date); load(date) } catch {}
  }

  const totalWater = water.reduce((s, w) => s + w.ml, 0)

  // Group by meal
  const byMeal = MEALS.reduce((acc, m) => {
    acc[m] = logs.filter(l => l.meal_type === m)
    return acc
  }, {} as Record<string, NutritionLog[]>)

  const ff = (k: keyof FoodForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setFoodForm(p => ({ ...p, [k]: e.target.value }))

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Nutrición</h2>
        <input
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          className="bg-bg border border-border rounded px-2 py-1 text-sm focus:outline-none focus:border-accent"
        />
      </div>

      {/* Summary */}
      {summary && (
        <Card className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <p className="font-semibold">Resumen del día</p>
            <p className="text-2xl font-bold text-accent">{summary.calories.toFixed(0)} kcal</p>
          </div>
          <div className="space-y-2">
            <MacroBar label="Proteína" value={summary.protein_g} max={150} color="#10b981" />
            <MacroBar label="Carbohidratos" value={summary.carbs_g} max={300} color="#3b82f6" />
            <MacroBar label="Grasa" value={summary.fat_g} max={80} color="#f59e0b" />
          </div>
          {/* Water */}
          <div className="mt-3 border-t border-border/50 pt-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted">💧 Agua: <b className="text-white">{totalWater} ml</b></span>
            </div>
            <div className="flex gap-2 flex-wrap">
              {WATER_PRESETS.map(ml => (
                <button key={ml} onClick={() => logWater(ml)} className="text-xs bg-border hover:bg-border/80 px-2 py-1 rounded">+{ml}ml</button>
              ))}
            </div>
          </div>
        </Card>
      )}

      <Button size="sm" className="w-full mb-4" onClick={() => { setFoodForm(emptyFoodForm()); setShowFood(true) }}>+ Registrar alimento</Button>

      {loading ? <p className="text-muted text-center py-4">Cargando...</p> : (
        <div className="space-y-4">
          {MEALS.map(meal => {
            const mealLogs = byMeal[meal]
            if (mealLogs.length === 0) return null
            return (
              <div key={meal}>
                <p className="text-sm font-semibold mb-2">{MEAL_LABELS[meal]}</p>
                <div className="space-y-1">
                  {mealLogs.map(l => (
                    <div key={l.id} className="flex items-center justify-between text-sm bg-card border border-border rounded px-3 py-2">
                      <div>
                        <span className="font-medium">{l.food_name}</span>
                        {l.grams && <span className="text-muted text-xs ml-1">{l.grams}g</span>}
                        <div className="text-xs text-muted flex gap-2">
                          {l.calories != null && <span>{l.calories?.toFixed(0)} kcal</span>}
                          {l.protein_g != null && <span>P:{l.protein_g?.toFixed(0)}g</span>}
                          {l.carbs_g != null && <span>C:{l.carbs_g?.toFixed(0)}g</span>}
                          {l.fat_g != null && <span>G:{l.fat_g?.toFixed(0)}g</span>}
                        </div>
                      </div>
                      <button onClick={() => delLog(l.id)} className="text-danger text-xs ml-2">×</button>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
          {logs.length === 0 && <p className="text-muted text-center py-4">Sin registros para este día</p>}
        </div>
      )}

      <Modal open={showFood} onClose={() => setShowFood(false)} title="Registrar alimento">
        <div className="space-y-3">
          <Input placeholder="Alimento *" value={foodForm.food_name} onChange={ff('food_name')} />
          <Select value={foodForm.meal_type} onChange={ff('meal_type')}>
            {MEALS.map(m => <option key={m} value={m}>{MEAL_LABELS[m]}</option>)}
          </Select>
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="Gramos" value={foodForm.grams} onChange={ff('grams')} type="number" step="0.1" />
            <Input placeholder="Calorías" value={foodForm.calories} onChange={ff('calories')} type="number" step="0.1" />
            <Input placeholder="Proteína (g)" value={foodForm.protein_g} onChange={ff('protein_g')} type="number" step="0.1" />
            <Input placeholder="Carbos (g)" value={foodForm.carbs_g} onChange={ff('carbs_g')} type="number" step="0.1" />
            <Input placeholder="Grasa (g)" value={foodForm.fat_g} onChange={ff('fat_g')} type="number" step="0.1" />
          </div>
          <Button className="w-full" onClick={submitFood}>Guardar</Button>
        </div>
      </Modal>
    </div>
  )
}
