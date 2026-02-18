import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Card } from '../components/ui/Card'
import { dev } from '../lib/api'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate('/schedule')
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesion')
    } finally {
      setLoading(false)
    }
  }

  const seedAndLogin = async (role: 'admin' | 'user') => {
    setLoading(true)
    try {
      await dev.seedAll()
      await login(role === 'admin' ? 'admin@boxmagic.cl' : 'maria@test.cl', 'password123')
      navigate('/schedule')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-bg">
      <Card className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-center mb-6">Box Magic</h1>
        {error && <p className="text-danger text-sm mb-4 text-center">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
          <Input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Cargando...' : 'Ingresar'}
          </Button>
        </form>
        <p className="text-center text-sm text-muted mt-4">
          No tienes cuenta? <Link to="/register" className="text-accent hover:underline">Registrate</Link>
        </p>
        <div className="mt-6 border-t border-border pt-4">
          <p className="text-xs text-muted text-center mb-2">Dev mode</p>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" className="flex-1" onClick={() => seedAndLogin('admin')} disabled={loading}>
              Seed + Admin
            </Button>
            <Button variant="secondary" size="sm" className="flex-1" onClick={() => seedAndLogin('user')} disabled={loading}>
              Seed + User
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
