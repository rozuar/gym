import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import type { User } from '../types'
import { auth as authApi, users, setTokens, clearTokens, getAccessToken } from '../lib/api'

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (getAccessToken()) {
      users.me().then(setUser).catch(() => clearTokens()).finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = async (email: string, password: string) => {
    const res = await authApi.login(email, password)
    setTokens(res.access_token, res.refresh_token)
    setUser(res.user)
  }

  const register = async (name: string, email: string, password: string) => {
    const res = await authApi.register(name, email, password)
    setTokens(res.access_token, res.refresh_token)
    setUser(res.user)
  }

  const logout = () => {
    clearTokens()
    setUser(null)
  }

  const refreshUser = async () => {
    const u = await users.me()
    setUser(u)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
