'use client'

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import type { StaffUser, StaffPermission, StaffRole } from './types'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import {
  ROLE_LABELS,
  canAccessRoute,
  getDefaultPermissions as getDefaultPermissionsByRole,
} from '@/lib/admin/rbac'

interface StaffContextValue {
  currentStaff: StaffUser | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>
  logout: () => Promise<void>
  hasPermission: (permission: StaffPermission) => boolean
  hasAnyPermission: (permissions: StaffPermission[]) => boolean
  hasAllPermissions: (permissions: StaffPermission[]) => boolean
  canAccess: (route: string) => boolean
}

const StaffContext = createContext<StaffContextValue | undefined>(undefined)

type AdminSessionResponse = {
  success?: boolean
  error?: string
  user?: { id: string; email: string; name: string }
  role?: StaffRole
  permissions?: StaffPermission[]
}

export function StaffProvider({ children }: { children: ReactNode }) {
  const [currentStaff, setCurrentStaff] = useState<StaffUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const loadAdminSession = useCallback(async () => {
    const supabase = getSupabaseBrowserClient()
    const { data } = await supabase.auth.getSession()
    const token = data.session?.access_token
    if (!token) {
      setCurrentStaff(null)
      setIsLoading(false)
      return
    }

    const response = await fetch('/api/admin/session', {
      headers: { Authorization: `Bearer ${token}` },
    })
    const result = (await response.json()) as AdminSessionResponse

    if (!response.ok || !result.user || !result.role) {
      setCurrentStaff(null)
      setIsLoading(false)
      return
    }

    setCurrentStaff({
      id: result.user.id,
      email: result.user.email,
      name: result.user.name,
      role: result.role,
      is_active: true,
      permissions: result.permissions ?? getDefaultPermissionsByRole(result.role),
      created_at: '',
    })
    setIsLoading(false)
  }, [])

  useEffect(() => {
    let mounted = true
    const supabase = getSupabaseBrowserClient()

    loadAdminSession().catch(() => {
      if (!mounted) return
      setCurrentStaff(null)
      setIsLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      void loadAdminSession()
    })

    return () => {
      mounted = false
      listener.subscription.unsubscribe()
    }
  }, [loadAdminSession])

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true)
    const supabase = getSupabaseBrowserClient()
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
    if (authError) {
      setIsLoading(false)
      return { ok: false, error: authError.message }
    }

    const { data: sessionData } = await supabase.auth.getSession()
    const token = sessionData.session?.access_token
    if (!token) {
      setIsLoading(false)
      return { ok: false, error: '세션을 확인할 수 없습니다.' }
    }

    const response = await fetch('/api/admin/session', {
      headers: { Authorization: `Bearer ${token}` },
    })
    const result = (await response.json()) as AdminSessionResponse
    if (!response.ok || !result.user || !result.role) {
      await supabase.auth.signOut()
      setCurrentStaff(null)
      setIsLoading(false)
      return { ok: false, error: result.error || '어드민 권한이 없습니다.' }
    }

    setCurrentStaff({
      id: result.user.id,
      email: result.user.email,
      name: result.user.name,
      role: result.role,
      is_active: true,
      permissions: result.permissions ?? getDefaultPermissionsByRole(result.role),
      created_at: '',
    })
    setIsLoading(false)
    return { ok: true }
  }, [])

  const logout = useCallback(async () => {
    const supabase = getSupabaseBrowserClient()
    await supabase.auth.signOut()
    setCurrentStaff(null)
  }, [])

  const hasPermission = useCallback((permission: StaffPermission): boolean => {
    if (!currentStaff) return false
    return currentStaff.permissions.includes(permission)
  }, [currentStaff])

  const hasAnyPermission = useCallback((permissions: StaffPermission[]): boolean => {
    return permissions.some(p => hasPermission(p))
  }, [hasPermission])

  const hasAllPermissions = useCallback((permissions: StaffPermission[]): boolean => {
    return permissions.every(p => hasPermission(p))
  }, [hasPermission])

  const canAccess = useCallback((route: string): boolean => {
    if (!currentStaff) return false
    
    return canAccessRoute(currentStaff.role, route)
  }, [currentStaff])

  return (
    <StaffContext.Provider
      value={{
        currentStaff,
        isLoading,
        login,
        logout,
        hasPermission,
        hasAnyPermission,
        hasAllPermissions,
        canAccess,
      }}
    >
      {children}
    </StaffContext.Provider>
  )
}

export function useStaff() {
  const context = useContext(StaffContext)
  if (!context) {
    throw new Error('useStaff must be used within a StaffProvider')
  }
  return context
}

// Helper hook for permission-gated UI
export function useRequirePermission(permission: StaffPermission) {
  const { hasPermission, currentStaff } = useStaff()
  return {
    allowed: hasPermission(permission),
    staff: currentStaff,
  }
}

// Get default permissions for a role
export function getDefaultPermissions(role: StaffRole): StaffPermission[] {
  return getDefaultPermissionsByRole(role)
}

// Permission group labels for UI
export const PERMISSION_GROUPS = {
  orders: { label: '주문 관리', permissions: ['orders.view', 'orders.edit', 'orders.create'] as StaffPermission[] },
  inventory: { label: '재고 관리', permissions: ['inventory.view', 'inventory.edit'] as StaffPermission[] },
  products: { label: '상품 관리', permissions: ['products.view', 'products.edit'] as StaffPermission[] },
  payments: { label: '결제 관리', permissions: ['payments.view', 'payments.confirm'] as StaffPermission[] },
  reports: { label: '리포트', permissions: ['reports.view', 'reports.export'] as StaffPermission[] },
  users: { label: '사용자 관리', permissions: ['users.view', 'users.edit'] as StaffPermission[] },
  settings: { label: '설정', permissions: ['settings.view', 'settings.edit'] as StaffPermission[] },
}

export { ROLE_LABELS }
