import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Zap, User, Mail, Lock, AlertCircle } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'

export default function Register() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { register } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await register(name, email, password)
      navigate('/schedule')
    } catch (err: any) {
      setError(err.message || 'Error al registrarse')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/3 w-64 h-64 bg-accent-2/8 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-sm relative animate-fade-in">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent to-accent-2 flex items-center justify-center mb-4 shadow-2xl shadow-accent/30">
            <Zap size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">Crear cuenta</h1>
          <p className="text-muted text-sm mt-1">Únete a Box Magic</p>
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
              <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
              <Input placeholder="Nombre completo" value={name} onChange={e => setName(e.target.value)} required className="pl-9" />
            </div>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
              <Input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required className="pl-9" />
            </div>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
              <Input type="password" placeholder="Contraseña" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} className="pl-9" />
            </div>
            <Button type="submit" disabled={loading} className="w-full py-2.5">
              {loading ? 'Cargando...' : 'Crear cuenta'}
            </Button>
          </form>
          <p className="text-center text-sm text-muted mt-4">
            Ya tienes cuenta?{' '}
            <Link to="/login" className="text-accent hover:text-accent-hover transition-colors">
              Ingresa
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
