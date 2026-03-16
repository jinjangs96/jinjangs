import { NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { requireAppRole } from '@/lib/auth/require-app-role'

export async function GET(request: Request) {
  const auth = await requireAppRole(request, [
    'owner',
    'ops_manager',
  ])
  if (!auth.ok) return auth.response

  const errors: string[] = []
  const byRole = {
    owner: 0,
    ops_manager: 0,
    finance: 0,
    staff: 0,
    viewer: 0,
  }

  let totalMembers = 0

  try {
    const admin = getSupabaseAdminClient()
    const { data: roles, error: roleError } = await admin
      .from('app_user_roles')
      .select('user_id,role')

    if (roleError) {
      console.error('[members/summary] role query failed', roleError)
      errors.push(`select:app_user_roles:${roleError.message}`)
    } else {
      const uniqueUsers = new Set<string>()
      for (const row of roles ?? []) {
        const userId = String(row.user_id ?? '')
        const role = String(row.role ?? '')
        if (userId) uniqueUsers.add(userId)
        if (role === 'owner') byRole.owner += 1
        else if (role === 'ops_manager') byRole.ops_manager += 1
        else if (role === 'finance') byRole.finance += 1
        else if (role === 'staff') byRole.staff += 1
        else if (role === 'viewer') byRole.viewer += 1
      }
      totalMembers = uniqueUsers.size
    }

    // profiles 총 개수는 가능할 때만 보조로 사용
    const { count: profileCount, error: profileCountError } = await admin
      .from('profiles')
      .select('*', { count: 'exact', head: true })
    if (profileCountError) {
      console.error('[members/summary] profile count failed', profileCountError)
      errors.push(`count:profiles:${profileCountError.message}`)
    } else if (typeof profileCount === 'number') {
      totalMembers = Math.max(totalMembers, profileCount)
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('[members/summary] exception', error)
    errors.push(`exception:${message}`)
  }

  return NextResponse.json(
    {
      ok: true,
      totalMembers,
      byRole,
      errors,
    },
    { status: 200 }
  )
}
