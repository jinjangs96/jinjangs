'use client'

import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'

type AuthContextValue = {
  user: User | null
  session: Session | null
  isLoading: boolean
  envError: string | null
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [envError, setEnvError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    try {
      const supabase = getSupabaseBrowserClient()

      supabase.auth.getSession().then(({ data }) => {
        if (!mounted) return
        setSession(data.session ?? null)
        setUser(data.session?.user ?? null)
        setIsLoading(false)
      })

      const { data: authListener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
        setSession(nextSession)
        setUser(nextSession?.user ?? null)
        setIsLoading(false)
      })

      return () => {
        mounted = false
        authListener.subscription.unsubscribe()
      }
    } catch (error) {
      if (!mounted) return
      setEnvError(error instanceof Error ? error.message : 'Supabase 초기화에 실패했습니다.')
      setIsLoading(false)
      return () => {
        mounted = false
      }
    }
  }, [])

  const value = useMemo(
    () => ({ user, session, isLoading, envError }),
    [user, session, isLoading, envError]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider')
  }
  return context
}
