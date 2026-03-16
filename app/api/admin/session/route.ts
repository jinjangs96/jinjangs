import { NextResponse } from 'next/server'
import { getSupabaseAdminClient, getSupabaseAnonServerClient } from '@/lib/supabase/admin'
import type { StaffRole } from '@/lib/types'
import { getDefaultPermissions } from '@/lib/admin/rbac'

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization')
    const accessToken = authHeader?.startsWith('Bearer ')
      ? authHeader.slice('Bearer '.length).trim()
      : ''

    if (!accessToken) {
      return NextResponse.json({ error: '인증 토큰이 필요합니다.' }, { status: 401 })
    }

    const anonClient = getSupabaseAnonServerClient()
    const { data: authData, error: authError } = await anonClient.auth.getUser(accessToken)
    if (authError || !authData.user) {
      return NextResponse.json({ error: '로그인 정보가 유효하지 않습니다.' }, { status: 401 })
    }

    const admin = getSupabaseAdminClient()
    const { data: roleData, error: roleError } = await admin
      .from('app_user_roles')
      .select('role,is_active')
      .eq('user_id', authData.user.id)
      .maybeSingle()

    if (roleError) {
      return NextResponse.json({ error: roleError.message }, { status: 400 })
    }

    if (!roleData || roleData.is_active === false) {
      return NextResponse.json({ error: '어드민 권한이 없습니다.' }, { status: 403 })
    }

    const role = roleData.role as StaffRole
    const permissions = getDefaultPermissions(role)

    return NextResponse.json({
      success: true,
      user: {
        id: authData.user.id,
        email: authData.user.email || '',
        name: (authData.user.user_metadata?.full_name as string) || authData.user.email || '관리자',
      },
      role,
      permissions,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : '세션 확인 중 오류가 발생했습니다.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
