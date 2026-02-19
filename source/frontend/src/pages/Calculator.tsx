import { useState } from 'react'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'

const LIFTS = ['Back Squat', 'Front Squat', 'Deadlift', 'Power Clean', 'Clean & Jerk', 'Snatch', 'Overhead Press', 'Bench Press', 'Push Press']
const PERCENTAGES = [50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100]

// Common barbell discs (kg) available in most boxes
const DISCS = [25, 20, 15, 10, 5, 2.5, 1.25]
const BAR_WEIGHT = 20

function calcPlates(targetKg: number): string {
  const perSide = (targetKg - BAR_WEIGHT) / 2
  if (perSide < 0) return 'Solo barra'
  let remaining = perSide
  const used: string[] = []
  for (const d of DISCS) {
    const count = Math.floor(remaining / d)
    if (count > 0) { used.push(`${count}×${d}kg`); remaining -= count * d }
  }
  remaining = Math.round(remaining * 100) / 100
  if (remaining > 0.01) used.push(`~${remaining}kg faltante`)
  return used.length > 0 ? used.join(' + ') : 'Solo barra'
}

export default function CalculatorPage() {
  const [lift, setLift] = useState('')
  const [rm, setRm] = useState('')
  const [target, setTarget] = useState('')

  const rmVal = parseFloat(rm) || 0
  const targetVal = parseFloat(target) || 0

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Calculadora de %</h2>

      {/* 1RM table */}
      <Card className="mb-4">
        <h3 className="font-semibold mb-3">Tabla de porcentajes del 1RM</h3>
        <div className="flex gap-2 mb-3">
          <select
            value={lift}
            onChange={e => setLift(e.target.value)}
            className="flex-1 bg-bg border border-border rounded px-2 py-1.5 text-sm focus:outline-none focus:border-accent"
          >
            <option value="">Seleccionar ejercicio</option>
            {LIFTS.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
          <Input
            type="number"
            placeholder="1RM (kg)"
            value={rm}
            onChange={e => setRm(e.target.value)}
            className="w-28"
          />
        </div>
        {rmVal > 0 && (
          <div className="grid grid-cols-2 gap-1 text-sm">
            {PERCENTAGES.map(pct => {
              const kg = Math.round(rmVal * pct / 100 * 4) / 4
              return (
                <div key={pct} className={`flex justify-between px-3 py-1.5 rounded ${pct >= 90 ? 'bg-danger/10 border border-danger/20' : pct >= 80 ? 'bg-warning/10 border border-warning/20' : 'bg-bg border border-border/50'}`}>
                  <span className="text-muted">{pct}%</span>
                  <span className="font-bold">{kg} kg</span>
                </div>
              )
            })}
          </div>
        )}
        {!rmVal && <p className="text-muted text-sm text-center py-4">Ingresa tu 1RM para ver la tabla</p>}
      </Card>

      {/* Plate calculator */}
      <Card>
        <h3 className="font-semibold mb-3">Calculadora de discos</h3>
        <p className="text-xs text-muted mb-3">Barra estándar: {BAR_WEIGHT}kg</p>
        <Input
          type="number"
          placeholder="Peso objetivo (kg)"
          value={target}
          onChange={e => setTarget(e.target.value)}
        />
        {targetVal >= BAR_WEIGHT && (
          <div className="mt-3 p-3 bg-bg rounded-lg border border-border">
            <p className="text-xs text-muted mb-1">Por lado:</p>
            <p className="font-medium text-accent">{calcPlates(targetVal)}</p>
            <p className="text-xs text-muted mt-1">Total: {targetVal}kg = barra {BAR_WEIGHT}kg + {((targetVal - BAR_WEIGHT) / 2).toFixed(2)}kg × 2</p>
          </div>
        )}
        {targetVal > 0 && targetVal < BAR_WEIGHT && (
          <p className="text-warning text-xs mt-2">El peso objetivo es menor al peso de la barra ({BAR_WEIGHT}kg)</p>
        )}

        {/* Quick select from 1RM table */}
        {rmVal > 0 && (
          <div className="mt-3">
            <p className="text-xs text-muted mb-2">Seleccionar desde tabla:</p>
            <div className="flex flex-wrap gap-1">
              {PERCENTAGES.map(pct => {
                const kg = Math.round(rmVal * pct / 100 * 4) / 4
                return (
                  <button key={pct} onClick={() => setTarget(String(kg))} className="text-xs bg-border hover:bg-border/80 px-2 py-1 rounded">
                    {pct}% = {kg}kg
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
