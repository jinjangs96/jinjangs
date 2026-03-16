import { NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { assertAdminPermissionByAccessToken } from '@/lib/auth/admin-role'

export async function GET(request: Request) {
  const auth = await assertAdminPermissionByAccessToken(request.headers.get('authorization'), 'users.view')
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: 403 })

  try {
    const admin = getSupabaseAdminClient()
    const [{ data: roles, error: roleError }, { data: profiles, error: profileError }] = await Promise.all([
      admin.from('app_user_roles').select('*'),
      admin.from('profiles').select('id,email,full_name,phone'),
    ])
    if (roleError) return NextResponse.json({ error: roleError.message }, { status: 400 })
    if (profileError) return NextResponse.json({ error: profileError.message }, { status: 400 })

    const profileMap = new Map((profiles ?? []).map((profile) => [profile.id, profile]))
    const users = (roles ?? []).map((role) => {
      const profile = profileMap.get(role.user_id)
      return {
        user_id: role.user_id,
        role: role.role,
        is_active: role.is_active,
        full_name: profile?.full_name || null,
        email: profile?.email || null,
        phone: profile?.phone || null,
      }
    })

    return NextResponse.json({ success: true, users })
  } catch (error) {
    const message = error instanceof Error ? error.message : '사용자 목록 조회 중 오류가 발생했습니다.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
