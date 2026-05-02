import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { api } from '../lib/api'

export interface AuthUser {
  id: string
  email: string
  first_name: string
  last_name: string
  phone: string | null
  photo_url: string | null
  account_type: 'owner' | 'crew'
  is_active: boolean
  is_admin: boolean
}

interface AuthContextValue {
  user: AuthUser | null
  token: string | null
  isLoading: boolean
  saveToken: (t: string) => Promise<AuthUser>
  refreshUser: () => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'))
  const [isLoading, setIsLoading] = useState(!!localStorage.getItem('token'))

  useEffect(() => {
    if (!token) { setIsLoading(false); return }
    api.get<AuthUser>('/api/v1/users/me')
      .then(u => setUser(u))
      .catch(() => { localStorage.removeItem('token'); setToken(null) })
      .finally(() => setIsLoading(false))
  }, [])

  const saveToken = async (t: string): Promise<AuthUser> => {
    localStorage.setItem('token', t)
    setToken(t)
    const u = await api.get<AuthUser>('/api/v1/users/me')
    setUser(u)
    return u
  }

  const refreshUser = async () => {
    const u = await api.get<AuthUser>('/api/v1/users/me')
    setUser(u)
  }

  const logout = () => {
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, token, isLoading, saveToken, refreshUser, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
