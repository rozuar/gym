import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Zap, Mail, Lock, AlertCircle } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
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
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/3 w-64 h-64 bg-accent-2/8 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-sm relative animate-fade-in">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent to-accent-2 flex items-center justify-center mb-4 shadow-2xl shadow-accent/30 animate-glow">
            <Zap size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">Box Magic</h1>
          <p className="text-muted text-sm mt-1">Gestión CrossFit</p>
        </div>

        {/* Card */}
        <div className="bg-white/[0.04] backdrop-blur-xl border border-accent/20 rounded-2xl p-6 shadow-2xl shadow-accent/10">
          {error && (
            <div className="flex items-center gap-2 bg-danger/10 border border-danger/20 rounded-xl px-3 py-2.5 mb-4">
              <AlertCircle size={14} className="text-danger shrink-0" />
              <p className="text-danger text-sm">{error}</p>
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
              <Input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required className="pl-9" />
            </div>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
              <Input type="password" placeholder="Contraseña" value={password} onChange={e => setPassword(e.target.value)} required className="pl-9" />
            </div>
            <Button type="submit" disabled={loading} className="w-full py-2.5">
              {loading ? 'Cargando...' : 'Ingresar'}
            </Button>
          </form>
          <p className="text-center text-sm text-muted mt-4">
            No tienes cuenta?{' '}
            <Link to="/register" className="text-accent hover:text-accent-hover transition-colors">
              Registrate
            </Link>
          </p>
          <div className="mt-5 border-t border-accent/10 pt-4">
            <p className="text-xs text-muted text-center mb-3">Dev mode</p>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" className="flex-1" onClick={() => seedAndLogin('admin')} disabled={loading}>
                Seed + Admin
              </Button>
              <Button variant="secondary" size="sm" className="flex-1" onClick={() => seedAndLogin('user')} disabled={loading}>
                Seed + User
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
