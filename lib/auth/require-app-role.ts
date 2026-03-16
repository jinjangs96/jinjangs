import 'server-only'

import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { getSupabaseAdminClient, getSupabaseAnonServerClient } from '@/lib/supabase/admin'

export type AppRole = 'owner' | 'ops_manager' | 'finance' | 'staff' | 'viewer'

type RequireRoleOk = {
  ok: true
  userId: string
  role: AppRole
}

type RequireRoleFail = {
  ok: false
  response: NextResponse
}

type RequireRoleResult = RequireRoleOk | RequireRoleFail

function getSupabaseUrl() {
  const value = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!value) {
    throw new Error('Missing env: NEXT_PUBLIC_SUPABASE_URL')
  }
  return value
}

function getSupabaseAnonKey() {
  const value = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!value) {
    throw new Error('Missing env: NEXT_PUBLIC_SUPABASE_ANON_KEY')
  }
  return value
}

async function getUserFromRequest(request: Request) {
  const authorizationHeader = request.headers.get('authorization')
  const accessToken = authorizationHeader?.startsWith('Bearer ')
    ? authorizationHeader.slice('Bearer '.length).trim()
    : ''

  // 1) Authorization 헤더가 있으면 우선 시도
  if (accessToken) {
    const anonClient = getSupabaseAnonServerClient()
    const { data, error } = await anonClient.auth.getUser(accessToken)
    if (data.user && !error) {
      return {
        user: data.user,
        error: null,
      }
    }
    // 헤더 토큰 실패 시 쿠키 세션으로 fallback
  }

  // 2) 헤더가 없으면 쿠키 세션으로 확인
  const cookieStore = await cookies()
  const serverClient = createServerClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options)
          }
        } catch {
          // Route Handler에서 읽기만 하는 경우가 많아서 무시 가능
        }
      },
    },
  })

  const { data, error } = await serverClient.auth.getUser()
  return {
    user: data.user ?? null,
    error,
  }
}

export async function requireAppRole(
  request: Request,
  allowedRoles: AppRole[]
): Promise<RequireRoleResult> {
  const { user, error: authError } = await getUserFromRequest(request)

  if (authError || !user) {
    return {
      ok: false,
      response: NextResponse.json(
        { ok: false, error: 'Unauthorized: invalid or missing session' },
        { status: 401 }
      ),
    }
  }

  const admin = getSupabaseAdminClient()
  const { data: roleRow, error: roleError } = await admin
    .from('app_user_roles')
    .select('role,is_active')
    .eq('user_id', user.id)
    .maybeSingle()

  if (roleError) {
    console.error('[requireAppRole] role query failed', roleError)
    return {
      ok: false,
      response: NextResponse.json(
        { ok: false, error: 'Forbidden: role check failed' },
        { status: 403 }
      ),
    }
  }

  const role = String(roleRow?.role ?? '') as AppRole
  const isActive = roleRow?.is_active ?? true

  if (!role || !isActive || !allowedRoles.includes(role)) {
    return {
      ok: false,
      response: NextResponse.json(
        { ok: false, error: 'Forbidden: insufficient role' },
        { status: 403 }
      ),
    }
  }

  return {
    ok: true,
    userId: user.id,
    role,
  }
}